"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  guardarMemoriaSchema,
  eliminarMemoriaSchema,
  isValidCuid,
  sanitizeString,
} from "@/lib/validations";
import { z } from "zod";

export async function agregarMemoria(formData: FormData) {
  try {
    const rawData = {
      empresaId: formData.get("empresaId"),
      categoria: formData.get("categoria"),
      clave: formData.get("clave"),
      valor: formData.get("valor"),
    };

    const validated = guardarMemoriaSchema.parse(rawData);

    await prisma.memoriaEmpresa.create({
      data: {
        empresaId: validated.empresaId,
        categoria: validated.categoria,
        clave: sanitizeString(validated.clave),
        valor: sanitizeString(validated.valor),
      },
    });

    revalidatePath(`/empresa/${validated.empresaId}/memoria`);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validación fallida:", error.issues);
      throw new Error(error.issues[0]?.message || "Datos inválidos");
    }
    console.error("Error al agregar memoria:", error);
    throw new Error("Error al agregar memoria");
  }
}

export async function eliminarMemoria(formData: FormData) {
  try {
    const rawData = {
      id: formData.get("id"),
    };

    const validated = eliminarMemoriaSchema.parse(rawData);
    const empresaId = formData.get("empresaId") as string;

    if (!empresaId || !isValidCuid(empresaId)) {
      throw new Error("ID de empresa inválido");
    }

    // Verificar que la memoria pertenece a la empresa
    const memoria = await prisma.memoriaEmpresa.findFirst({
      where: { id: validated.id, empresaId },
      select: { id: true },
    });

    if (!memoria) {
      throw new Error("Memoria no encontrada");
    }

    await prisma.memoriaEmpresa.delete({ where: { id: validated.id } });
    revalidatePath(`/empresa/${empresaId}/memoria`);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validación fallida:", error.issues);
      throw new Error(error.issues[0]?.message || "Datos inválidos");
    }
    console.error("Error al eliminar memoria:", error);
    throw new Error("Error al eliminar memoria");
  }
}
