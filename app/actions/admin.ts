"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

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

    if (!nombre || !telefonoWhatsapp) {
      redirect("/admin/empresas/nueva?error=Faltan+campos+requeridos");
    }

    // Datos del usuario (opcional)
    const usuarioNombre = formData.get("usuarioNombre") as string;
    const usuarioEmail = formData.get("usuarioEmail") as string;
    const usuarioPassword = formData.get("usuarioPassword") as string;

    // Validar que el teléfono no exista
    const existente = await prisma.empresa.findUnique({
      where: { telefonoWhatsapp },
    });

    if (existente) {
      redirect("/admin/empresas/nueva?error=Ya+existe+una+empresa+con+ese+WhatsApp");
    }

    // Si se proveen datos de usuario, validar
    if (usuarioEmail && usuarioPassword) {
      const usuarioExistente = await prisma.usuario.findUnique({
        where: { email: usuarioEmail },
      });

      if (usuarioExistente) {
        redirect("/admin/empresas/nueva?error=Ya+existe+un+usuario+con+ese+email");
      }

      if (usuarioPassword.length < 8) {
        redirect("/admin/empresas/nueva?error=Contraseña+debe+tener+8+caracteres");
      }
    }

    // Crear empresa
    console.log("[crearEmpresaConUsuario] Creando empresa:", { nombre, telefonoWhatsapp });
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
      },
    });

    // Si se proveen datos de usuario, crear el usuario CLIENTE
    if (usuarioNombre && usuarioEmail && usuarioPassword) {
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
