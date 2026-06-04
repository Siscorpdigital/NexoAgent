"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export async function crearEmpresaConUsuario(formData: FormData) {
  console.log("[crearEmpresaConUsuario] Iniciando...");

  try {
    console.log("[crearEmpresaConUsuario] Verificando sesión...");
    const session = await auth();
    console.log("[crearEmpresaConUsuario] Sesión:", session?.user?.email, session?.user?.rol);

    if (!session || session.user.rol !== "PROVEEDOR") {
      redirect("/admin/empresas/nueva?error=No+autorizado");
    }

    // Datos de la empresa
    const nombre = formData.get("nombre") as string;
    const rif = (formData.get("rif") as string) || null;
    const nif = (formData.get("nif") as string) || null;
    const responsable = (formData.get("responsable") as string) || null;
    const direccion = (formData.get("direccion") as string) || null;
    const telefono = (formData.get("telefono") as string) || null;
    const telefonoWhatsapp = formData.get("telefonoWhatsapp") as string;
    const email = (formData.get("email") as string) || null;
    const planId = (formData.get("planId") as string) || null;

    // Datos del usuario (opcional)
    const usuarioNombre = formData.get("usuarioNombre") as string;
    const usuarioEmail = formData.get("usuarioEmail") as string;
    const usuarioPassword = formData.get("usuarioPassword") as string;

    // Función para crear URL con datos del formulario
    const createErrorUrl = (errorMsg: string) => {
      const params = new URLSearchParams({
        error: errorMsg,
        nombre: nombre || "",
        rif: rif || "",
        nif: nif || "",
        responsable: responsable || "",
        direccion: direccion || "",
        telefono: telefono || "",
        telefonoWhatsapp: telefonoWhatsapp || "",
        email: email || "",
        planId: planId || "",
        usuarioNombre: usuarioNombre || "",
        usuarioEmail: usuarioEmail || "",
      });
      return `/admin/empresas/nueva?${params.toString()}`;
    };

    if (!nombre || !telefonoWhatsapp) {
      redirect(createErrorUrl("Faltan campos requeridos"));
    }

    if (!planId) {
      redirect(createErrorUrl("Debe seleccionar un plan"));
    }

    // Validar que el teléfono no exista
    const existente = await prisma.empresa.findUnique({
      where: { telefonoWhatsapp },
    });

    if (existente) {
      redirect(createErrorUrl("Ya existe una empresa con ese WhatsApp"));
    }

    // Si se proveen datos de usuario, validar
    if (usuarioEmail && usuarioPassword) {
      const usuarioExistente = await prisma.usuario.findUnique({
        where: { email: usuarioEmail },
      });

      if (usuarioExistente) {
        redirect(createErrorUrl("Ya existe un usuario con ese email"));
      }

      if (usuarioPassword.length < 8) {
        redirect(createErrorUrl("Contraseña debe tener 8 caracteres"));
      }
    }

    // Crear empresa
    console.log("[crearEmpresaConUsuario] Creando empresa:", { nombre, telefonoWhatsapp, planId });

    // Calcular fecha de vencimiento (14 días para trial)
    const fechaVencimiento = new Date();
    fechaVencimiento.setDate(fechaVencimiento.getDate() + 14);

    const empresa = await prisma.empresa.create({
      data: {
        nombre,
        rif,
        nif,
        responsable,
        direccion,
        telefono,
        telefonoWhatsapp,
        email,
        planId,
        estadoPlan: "TRIAL",
        fechaVencimiento,
      },
    });

    // Si se proveen datos de usuario, crear el usuario CLIENTE
    if (usuarioNombre && usuarioEmail && usuarioPassword) {
      console.log("[crearEmpresaConUsuario] Creando usuario CLIENTE...");
      const passwordHash = await bcrypt.hash(usuarioPassword, 10);

      await prisma.usuario.create({
        data: {
          email: usuarioEmail,
          password: passwordHash,
          nombre: usuarioNombre,
          rol: "CLIENTE",
          empresaId: empresa.id,
        },
      });
    }

    console.log("[crearEmpresaConUsuario] Empresa creada exitosamente:", empresa.id);
    redirect(`/admin?creada=true`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    // Si es un error de redirección, dejarlo pasar (es el comportamiento normal)
    if (isRedirectError(error)) {
      throw error;
    }

    console.error("[crearEmpresaConUsuario] Error completo:", error);
    console.error("[crearEmpresaConUsuario] Stack:", error instanceof Error ? error.stack : "No stack");
    const mensaje = error instanceof Error ? error.message : "Error+desconocido";
    redirect(`/admin/empresas/nueva?error=${encodeURIComponent(mensaje)}`);
  }
}

export async function crearUsuarioCliente(
  empresaId: string,
  nombre: string,
  email: string,
  password: string
) {
  const session = await auth();

  if (!session || session.user.rol !== "PROVEEDOR") {
    throw new Error("No autorizado");
  }

  // Verificar que la empresa exista y no tenga usuario
  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
    include: { usuario: true },
  });

  if (!empresa) {
    throw new Error("Empresa no encontrada");
  }

  if (empresa.usuario) {
    throw new Error("Esta empresa ya tiene un usuario asignado");
  }

  // Verificar que el email no exista
  const usuarioExistente = await prisma.usuario.findUnique({
    where: { email },
  });

  if (usuarioExistente) {
    throw new Error("Ya existe un usuario con ese email");
  }

  if (password.length < 8) {
    throw new Error("La contraseña debe tener al menos 8 caracteres");
  }

  // Crear usuario
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.usuario.create({
    data: {
      email,
      password: passwordHash,
      nombre,
      rol: "CLIENTE",
      empresaId,
    },
  });

  redirect(`/admin`);
}

export async function asignarPlan(formData: FormData) {
  try {
    const session = await auth();

    if (!session || session.user.rol !== "PROVEEDOR") {
      redirect("/admin?error=No+autorizado");
    }

    const empresaId = formData.get("empresaId") as string;
    const planId = formData.get("planId") as string;
    const estadoPlan = formData.get("estadoPlan") as string;
    const fechaVencimientoStr = formData.get("fechaVencimiento") as string;

    if (!empresaId || !planId) {
      redirect(`/admin/empresas/${empresaId}/plan?error=Faltan+datos+requeridos`);
    }

    // Validar que el plan existe
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      redirect(`/admin/empresas/${empresaId}/plan?error=Plan+no+encontrado`);
    }

    // Parsear fecha
    const fechaVencimiento = fechaVencimientoStr
      ? new Date(fechaVencimientoStr)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 días por defecto

    // Actualizar empresa
    await prisma.empresa.update({
      where: { id: empresaId },
      data: {
        planId,
        estadoPlan: estadoPlan as any,
        fechaVencimiento,
      },
    });

    redirect(`/admin?success=Plan+asignado+correctamente`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("[asignarPlan] Error:", error);
    const empresaId = formData.get("empresaId") as string;
    redirect(`/admin/empresas/${empresaId}/plan?error=Error+al+asignar+el+plan`);
  }
}
