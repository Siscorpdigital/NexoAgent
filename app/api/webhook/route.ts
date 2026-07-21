import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { generarRespuesta } from "@/lib/claude";
import { buscarRelevantes } from "@/lib/chunker";
import { evaluarAutomatizaciones } from "@/lib/automatizaciones";
import { setCredentials, createEvent } from "@/lib/google-calendar";
import { verificarDisponibilidad, sugerirHorarios } from "@/lib/disponibilidad";
import { notificarNuevoMensaje, notificarModoHumano, notificarNuevaCita } from "@/lib/push-notifications";
import { obtenerOAsignarAgente } from "@/lib/agente-router";
import { enviarMensajeWhatsApp } from "@/lib/whatsapp-meta";
import { logger } from "@/lib/logger";

const FRASES_HUMANO = [
  "quiero hablar con una persona",
  "quiero hablar con un humano",
  "quiero hablar con un agente",
  "hablar con alguien",
  "hablar con una persona",
  "atención humana",
  "operador",
  "agente humano",
  "persona real",
  "necesito ayuda humana",
  "necesito un humano",
  "necesito un operador",
  "necesito un agente",
  "asesor humano",
  "representante",
  "soporte humano",
  "persona de verdad",
  "alguien real",
  "asistencia humana",
];

function solicitaHumano(mensaje: string): boolean {
  const lower = mensaje.toLowerCase();
  return FRASES_HUMANO.some((frase) => lower.includes(frase));
}

const soloDigitos = (s: string | undefined | null) => (s || "").replace(/\D/g, "");

// ============================================================
// GET — Verificación del webhook (Meta)
// ============================================================
export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
  if (!verifyToken) {
    logger.error("[webhook] WHATSAPP_VERIFY_TOKEN no configurado");
    return new Response("Configuración incompleta", { status: 500 });
  }

  if (mode === "subscribe" && token === verifyToken) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Verificación fallida", { status: 403 });
}

// ============================================================
// POST — Mensajes entrantes (Meta Cloud API, formato JSON)
// ============================================================
export async function POST(request: Request) {
  let payload: MetaWebhookPayload;
  try {
    payload = (await request.json()) as MetaWebhookPayload;
  } catch {
    return new Response("EVENT_RECEIVED", { status: 200 });
  }

  // Extraer el primer mensaje entrante (ignorar estados de entrega/lectura).
  const value = payload?.entry?.[0]?.changes?.[0]?.value;
  const message = value?.messages?.[0];

  if (!value || !message) {
    // Estados (statuses) u otros eventos: confirmar recepción sin procesar.
    return new Response("EVENT_RECEIVED", { status: 200 });
  }

  const phoneNumberId = value.metadata?.phone_number_id;
  const displayPhone = value.metadata?.display_phone_number;
  const from = message.from; // número del cliente (sin +)
  const contactName = value.contacts?.[0]?.profile?.name;
  const texto =
    message.type === "text"
      ? message.text?.body ?? ""
      : "";

  // Procesar en segundo plano y responder 200 de inmediato (evita reintentos de Meta).
  after(async () => {
    try {
      await procesarMensaje({ phoneNumberId, displayPhone, from, texto, tipo: message.type, contactName });
    } catch (error) {
      logger.error("[webhook] Error procesando mensaje:", error);
    }
  });

  return new Response("EVENT_RECEIVED", { status: 200 });
}

