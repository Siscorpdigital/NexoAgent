"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { notificarModoHumano } from "@/lib/push-notifications";
import { auth } from "@/lib/auth";

export async function reactivarIA(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return;
  await prisma.conversacion.update({
    where: { id },
    data: { modoHumano: false },
  });
  revalidatePath("/dashboard/conversaciones");
  revalidatePath(`/dashboard/conversaciones/${id}`);
}

export async function activarModoHumano(
  conversacionId: string,
  empresaId: string,
  numeroCliente: string
) {
  await prisma.conversacion.update({
    where: { id: conversacionId },
    data: { modoHumano: true },
  });

  // Enviar notificación push
  try {
    await notificarModoHumano(empresaId, conversacionId, numeroCliente);
  } catch (error) {
    console.error("Error al enviar notificación de modo humano:", error);
  }

  revalidatePath(`/empresa/${empresaId}/conversaciones`);
  revalidatePath(`/empresa/${empresaId}/conversaciones/${conversacionId}`);
}

/**
 * Alterna el control de una conversación entre el agente virtual (IA) y un
 * humano según el campo `modo` ("humano" | "ia"). Revalida las rutas de la
 * empresa para reflejar el cambio en la lista y el detalle.
 */
export async function cambiarControlConversacion(formData: FormData) {
  const conversacionId = formData.get("conversacionId") as string;
  const empresaId = formData.get("empresaId") as string;
  const numeroCliente = (formData.get("numeroCliente") as string) || "";
  const modo = formData.get("modo") as string;

  if (!conversacionId || !empresaId) {
    console.error("Datos incompletos para cambiar el control de la conversación");
    return;
  }

  const modoHumano = modo === "humano";

  await prisma.conversacion.update({
    where: { id: conversacionId },
    data: { modoHumano },
  });

  // Al pasar a humano, notificar al equipo
  if (modoHumano) {
    try {
      await notificarModoHumano(empresaId, conversacionId, numeroCliente);
    } catch (error) {
      console.error("Error al enviar notificación de modo humano:", error);
    }
  }

  revalidatePath(`/empresa/${empresaId}/conversaciones`);
  revalidatePath(`/empresa/${empresaId}/conversaciones/${conversacionId}`);
}

export async function activarModoHumanoFormData(formData: FormData) {
  const conversacionId = formData.get("conversacionId") as string;
  const empresaId = formData.get("empresaId") as string;
  const numeroCliente = formData.get("numeroCliente") as string;

  if (!conversacionId || !empresaId || !numeroCliente) {
    console.error("Datos incompletos para activar modo humano");
    return;
  }

  await activarModoHumano(conversacionId, empresaId, numeroCliente);
}

export async function enviarMensajeHumano(formData: FormData) {
  const session = await auth();
  if (!session) {
    console.error("No autenticado");
    return;
  }

  const conversacionId = formData.get("conversacionId") as string;
  const empresaId = formData.get("empresaId") as string;
  const contenido = formData.get("contenido") as string;

  if (!conversacionId || !empresaId || !contenido || contenido.trim() === "") {
    console.error("Datos incompletos");
    return;
  }

  try {
    // Obtener la conversación con la empresa
    const conversacion = await prisma.conversacion.findUnique({
      where: { id: conversacionId },
      include: { empresa: true },
    });

    if (!conversacion || conversacion.empresaId !== empresaId) {
      console.error("Conversación no encontrada");
      return;
    }

    // Guardar el mensaje en la base de datos
    await prisma.mensaje.create({
      data: {
        conversacionId,
        contenido: contenido.trim(),
        rol: "ASISTENTE",
      },
    });

    // Enviar mensaje por WhatsApp usando Twilio
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_WHATSAPP_FROM;

    if (accountSid && authToken && from) {
      try {
        const response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              From: from,
              To: `whatsapp:${conversacion.numeroCliente}`,
              Body: contenido.trim(),
            }),
          }
        );

        if (!response.ok) {
          console.error("Error enviando mensaje por WhatsApp:", await response.text());
        }
      } catch (error) {
        console.error("Error al enviar por Twilio:", error);
      }
    }

    // Revalidar las rutas para actualizar la UI
    revalidatePath(`/empresa/${empresaId}/conversaciones`);
    revalidatePath(`/empresa/${empresaId}/conversaciones/${conversacionId}`);
  } catch (error) {
    console.error("Error al enviar mensaje:", error);
  }
}
