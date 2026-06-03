"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { isRedirectError } from "next/dist/client/components/redirect-error";

// Crear usuario PROVEEDOR (admin)
export async function crearUsuarioProveedor(formData: FormData) {
  try {
    const session = await auth();

    if (!session || session.user.rol !== "PROVEEDOR") {
      redirect("/admin?error=No+autorizado");
    }

    const nombre = formData.get("nombre") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!nombre || !email || !password) {
      redirect("/admin/usuarios?error=Todos+los+campos+son+requeridos");
    }

    if (password.length < 8) {
      redirect("/admin/usuarios?error=La+contraseña+debe+tener+al+menos+8+caracteres");
    }

    // Verificar que el email no exista
    const existente = await prisma.usuario.findUnique({
      where: { email },
    });

    if (existente) {
      redirect("/admin/usuarios?error=Ya+existe+un+usuario+con+ese+email");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.usuario.create({
      data: {
        email,
        password: passwordHash,
        nombre,
        rol: "PROVEEDOR",
      },
    });

    redirect("/admin/usuarios?creado=true");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("[crearUsuarioProveedor] Error:", error);
    const mensaje = error instanceof Error ? error.message : "Error+desconocido";
    redirect(`/admin/usuarios?error=${encodeURIComponent(mensaje)}`);
  }
}

// Cambiar contraseña (propia o de otro usuario si eres PROVEEDOR)
export async function cambiarContrasena(formData: FormData) {
  try {
    const session = await auth();

    if (!session) {
      redirect("/login");
    }

    const usuarioId = formData.get("usuarioId") as string;
    const passwordActual = formData.get("passwordActual") as string;
    const passwordNueva = formData.get("passwordNueva") as string;
    const passwordConfirmar = formData.get("passwordConfirmar") as string;

    if (!passwordNueva || !passwordConfirmar) {
      redirect(`/admin/usuarios?error=Todos+los+campos+son+requeridos`);
    }

    if (passwordNueva !== passwordConfirmar) {
      redirect(`/admin/usuarios?error=Las+contraseñas+no+coinciden`);
    }

    if (passwordNueva.length < 8) {
      redirect(`/admin/usuarios?error=La+contraseña+debe+tener+al+menos+8+caracteres`);
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
    });

    if (!usuario) {
      redirect(`/admin/usuarios?error=Usuario+no+encontrado`);
    }

    // Si NO eres PROVEEDOR, solo puedes cambiar tu propia contraseña
    if (session.user.rol !== "PROVEEDOR" && usuario.id !== session.user.id) {
      redirect(`/admin/usuarios?error=No+autorizado`);
    }

    // Si estás cambiando tu propia contraseña, verificar la actual
    if (usuario.id === session.user.id) {
      if (!passwordActual) {
        redirect(`/admin/usuarios?error=Debes+ingresar+tu+contraseña+actual`);
      }

      // Si el usuario no tiene password (es OAuth), no puede cambiar contraseña
      if (!usuario.password) {
        redirect(`/admin/usuarios?error=Usuario+OAuth+no+puede+cambiar+contraseña`);
      }

      const passwordMatch = await bcrypt.compare(passwordActual, usuario.password);
      if (!passwordMatch) {
        redirect(`/admin/usuarios?error=Contraseña+actual+incorrecta`);
      }
    }

    const passwordHash = await bcrypt.hash(passwordNueva, 10);

    await prisma.usuario.update({
      where: { id: usuarioId },
      data: { password: passwordHash },
    });

    if (session.user.rol === "PROVEEDOR") {
      redirect("/admin/usuarios?actualizada=true");
    } else {
      redirect(`/empresa/${session.user.empresaId}?passwordCambiada=true`);
    }
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("[cambiarContrasena] Error:", error);
    const mensaje = error instanceof Error ? error.message : "Error+desconocido";
    redirect(`/admin/usuarios?error=${encodeURIComponent(mensaje)}`);
  }
}

// Eliminar usuario (solo PROVEEDOR)
export async function eliminarUsuario(usuarioId: string) {
  try {
    const session = await auth();

    if (!session || session.user.rol !== "PROVEEDOR") {
      redirect("/admin?error=No+autorizado");
    }

    // No puedes eliminarte a ti mismo
    if (usuarioId === session.user.id) {
      redirect("/admin/usuarios?error=No+puedes+eliminarte+a+ti+mismo");
    }

    await prisma.usuario.delete({
      where: { id: usuarioId },
    });

    redirect("/admin/usuarios?eliminado=true");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("[eliminarUsuario] Error:", error);
    const mensaje = error instanceof Error ? error.message : "Error+desconocido";
    redirect(`/admin/usuarios?error=${encodeURIComponent(mensaje)}`);
  }
}