// ============================================================
// Lógica de negocio (idéntica al flujo anterior; solo cambia el transporte)
// ============================================================
async function procesarMensaje(opts: {
  phoneNumberId?: string;
  displayPhone?: string;
  from: string;
  texto: string;
  tipo: string;
  contactName?: string;
}) {
  const { phoneNumberId, displayPhone, from, texto, tipo, contactName } = opts;

  const enviar = (mensaje: string) => enviarMensajeWhatsApp(phoneNumberId, from, mensaje);

  if (!from) return;

  logger.info(`📨 Mensaje de ${from}: ${texto || `[${tipo}]`}`);

  // Localizar el número de la empresa. En Meta identificamos el número por
  // display_phone_number; si no coincide, en modo un solo número usamos el
  // principal/primero (despliegue mono-empresa).
  const numeros = await prisma.numeroWhatsApp.findMany({
    include: {
      empresa: {
        include: {
          documentos: true,
          memoria: true,
          automatizaciones: { where: { activa: true } },
        },
      },
    },
    orderBy: [{ esPrincipal: "desc" }, { creadoEn: "asc" }],
  });

  const dPhone = soloDigitos(displayPhone);
  let numeroWhatsApp =
    numeros.find((n) => {
      const d = soloDigitos(n.telefono);
      return d && dPhone && (d.endsWith(dPhone) || dPhone.endsWith(d));
    }) || (numeros.length === 1 ? numeros[0] : numeros.find((n) => n.esPrincipal)) || numeros[0];

  if (!numeroWhatsApp || !numeroWhatsApp.empresa) {
    logger.info("⚠️ No se encontró empresa para el número:", displayPhone);
    await enviar("Hola, este servicio no está configurado todavía.");
    return;
  }

  const empresa = numeroWhatsApp.empresa;
  const numeroCliente = from;

  // Si el mensaje no es de texto, pedir texto (salvo modo humano).
  if (tipo !== "text" || !texto.trim()) {
    // Aun así registramos el contacto/conversación para no perder el hilo.
    await enviar("Por ahora solo puedo leer mensajes de texto 🙂 ¿Me lo escribes, por favor?");
    return;
  }

  const body = texto;

  // Contacto (CRM) automático
  let contacto = await prisma.contacto.findUnique({
    where: { empresaId_telefono: { empresaId: empresa.id, telefono: numeroCliente } },
  });
  if (!contacto) {
    contacto = await prisma.contacto.create({
      data: {
        empresaId: empresa.id,
        telefono: numeroCliente,
        nombre: contactName || null,
      },
    });
  }

  let conversacion = await prisma.conversacion.findFirst({
    where: {
      empresaId: empresa.id,
      numeroCliente,
      numeroWhatsAppId: numeroWhatsApp.id,
    },
  });

  if (!conversacion) {
    conversacion = await prisma.conversacion.create({
      data: {
        empresaId: empresa.id,
        numeroCliente,
        contactoId: contacto.id,
        numeroWhatsAppId: numeroWhatsApp.id,
      },
    });
  }

  await prisma.mensaje.create({
    data: {
      conversacionId: conversacion.id,
      contenido: body,
      rol: "CLIENTE",
    },
  });

  // Notificar nuevo mensaje
  try {
    await notificarNuevoMensaje(empresa.id, conversacion.id, numeroCliente, body);
  } catch (error) {
    logger.error("❌ Error al enviar notificación de nuevo mensaje:", error);
  }

  // ¿Solicita atención humana?
  if (solicitaHumano(body)) {
    await prisma.conversacion.update({
      where: { id: conversacion.id },
      data: { modoHumano: true },
    });
    try {
      await notificarModoHumano(empresa.id, conversacion.id, numeroCliente);
    } catch (error) {
      logger.error("❌ Error al enviar notificación de modo humano:", error);
    }
    await enviar("Entendido, en breve un agente humano te atenderá. Por favor espera.");
    return;
  }

  if (conversacion.modoHumano) {
    await enviar("Un agente humano revisará tu mensaje pronto.");
    return;
  }

  // Automatizaciones
  const totalMensajes = await prisma.mensaje.count({
    where: { conversacionId: conversacion.id },
  });
  const esPrimerMensaje = totalMensajes === 1;

  const autoActivada = evaluarAutomatizaciones(empresa.automatizaciones, body, esPrimerMensaje);

  if (autoActivada) {
    await prisma.automatizacion.update({
      where: { id: autoActivada.id },
      data: { ejecuciones: { increment: 1 } },
    });
    await prisma.mensaje.create({
      data: {
        conversacionId: conversacion.id,
        contenido: autoActivada.mensaje,
        rol: "ASISTENTE",
      },
    });
    await enviar(autoActivada.mensaje);
    return;
  }

  // Historial (10 más recientes, en orden cronológico)
  const historial = (
    await prisma.mensaje.findMany({
      where: { conversacionId: conversacion.id },
      orderBy: { creadoEn: "desc" },
      take: 10,
    })
  ).reverse();

  // Conocimiento relevante
  const todosLosChunks = await prisma.documentoChunk.findMany({
    where: { empresaId: empresa.id },
    select: { id: true, contenido: true, indice: true },
  });
  const chunksRelevantes = buscarRelevantes(body, todosLosChunks);

  // Agente asignado
  const agenteData = await obtenerOAsignarAgente(conversacion.id, empresa.id, body);
  const promptUtilizar =
    agenteData?.prompt || empresa.promptSistema || "Eres un asistente virtual amable y profesional.";

  const resultado = await generarRespuesta(
    empresa.nombre,
    historial,
    promptUtilizar,
    chunksRelevantes.length > 0
      ? [{ nombre: "Base de conocimiento", contenido: chunksRelevantes.join("\n\n---\n\n") }]
      : empresa.documentos,
    empresa.memoria,
  );

  // Tool: verificar disponibilidad
  if (resultado.tool?.tipo === "verificar_disponibilidad") {
    const { fecha, hora, duracion, preferencia } = resultado.tool;

    if (hora) {
      const { disponible } = await verificarDisponibilidad(empresa.id, fecha, hora, duracion);
      const respuestaDisponibilidad = disponible
        ? `Perfecto, el ${fecha} a las ${hora} sí está disponible 😊 ¿Me confirmas tu nombre para apartar el horario?`
        : `Ay, justo a las ${hora} ya tengo ocupado ese día 😅 ¿Te vendría bien en otro horario?`;

      await prisma.mensaje.create({
        data: { conversacionId: conversacion.id, contenido: respuestaDisponibilidad, rol: "ASISTENTE" },
      });
      await enviar(respuestaDisponibilidad);
      return;
    } else {
      const sugerencias = await sugerirHorarios(empresa.id, fecha, duracion, preferencia);
      let respuestaSugerencias: string;
      if (sugerencias.length > 0) {
        const horariosFormateados = sugerencias.map((h) => {
          const [hh] = h.split(":");
          const horaNum = parseInt(hh);
          if (horaNum < 12) return `${h} (mañana)`;
          if (horaNum < 18) return `${h} (tarde)`;
          return `${h} (noche)`;
        });
        respuestaSugerencias = `Mira, tengo libre el ${fecha} a las ${horariosFormateados.join(", o a las ")}. ¿Cuál te acomoda mejor?`;
      } else {
        respuestaSugerencias = `Uy, ese día está full 😅 ¿Te sirve otro día?`;
      }

      await prisma.mensaje.create({
        data: { conversacionId: conversacion.id, contenido: respuestaSugerencias, rol: "ASISTENTE" },
      });
      await enviar(respuestaSugerencias);
      return;
    }
  }

  // Tool: crear cita
  if (resultado.tool?.tipo === "crear_cita") {
    const { nombreCliente, telefono, fecha, hora, duracion, notas } = resultado.tool;

    const { disponible } = await verificarDisponibilidad(empresa.id, fecha, hora, duracion);

    if (!disponible) {
      const sugerencias = await sugerirHorarios(empresa.id, fecha, duracion);
      let respuestaConflicto = `${nombreCliente}, justo a esa hora ya tengo ocupado 😅`;
      if (sugerencias.length > 0) {
        respuestaConflicto += ` Pero tengo libre a las ${sugerencias.join(" o a las ")}. ¿Te sirve alguno?`;
      } else {
        respuestaConflicto += ` ¿Qué tal otro día? Dime cuándo y lo revisamos.`;
      }
      await prisma.mensaje.create({
        data: { conversacionId: conversacion.id, contenido: respuestaConflicto, rol: "ASISTENTE" },
      });
      await enviar(respuestaConflicto);
      return;
    }

    const fechaHora = new Date(`${fecha}T${hora}:00`);
    const fin = new Date(fechaHora.getTime() + duracion * 60 * 1000);

    let contactoCita = await prisma.contacto.findUnique({
      where: { empresaId_telefono: { empresaId: empresa.id, telefono } },
    });
    if (!contactoCita) {
      contactoCita = await prisma.contacto.create({
        data: { empresaId: empresa.id, telefono, nombre: nombreCliente },
      });
    }

    let googleEventId: string | null = null;
    let googleCalendarLink: string | null = null;
    if (empresa.googleAccessToken && empresa.googleCalendarId) {
      try {
        const authG = setCredentials(empresa.googleAccessToken, empresa.googleRefreshToken || undefined);
        const event = await createEvent(authG, empresa.googleCalendarId, {
          summary: `Cita/Tarea: ${nombreCliente}`,
          description: `Tel: ${telefono}\n${notas || "Agendado por WhatsApp"}`,
          start: fechaHora,
          end: fin,
        });
        googleEventId = event.id;
        googleCalendarLink = event.link;
      } catch (error) {
        logger.error("Error creando evento en Google Calendar:", error);
      }
    }

    const citaCreada = await prisma.cita.create({
      data: {
        empresaId: empresa.id,
        contactoId: contactoCita.id,
        nombreCliente,
        telefono,
        inicio: fechaHora,
        fin,
        notas: notas || `Agendado por WhatsApp`,
        googleEventId,
        googleCalendarLink,
      },
    });

    try {
      await notificarNuevaCita(empresa.id, citaCreada.id, nombreCliente, fechaHora);
    } catch (error) {
      logger.error("Error al enviar notificación de nueva cita:", error);
    }

    logger.info(`📅 Cita creada automáticamente: ${nombreCliente} - ${fecha} ${hora}`);
  }

  // Guardar y enviar la respuesta del asistente
  await prisma.mensaje.create({
    data: { conversacionId: conversacion.id, contenido: resultado.respuesta, rol: "ASISTENTE" },
  });

  await enviar(resultado.respuesta);
}

// ============================================================
// Tipos del payload de Meta (mínimos)
// ============================================================
type MetaWebhookPayload = {
  entry?: Array<{
    changes?: Array<{
      value?: {
        metadata?: { display_phone_number?: string; phone_number_id?: string };
        contacts?: Array<{ profile?: { name?: string }; wa_id?: string }>;
        messages?: Array<{
          from: string;
          id: string;
          type: string;
          text?: { body?: string };
        }>;
        statuses?: unknown[];
      };
    }>;
  }>;
};
