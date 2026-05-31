"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  crearContactoSchema,
  actualizarContactoSchema,
  isValidCuid,
  sanitizeString,
  sanitizePhone,
} from "@/lib/validations";
import { z } from "zod";

export async function actualizarContacto(formData: FormData) {
  try {
    const empresaId = formData.get("empresaId") as string;

    const rawData = {
      id: formData.get("id"),
      nombre: formData.get("nombre") || null,
      tipo: formData.get("tipo"),
      notas: formData.get("notas") || null,
    };

    const validated = actualizarContactoSchema.parse(rawData);

    await prisma.contacto.update({
      where: { id: validated.id },
      data: {
        nombre: validated.nombre ? sanitizeString(validated.nombre) : null,
        tipo: validated.tipo,
        notas: validated.notas ? sanitizeString(validated.notas) : null,
      },
    });

    revalidatePath(`/empresa/${empresaId}/crm`);
    redirect(`/empresa/${empresaId}/crm/${validated.id}?guardado=1`);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validación fallida:", error.issues);
      throw new Error(error.issues[0]?.message || "Datos inválidos");
    }
    console.error("Error al actualizar contacto:", error);
    throw new Error("Error al actualizar contacto");
  }
}

export async function crearContacto(formData: FormData) {
  try {
    const rawData = {
      empresaId: formData.get("empresaId"),
      nombre: formData.get("nombre") || null,
      telefono: formData.get("telefono"),
      tipo: formData.get("tipo") || "LEAD",
      notas: formData.get("notas") || null,
    };

    const validated = crearContactoSchema.parse(rawData);

    // Verificar si el contacto ya existe para esta empresa
    const existente = await prisma.contacto.findUnique({
      where: {
        empresaId_telefono: {
          empresaId: validated.empresaId,
          telefono: sanitizePhone(validated.telefono),
        },
      },
    });

    if (existente) {
      throw new Error("Ya existe un contacto con este teléfono");
    }

    await prisma.contacto.create({
      data: {
        empresaId: validated.empresaId,
        telefono: sanitizePhone(validated.telefono),
        nombre: validated.nombre ? sanitizeString(validated.nombre) : null,
        tipo: validated.tipo,
        notas: validated.notas ? sanitizeString(validated.notas) : null,
      },
    });

    revalidatePath(`/empresa/${validated.empresaId}/crm`);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validación fallida:", error.issues);
      throw new Error(error.issues[0]?.message || "Datos inválidos");
    }
    console.error("Error al crear contacto:", error);
    throw error;
  }
}

export async function eliminarContacto(formData: FormData) {
  try {
    const id = formData.get("id") as string;
    const empresaId = formData.get("empresaId") as string;

    if (!id || !isValidCuid(id) || !empresaId || !isValidCuid(empresaId)) {
      throw new Error("ID inválido");
    }

    // Verificar que el contacto pertenece a la empresa
    const contacto = await prisma.contacto.findFirst({
      where: { id, empresaId },
      select: { id: true },
    });

    if (!contacto) {
      throw new Error("Contacto no encontrado");
    }

    await prisma.contacto.delete({ where: { id } });

    revalidatePath(`/empresa/${empresaId}/crm`);
    redirect(`/empresa/${empresaId}/crm`);
  } catch (error) {
    console.error("Error al eliminar contacto:", error);
    throw new Error("Error al eliminar contacto");
  }
}
