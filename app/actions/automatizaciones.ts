"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  crearAutomatizacionSchema,
  eliminarAutomatizacionSchema,
  isValidCuid,
  sanitizeString,
} from "@/lib/validations";
import { z } from "zod";

export async function crearAutomatizacion(formData: FormData) {
  try {
    const rawData = {
      empresaId: formData.get("empresaId"),
      nombre: formData.get("nombre"),
      trigger: formData.get("trigger"),
      condicion: formData.get("condicion") || null,
      mensaje: formData.get("mensaje"),
      activa: true,
    };

    const validated = crearAutomatizacionSchema.parse(rawData);

    await prisma.automatizacion.create({
      data: {
        empresaId: validated.empresaId,
        nombre: sanitizeString(validated.nombre),
        trigger: validated.trigger,
        condicion: validated.condicion ? sanitizeString(validated.condicion) : null,
        mensaje: sanitizeString(validated.mensaje),
        activa: validated.activa,
      },
    });

    redirect(`/empresa/${validated.empresaId}/automatizaciones`);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validación fallida:", error.issues);
      throw new Error(error.issues[0]?.message || "Datos inválidos");
    }
    console.error("Error al crear automatización:", error);
    throw new Error("Error al crear automatización");
  }
}

export async function toggleAutomatizacion(formData: FormData) {
  try {
    const id = formData.get("id") as string;
    const empresaId = formData.get("empresaId") as string;
    const activa = formData.get("activa") === "true";

    if (!id || !isValidCuid(id) || !empresaId || !isValidCuid(empresaId)) {
      throw new Error("ID inválido");
    }

    // Verificar que la automatización pertenece a la empresa
    const automatizacion = await prisma.automatizacion.findFirst({
      where: { id, empresaId },
      select: { id: true },
    });

    if (!automatizacion) {
      throw new Error("Automatización no encontrada");
    }

    await prisma.automatizacion.update({
      where: { id },
      data: { activa: !activa },
    });

    revalidatePath(`/empresa/${empresaId}/automatizaciones`);
  } catch (error) {
    console.error("Error al cambiar estado de automatización:", error);
    throw error;
  }
}

export async function eliminarAutomatizacion(formData: FormData) {
  try {
    const rawData = {
      id: formData.get("id"),
    };

    const validated = eliminarAutomatizacionSchema.parse(rawData);
    const empresaId = formData.get("empresaId") as string;

    if (!empresaId || !isValidCuid(empresaId)) {
      throw new Error("ID de empresa inválido");
    }

    // Verificar que la automatización pertenece a la empresa
    const automatizacion = await prisma.automatizacion.findFirst({
      where: { id: validated.id, empresaId },
      select: { id: true },
    });

    if (!automatizacion) {
      throw new Error("Automatización no encontrada");
    }

    await prisma.automatizacion.delete({ where: { id: validated.id } });
    revalidatePath(`/empresa/${empresaId}/automatizaciones`);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validación fallida:", error.issues);
      throw new Error(error.issues[0]?.message || "Datos inválidos");
    }
    console.error("Error al eliminar automatización:", error);
    throw new Error("Error al eliminar automatización");
  }
}
