"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { setCredentials, createEvent, updateEvent, deleteEvent } from "@/lib/google-calendar";
import {
  crearCitaSchema,
  actualizarCitaSchema,
  isValidCuid,
  sanitizeString,
  sanitizePhone,
} from "@/lib/validations";
import { z } from "zod";

export async function crearCita(formData: FormData) {
  try {
    const duracion = parseInt(formData.get("duracion") as string) || 60;
    const inicioStr = formData.get("inicio") as string;
    const inicioDate = new Date(inicioStr);
    const finDate = new Date(inicioDate.getTime() + duracion * 60 * 1000);

    const rawData = {
      empresaId: formData.get("empresaId"),
      nombreCliente: formData.get("nombreCliente"),
      telefono: formData.get("telefono"),
      inicio: inicioDate,
      fin: finDate,
      notas: formData.get("notas") || null,
    };

    const validated = crearCitaSchema.parse(rawData);

    // Validar que la fecha de inicio sea futura
    if (validated.inicio < new Date()) {
      throw new Error("La fecha de la cita debe ser futura");
    }

    // Buscar si el contacto existe
    const telefonoSanitizado = sanitizePhone(validated.telefono);
    const contacto = await prisma.contacto.findUnique({
      where: { empresaId_telefono: { empresaId: validated.empresaId, telefono: telefonoSanitizado } },
    });

    const empresa = await prisma.empresa.findUnique({
      where: { id: validated.empresaId },
      select: { googleAccessToken: true, googleRefreshToken: true, googleCalendarId: true },
    });

    let googleEventId: string | null = null;
    let googleCalendarLink: string | null = null;

    // Crear evento en Google Calendar si está conectado
    if (empresa?.googleAccessToken && empresa.googleCalendarId) {
      try {
        const auth = setCredentials(empresa.googleAccessToken, empresa.googleRefreshToken || undefined);
        const event = await createEvent(auth, empresa.googleCalendarId, {
          summary: `Cita con ${sanitizeString(validated.nombreCliente)}`,
          description: `Tel: ${telefonoSanitizado}\n${validated.notas ? sanitizeString(validated.notas) : ""}`,
          start: validated.inicio,
          end: validated.fin,
        });
        googleEventId = event.id;
        googleCalendarLink = event.link;
      } catch (error) {
        console.error("Error creando evento en Google Calendar:", error);
      }
    }

    await prisma.cita.create({
      data: {
        empresaId: validated.empresaId,
        contactoId: contacto?.id ?? null,
        nombreCliente: sanitizeString(validated.nombreCliente),
        telefono: telefonoSanitizado,
        inicio: validated.inicio,
        fin: validated.fin,
        notas: validated.notas ? sanitizeString(validated.notas) : null,
        googleEventId,
        googleCalendarLink,
      },
    });

    revalidatePath(`/empresa/${validated.empresaId}/agenda`);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validación fallida:", error.issues);
      throw new Error(error.issues[0]?.message || "Datos inválidos");
    }
    console.error("Error al crear cita:", error);
    throw error;
  }
}

export async function cambiarEstadoCita(formData: FormData) {
  try {
    const rawData = {
      id: formData.get("id"),
      estado: formData.get("estado"),
      notas: formData.get("notas") || null,
    };

    const validated = actualizarCitaSchema.parse(rawData);
    const empresaId = formData.get("empresaId") as string;

    if (!empresaId || !isValidCuid(empresaId)) {
      throw new Error("ID de empresa inválido");
    }

    const cita = await prisma.cita.findUnique({
      where: { id: validated.id },
      include: { empresa: { select: { googleAccessToken: true, googleRefreshToken: true, googleCalendarId: true } } },
    });

    if (!cita) {
      throw new Error("Cita no encontrada");
    }

    // Validar que la cita pertenece a la empresa
    if (cita.empresaId !== empresaId) {
      throw new Error("No tienes permisos para modificar esta cita");
    }

    // Actualizar en Google Calendar si existe el evento
    if (cita.googleEventId && cita.empresa.googleAccessToken && cita.empresa.googleCalendarId) {
      try {
        const auth = setCredentials(cita.empresa.googleAccessToken, cita.empresa.googleRefreshToken || undefined);
        await updateEvent(auth, cita.empresa.googleCalendarId, cita.googleEventId, {
          status: validated.estado === "CANCELADA" ? "cancelled" : "confirmed",
        });
      } catch (error) {
        console.error("Error actualizando evento en Google Calendar:", error);
      }
    }

    await prisma.cita.update({
      where: { id: validated.id },
      data: {
        estado: validated.estado,
        notas: validated.notas ? sanitizeString(validated.notas) : null,
      },
    });

    revalidatePath(`/empresa/${empresaId}/agenda`);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validación fallida:", error.issues);
      throw new Error(error.issues[0]?.message || "Datos inválidos");
    }
    console.error("Error al cambiar estado de cita:", error);
    throw error;
  }
}

