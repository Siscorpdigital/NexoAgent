"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { checkPlanLimit } from "@/lib/plan-limits";

export async function agregarNumeroWhatsApp(formData: FormData) {
  try {
    const session = await auth();
    if (!session) redirect("/login");

    const empresaId = formData.get("empresaId") as string;
    const telefono = (formData.get("telefono") as string).trim();
    const nombre = (formData.get("nombre") as string)?.trim() || null;

    if (!telefono) {
      redirect(`/empresa/${empresaId}/whatsapp?error=El+número+es+requerido`);
    }

    // Validar permisos
    if (session.user.rol === "CLIENTE" && session.user.empresaId !== empresaId) {
      redirect(`/empresa/${session.user.empresaId}/whatsapp?error=No+autorizado`);
    }

    // Verificar límite del plan
    const limitCheck = await checkPlanLimit(empresaId, "whatsapps");
    if (!limitCheck.allowed) {
      redirect(`/empresa/${empresaId}/whatsapp?error=${encodeURIComponent(limitCheck.message)}`);
    }

    // Verificar que el número no exista
    const existe = await prisma.numeroWhatsApp.findUnique({
      where: { telefono },
    });

    if (existe) {
      redirect(`/empresa/${empresaId}/whatsapp?error=Este+número+ya+está+registrado`);
    }

    // Verificar si es el primer número
    const count = await prisma.numeroWhatsApp.count({
      where: { empresaId },
    });

    const esPrincipal = count === 0;

    await prisma.numeroWhatsApp.create({
      data: {
        empresaId,
        telefono,
        nombre,
        esPrincipal,
        activo: true,
      },
    });

    redirect(`/empresa/${empresaId}/whatsapp?success=Número+agregado+correctamente`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("[agregarNumeroWhatsApp] Error:", error);
    const empresaId = formData.get("empresaId") as string;
    redirect(`/empresa/${empresaId}/whatsapp?error=Error+al+agregar+el+número`);
  }
}

export async function eliminarNumeroWhatsApp(formData: FormData) {
  try {
    const session = await auth();
    if (!session) redirect("/login");

    const empresaId = formData.get("empresaId") as string;
    const numeroId = formData.get("numeroId") as string;

    // Validar permisos
    if (session.user.rol === "CLIENTE" && session.user.empresaId !== empresaId) {
      redirect(`/empresa/${session.user.empresaId}/whatsapp?error=No+autorizado`);
    }

    const numero = await prisma.numeroWhatsApp.findUnique({
      where: { id: numeroId },
    });

    if (!numero || numero.empresaId !== empresaId) {
      redirect(`/empresa/${empresaId}/whatsapp?error=Número+no+encontrado`);
    }

    await prisma.numeroWhatsApp.delete({
      where: { id: numeroId },
    });

    // Si se eliminó el principal y quedan otros números, asignar uno nuevo como
    // principal (el más antiguo) para no dejar a la empresa sin número principal.
    if (numero.esPrincipal) {
      const siguiente = await prisma.numeroWhatsApp.findFirst({
        where: { empresaId },
        orderBy: { creadoEn: "asc" },
      });
      if (siguiente) {
        await prisma.numeroWhatsApp.update({
          where: { id: siguiente.id },
          data: { esPrincipal: true },
        });
      }
    }

    redirect(`/empresa/${empresaId}/whatsapp?success=Número+eliminado+correctamente`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("[eliminarNumeroWhatsApp] Error:", error);
    const empresaId = formData.get("empresaId") as string;
    redirect(`/empresa/${empresaId}/whatsapp?error=Error+al+eliminar+el+número`);
  }
}

export async function marcarComoPrincipal(formData: FormData) {
  try {
    const session = await auth();
    if (!session) redirect("/login");

    const empresaId = formData.get("empresaId") as string;
    const numeroId = formData.get("numeroId") as string;

    // Validar permisos
    if (session.user.rol === "CLIENTE" && session.user.empresaId !== empresaId) {
      redirect(`/empresa/${session.user.empresaId}/whatsapp?error=No+autorizado`);
    }

    // Verificar que el número existe y pertenece a la empresa
    const numero = await prisma.numeroWhatsApp.findUnique({
      where: { id: numeroId },
    });

    if (!numero || numero.empresaId !== empresaId) {
      redirect(`/empresa/${empresaId}/whatsapp?error=Número+no+encontrado`);
    }

    // Quitar esPrincipal de todos los números de esta empresa
    await prisma.numeroWhatsApp.updateMany({
      where: { empresaId },
      data: { esPrincipal: false },
    });

    // Marcar el nuevo como principal
    await prisma.numeroWhatsApp.update({
      where: { id: numeroId },
      data: { esPrincipal: true },
    });

    redirect(`/empresa/${empresaId}/whatsapp?success=Número+marcado+como+principal`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("[marcarComoPrincipal] Error:", error);
    const empresaId = formData.get("empresaId") as string;
    redirect(`/empresa/${empresaId}/whatsapp?error=Error+al+actualizar+el+número`);
  }
}

export async function toggleActivoWhatsApp(formData: FormData) {
  try {
    const session = await auth();
    if (!session) redirect("/login");

    const empresaId = formData.get("empresaId") as string;
    const numeroId = formData.get("numeroId") as string;

    // Validar permisos
    if (session.user.rol === "CLIENTE" && session.user.empresaId !== empresaId) {
      redirect(`/empresa/${session.user.empresaId}/whatsapp?error=No+autorizado`);
    }

    const numero = await prisma.numeroWhatsApp.findUnique({
      where: { id: numeroId },
    });

    if (!numero || numero.empresaId !== empresaId) {
      redirect(`/empresa/${empresaId}/whatsapp?error=Número+no+encontrado`);
    }

    await prisma.numeroWhatsApp.update({
      where: { id: numeroId },
      data: { activo: !numero.activo },
    });

    const mensaje = numero.activo ? "desactivado" : "activado";
    redirect(`/empresa/${empresaId}/whatsapp?success=Número+${mensaje}+correctamente`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("[toggleActivoWhatsApp] Error:", error);
    const empresaId = formData.get("empresaId") as string;
    redirect(`/empresa/${empresaId}/whatsapp?error=Error+al+actualizar+el+número`);
  }
}
