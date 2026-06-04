"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  crearEmpresaSchema,
  editarEmpresaSchema,
  actualizarPromptSchema,
  isValidCuid,
  sanitizeString,
  sanitizePhone,
} from "@/lib/validations";
import { z } from "zod";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export async function crearEmpresa(formData: FormData) {
  try {
    const rawData = {
      nombre: formData.get("nombre"),
      telefono: formData.get("telefono"),
      rif: formData.get("rif") || null,
      nif: formData.get("nif") || null,
      responsable: formData.get("responsable") || null,
      direccion: formData.get("direccion") || null,
      email: formData.get("email") || null,
    };

    const validated = crearEmpresaSchema.parse(rawData);

    await prisma.empresa.create({
      data: {
        nombre: sanitizeString(validated.nombre),
        telefonoWhatsapp: sanitizePhone(validated.telefono),
        rif: validated.rif ? sanitizeString(validated.rif) : null,
        nif: validated.nif ? sanitizeString(validated.nif) : null,
        responsable: validated.responsable ? sanitizeString(validated.responsable) : null,
        direccion: validated.direccion ? sanitizeString(validated.direccion) : null,
        email: validated.email,
      },
    });

    revalidatePath("/dashboard/empresas");
    revalidatePath("/admin");
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validación fallida:", error.issues);
      throw new Error(error.issues[0]?.message || "Datos inválidos");
    }
    console.error("Error al crear empresa:", error);
    throw new Error("Error al crear empresa");
  }
}

export async function editarEmpresa(formData: FormData) {
  try {
    const rawData = {
      id: formData.get("id"),
      nombre: formData.get("nombre"),
      telefono: formData.get("telefono") || null,
      telefonoWhatsapp: formData.get("telefonoWhatsapp"),
      rif: formData.get("rif") || null,
      nif: formData.get("nif") || null,
      responsable: formData.get("responsable") || null,
      direccion: formData.get("direccion") || null,
      email: formData.get("email") || null,
    };

    const validated = editarEmpresaSchema.parse(rawData);

    // Validar que el WhatsApp no esté en uso por otra empresa
    const empresaConWhatsapp = await prisma.empresa.findFirst({
      where: {
        telefonoWhatsapp: validated.telefonoWhatsapp,
        id: { not: validated.id },
      },
    });

    if (empresaConWhatsapp) {
      redirect(`/admin/empresas/${validated.id}/editar?error=${encodeURIComponent("Ya existe una empresa con ese WhatsApp")}`);
    }

    // Validar que el RIF no esté en uso por otra empresa (si se proporcionó)
    if (validated.rif) {
      const empresaConRif = await prisma.empresa.findUnique({
        where: { rif: validated.rif },
      });

      if (empresaConRif && empresaConRif.id !== validated.id) {
        redirect(`/admin/empresas/${validated.id}/editar?error=${encodeURIComponent("Ya existe una empresa con ese RIF")}`);
      }
    }

    // Validar que el NIF no esté en uso por otra empresa (si se proporcionó)
    if (validated.nif) {
      const empresaConNif = await prisma.empresa.findUnique({
        where: { nif: validated.nif },
      });

      if (empresaConNif && empresaConNif.id !== validated.id) {
        redirect(`/admin/empresas/${validated.id}/editar?error=${encodeURIComponent("Ya existe una empresa con ese NIF")}`);
      }
    }

    await prisma.empresa.update({
      where: { id: validated.id },
      data: {
        nombre: sanitizeString(validated.nombre),
        telefono: validated.telefono ? sanitizePhone(validated.telefono) : null,
        telefonoWhatsapp: sanitizePhone(validated.telefonoWhatsapp),
        rif: validated.rif ? sanitizeString(validated.rif) : null,
        nif: validated.nif ? sanitizeString(validated.nif) : null,
        responsable: validated.responsable ? sanitizeString(validated.responsable) : null,
        direccion: validated.direccion ? sanitizeString(validated.direccion) : null,
        email: validated.email,
      },
    });

    redirect(`/admin/empresas/${validated.id}/editar?editado=1`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (error instanceof z.ZodError) {
      console.error("Validación fallida:", error.issues);
      throw new Error(error.issues[0]?.message || "Datos inválidos");
    }
    console.error("Error al editar empresa:", error);
    throw new Error("Error al editar empresa");
  }
}

export async function eliminarEmpresa(formData: FormData) {
  try {
    const id = formData.get("id") as string;

    if (!id || !isValidCuid(id)) {
      throw new Error("ID inválido");
    }

    // Verificar que la empresa existe antes de eliminar
    const empresa = await prisma.empresa.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!empresa) {
      throw new Error("Empresa no encontrada");
    }

    // Elimina en cascada: mensajes → conversaciones → documentos → contactos → memoria → automatizaciones → citas → empresa
    await prisma.$transaction([
      prisma.mensaje.deleteMany({
        where: { conversacion: { empresaId: id } },
      }),
      prisma.conversacion.deleteMany({ where: { empresaId: id } }),
      prisma.documentoChunk.deleteMany({ where: { empresaId: id } }),
      prisma.documento.deleteMany({ where: { empresaId: id } }),
      prisma.contacto.deleteMany({ where: { empresaId: id } }),
      prisma.memoriaEmpresa.deleteMany({ where: { empresaId: id } }),
      prisma.automatizacion.deleteMany({ where: { empresaId: id } }),
      prisma.cita.deleteMany({ where: { empresaId: id } }),
      prisma.empresa.delete({ where: { id } }),
    ]);

    redirect("/dashboard/empresas");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Error al eliminar empresa:", error);
    throw new Error("Error al eliminar empresa");
  }
}

export async function actualizarPrompt(formData: FormData) {
  try {
    const rawData = {
      id: formData.get("id"),
      prompt: formData.get("prompt"),
      origen: formData.get("origen"),
    };

    const validated = actualizarPromptSchema.parse(rawData);

    await prisma.empresa.update({
      where: { id: validated.id },
      data: {
        promptSistema: validated.prompt ? sanitizeString(validated.prompt) : null,
      },
    });

    revalidatePath(`/empresa/${validated.id}/configuracion`);

    if (validated.origen === "empresa") {
      redirect(`/empresa/${validated.id}/configuracion?guardado=1`);
    }
    redirect("/dashboard/empresas?guardado=1");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (error instanceof z.ZodError) {
      console.error("Validación fallida:", error.issues);
      throw new Error(error.issues[0]?.message || "Datos inválidos");
    }
    console.error("Error al actualizar prompt:", error);
    throw new Error("Error al actualizar prompt");
  }
}