export async function eliminarCita(formData: FormData) {
  try {
    const id = formData.get("id") as string;
    const empresaId = formData.get("empresaId") as string;

    if (!id || !isValidCuid(id) || !empresaId || !isValidCuid(empresaId)) {
      throw new Error("ID inválido");
    }

    const cita = await prisma.cita.findUnique({
      where: { id },
      include: { empresa: { select: { googleAccessToken: true, googleRefreshToken: true, googleCalendarId: true } } },
    });

    if (!cita) {
      throw new Error("Cita no encontrada");
    }

    // Validar que la cita pertenece a la empresa
    if (cita.empresaId !== empresaId) {
      throw new Error("No tienes permisos para eliminar esta cita");
    }

    // Eliminar de Google Calendar si existe
    if (cita.googleEventId && cita.empresa.googleAccessToken && cita.empresa.googleCalendarId) {
      try {
        const auth = setCredentials(cita.empresa.googleAccessToken, cita.empresa.googleRefreshToken || undefined);
        await deleteEvent(auth, cita.empresa.googleCalendarId, cita.googleEventId);
      } catch (error) {
        console.error("Error eliminando evento en Google Calendar:", error);
      }
    }

    await prisma.cita.delete({ where: { id } });
    revalidatePath(`/empresa/${empresaId}/agenda`);
  } catch (error) {
    console.error("Error al eliminar cita:", error);
    throw error;
  }
}

export async function desconectarGoogleCalendar(formData: FormData) {
  try {
    const empresaId = formData.get("empresaId") as string;

    if (!empresaId || !isValidCuid(empresaId)) {
      throw new Error("ID de empresa inválido");
    }

    await prisma.empresa.update({
      where: { id: empresaId },
      data: {
        googleAccessToken: null,
        googleRefreshToken: null,
        googleCalendarId: null,
        googleTokenExpiry: null,
      },
    });

    revalidatePath(`/empresa/${empresaId}/agenda`);
    redirect(`/empresa/${empresaId}/agenda?google_disconnected=1`);
  } catch (error) {
    console.error("Error al desconectar Google Calendar:", error);
    throw new Error("Error al desconectar Google Calendar");
  }
}

export async function guardarCalendly(formData: FormData) {
  try {
    const empresaId = formData.get("empresaId") as string;
    const calendlyUrl = formData.get("calendlyUrl") as string;

    if (!empresaId || !isValidCuid(empresaId)) {
      throw new Error("ID de empresa inválido");
    }

    // Validar URL de Calendly si se proporciona
    if (calendlyUrl && calendlyUrl.trim()) {
      const urlPattern = /^https?:\/\/.+/i;
      if (!urlPattern.test(calendlyUrl.trim())) {
        throw new Error("URL de Calendly inválida");
      }
    }

    await prisma.empresa.update({
      where: { id: empresaId },
      data: { calendlyUrl: calendlyUrl?.trim() || null },
    });

    revalidatePath(`/empresa/${empresaId}/agenda`);
  } catch (error) {
    console.error("Error al guardar URL de Calendly:", error);
    throw error;
  }
}
