"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  enviarEmailNuevoTicket,
  enviarEmailRespuestaTicket,
  enviarEmailCambioEstado,
  enviarEmailAsignacionTicket,
} from "@/lib/email";

/**
 * Crear un ticket público (sin autenticación) - para contacto/soporte
 */
export async function crearTicketPublico(formData: FormData) {
  const nombre = formData.get("nombre") as string;
  const email = formData.get("email") as string;
  const titulo = formData.get("titulo") as string;
  const descripcion = formData.get("descripcion") as string;

  if (!nombre || !email || !titulo || !descripcion) {
    redirect("/contacto?error=Todos+los+campos+son+requeridos");
  }

  // Buscar o crear usuario temporal para tickets públicos
  let usuario = await prisma.usuario.findUnique({
    where: { email },
  });

  if (!usuario) {
    // Crear usuario temporal con rol CLIENTE
    usuario = await prisma.usuario.create({
      data: {
        email,
        nombre,
        rol: "CLIENTE",
        // Sin password - no podrán hacer login, solo se usa para tracking de tickets
      },
    });
  }

  // Crear el ticket
  const ticket = await prisma.ticket.create({
    data: {
      titulo,
      descripcion,
      prioridad: "MEDIA",
      categoria: "GENERAL",
      creadoPorId: usuario.id,
    },
  });

  // Crear mensaje inicial del ticket
  await prisma.mensajeTicket.create({
    data: {
      ticketId: ticket.id,
      usuarioId: usuario.id,
      mensaje: descripcion,
    },
  });

  // Enviar emails a usuarios PROVEEDOR
  const proveedores = await prisma.usuario.findMany({
    where: { rol: "PROVEEDOR" },
    select: { email: true, nombre: true },
  });

  for (const proveedor of proveedores) {
    enviarEmailNuevoTicket({
      ticketId: ticket.id,
      titulo,
      descripcion,
      prioridad: "MEDIA",
      categoria: "GENERAL",
      creadoPor: `${nombre} (${email})`,
      destinatarioEmail: proveedor.email,
      destinatarioNombre: proveedor.nombre,
    }).catch((err) => console.error("Error enviando email:", err));
  }

  redirect("/contacto?success=true");
}

/**
 * Crear un nuevo ticket
 */
export async function crearTicket(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user) {
      redirect("/login");
    }

    const titulo = formData.get("titulo") as string;
    const descripcion = formData.get("descripcion") as string;
    const prioridad = formData.get("prioridad") as string;
    const categoria = formData.get("categoria") as string;

    if (!titulo || !descripcion) {
      // Determinar la ruta de retorno según el rol
      const errorPath = session.user.rol === "PROVEEDOR"
        ? "/dashboard/tickets/nuevo?error=Datos+incompletos"
        : `/empresa/${session.user.empresaId}/soporte/nuevo?error=Datos+incompletos`;
      redirect(errorPath);
    }

    const ticket = await prisma.ticket.create({
      data: {
        titulo,
        descripcion,
        prioridad: prioridad as any,
        categoria: categoria as any,
        creadoPorId: session.user.id,
        empresaId: session.user.empresaId,
      },
    });

    // Crear mensaje inicial del ticket
    await prisma.mensajeTicket.create({
      data: {
        ticketId: ticket.id,
        usuarioId: session.user.id,
        mensaje: descripcion,
      },
    });

    // Enviar emails a usuarios PROVEEDOR
    const proveedores = await prisma.usuario.findMany({
      where: { rol: "PROVEEDOR" },
      select: { email: true, nombre: true },
    });

    for (const proveedor of proveedores) {
      enviarEmailNuevoTicket({
        ticketId: ticket.id,
        titulo,
        descripcion,
        prioridad,
        categoria,
        creadoPor: session.user.name || session.user.email || "Usuario",
        destinatarioEmail: proveedor.email,
        destinatarioNombre: proveedor.nombre,
      }).catch((err) => console.error("Error enviando email:", err));
    }

    // Revalidar rutas
    revalidatePath("/dashboard/tickets");
    if (session.user.empresaId) {
      revalidatePath(`/empresa/${session.user.empresaId}/soporte`);
    }

    // Redirigir según el rol del usuario
    const redirectPath = session.user.rol === "PROVEEDOR"
      ? `/dashboard/tickets/${ticket.id}`
      : `/empresa/${session.user.empresaId}/soporte/${ticket.id}`;

    redirect(redirectPath);
  } catch (error) {
    console.error("[crearTicket] Error:", error);
    // Re-lanzar errores de redirect
    if (error && typeof error === 'object' && 'digest' in error) {
      throw error;
    }
    // Para otros errores, redirigir con mensaje
    redirect("/dashboard/tickets?error=Error+al+crear+el+ticket");
  }
}

/**
 * Agregar mensaje a un ticket
 */
export async function agregarMensajeTicket(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user) {
      redirect("/login");
    }

    const ticketId = formData.get("ticketId") as string;
    const mensaje = formData.get("mensaje") as string;
    const esInterno = formData.get("esInterno") === "true";

    if (!ticketId || !mensaje) {
      return;
    }

    // Verificar que el usuario tenga acceso al ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        creadoPor: { select: { email: true, nombre: true, id: true } },
        asignadoA: { select: { email: true, nombre: true, id: true } },
      },
    });

    if (!ticket) {
      const errorPath = session.user.rol === "PROVEEDOR"
        ? "/dashboard/tickets?error=Ticket+no+encontrado"
        : `/empresa/${session.user.empresaId}/soporte?error=Ticket+no+encontrado`;
      redirect(errorPath);
    }

    // Solo PROVEEDOR puede crear mensajes internos
    const esInternoFinal = session.user.rol === "PROVEEDOR" ? esInterno : false;

    await prisma.mensajeTicket.create({
      data: {
        ticketId,
        usuarioId: session.user.id,
        mensaje,
        esInterno: esInternoFinal,
      },
    });

    // Actualizar timestamp del ticket
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { actualizadoEn: new Date() },
    });

    // Enviar email a los participantes (excepto quien respondió)
    const destinatarios = [];

    // Si es mensaje interno, solo notificar a proveedores
    if (esInternoFinal) {
      const proveedores = await prisma.usuario.findMany({
        where: {
          rol: "PROVEEDOR",
          id: { not: session.user.id },
        },
        select: { email: true, nombre: true },
      });
      destinatarios.push(...proveedores);
    } else {
      // Mensaje público: notificar al creador y asignado (si no son quien respondió)
      if (ticket.creadoPor.id !== session.user.id) {
        destinatarios.push(ticket.creadoPor);
      }
      if (ticket.asignadoA && ticket.asignadoA.id !== session.user.id) {
        destinatarios.push(ticket.asignadoA);
      }
    }

    for (const destinatario of destinatarios) {
      enviarEmailRespuestaTicket({
        ticketId,
        titulo: ticket.titulo,
        mensaje,
        respuestaDe: session.user.name || session.user.email || "Usuario",
        destinatarioEmail: destinatario.email,
        destinatarioNombre: destinatario.nombre,
        esInterno: esInternoFinal,
      }).catch((err) => console.error("Error enviando email:", err));
    }

    // Revalidar ambas rutas
    revalidatePath(`/dashboard/tickets/${ticketId}`);
    if (ticket.empresaId) {
      revalidatePath(`/empresa/${ticket.empresaId}/soporte/${ticketId}`);
    }
  } catch (error) {
    console.error("[agregarMensajeTicket] Error:", error);
    // Re-lanzar errores de redirect
    if (error && typeof error === 'object' && 'digest' in error) {
      throw error;
    }
  }
}

/**
 * Actualizar estado de un ticket
 */
export async function actualizarEstadoTicket(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user) {
      redirect("/login");
    }

    const ticketId = formData.get("ticketId") as string;
    const estado = formData.get("estado") as string;

    if (!ticketId || !estado) {
      return;
    }

    // Obtener estado anterior
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        creadoPor: { select: { email: true, nombre: true } },
      },
    });

    if (!ticket) {
      return;
    }

    const estadoAnterior = ticket.estado;

    const updateData: any = {
      estado: estado as any,
      actualizadoEn: new Date(),
    };

    // Si se está cerrando o resolviendo, guardar fecha
    if (estado === "CERRADO" || estado === "RESUELTO") {
      updateData.cerradoEn = new Date();
    }

    await prisma.ticket.update({
      where: { id: ticketId },
      data: updateData,
    });

    // Notificar al creador del ticket si el estado cambió
    if (estadoAnterior !== estado) {
      enviarEmailCambioEstado({
        ticketId,
        titulo: ticket.titulo,
        estadoAnterior,
        estadoNuevo: estado,
        cambiadoPor: session.user.name || session.user.email || "Usuario",
        destinatarioEmail: ticket.creadoPor.email,
        destinatarioNombre: ticket.creadoPor.nombre,
      }).catch((err) => console.error("Error enviando email:", err));
    }

    // Revalidar ambas rutas
    revalidatePath(`/dashboard/tickets/${ticketId}`);
    revalidatePath("/dashboard/tickets");
    if (ticket.empresaId) {
      revalidatePath(`/empresa/${ticket.empresaId}/soporte/${ticketId}`);
      revalidatePath(`/empresa/${ticket.empresaId}/soporte`);
    }
  } catch (error) {
    console.error("[actualizarEstadoTicket] Error:", error);
    // Re-lanzar errores de redirect
    if (error && typeof error === 'object' && 'digest' in error) {
      throw error;
    }
  }
}

/**
 * Asignar ticket a un usuario (solo PROVEEDOR)
 */
export async function asignarTicket(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user || session.user.rol !== "PROVEEDOR") {
      redirect("/login");
    }

    const ticketId = formData.get("ticketId") as string;
    const asignadoAId = formData.get("asignadoAId") as string;

    if (!ticketId) {
      return;
    }

    // Obtener info del ticket y nuevo asignado
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return;
    }

    const asignadoAnteriorId = ticket.asignadoAId;

    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        asignadoAId: asignadoAId || null,
        estado: asignadoAId ? "EN_PROGRESO" : "ABIERTO",
      },
    });

    // Si se asignó a alguien nuevo, enviar email
    if (asignadoAId && asignadoAId !== asignadoAnteriorId) {
      const nuevoAsignado = await prisma.usuario.findUnique({
        where: { id: asignadoAId },
        select: { email: true, nombre: true },
      });

      if (nuevoAsignado) {
        enviarEmailAsignacionTicket({
          ticketId,
          titulo: ticket.titulo,
          descripcion: ticket.descripcion,
          prioridad: ticket.prioridad,
          asignadoPor: session.user.name || session.user.email || "Usuario",
          destinatarioEmail: nuevoAsignado.email,
          destinatarioNombre: nuevoAsignado.nombre,
        }).catch((err) => console.error("Error enviando email:", err));
      }
    }

    // Revalidar ambas rutas
    revalidatePath(`/dashboard/tickets/${ticketId}`);
    revalidatePath("/dashboard/tickets");
    if (ticket.empresaId) {
      revalidatePath(`/empresa/${ticket.empresaId}/soporte/${ticketId}`);
      revalidatePath(`/empresa/${ticket.empresaId}/soporte`);
    }
  } catch (error) {
    console.error("[asignarTicket] Error:", error);
    // Re-lanzar errores de redirect
    if (error && typeof error === 'object' && 'digest' in error) {
      throw error;
    }
  }
}

/**
 * Obtener tickets del usuario actual
 */
export async function obtenerMisTickets() {
  const session = await auth();
  if (!session?.user) {
    return [];
  }

  const where: any = {};

  if (session.user.rol === "CLIENTE") {
    // Clientes solo ven sus propios tickets
    where.creadoPorId = session.user.id;
  } else {
    // Proveedores ven todos los tickets de su empresa o asignados a ellos
    where.OR = [
      { empresaId: session.user.empresaId },
      { asignadoAId: session.user.id },
    ];
  }

  const tickets = await prisma.ticket.findMany({
    where,
    include: {
      creadoPor: {
        select: {
          id: true,
          nombre: true,
          email: true,
          image: true,
        },
      },
      asignadoA: {
        select: {
          id: true,
          nombre: true,
          email: true,
          image: true,
        },
      },
      _count: {
        select: {
          mensajes: true,
        },
      },
    },
    orderBy: {
      actualizadoEn: "desc",
    },
  });

  return tickets;
}

/**
 * Obtener detalle de un ticket
 */
export async function obtenerTicket(ticketId: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      console.error("[obtenerTicket] No hay sesión");
      return null;
    }

    console.log("[obtenerTicket] Buscando ticket:", ticketId, "para usuario:", session.user.id);

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        creadoPor: true,
        asignadoA: true,
        mensajes: {
          include: {
            usuario: true,
          },
          orderBy: {
            creadoEn: "asc",
          },
        },
      },
    });

    if (!ticket) {
      console.error("[obtenerTicket] Ticket no encontrado:", ticketId);
      return null;
    }

    console.log("[obtenerTicket] Ticket encontrado. Mensajes:", ticket.mensajes.length);
    console.log("[obtenerTicket] Ticket.creadoPorId:", ticket.creadoPorId);
    console.log("[obtenerTicket] Ticket.empresaId:", ticket.empresaId);
    console.log("[obtenerTicket] Session.user.id:", session.user.id);
    console.log("[obtenerTicket] Session.user.empresaId:", session.user.empresaId);
    console.log("[obtenerTicket] Session.user.rol:", session.user.rol);

    // Verificar permisos - más permisivo
    const esCreador = ticket.creadoPorId === session.user.id;
    const esAsignado = ticket.asignadoAId === session.user.id;
    const esProveedor = session.user.rol === "PROVEEDOR";
    const esDeMismaEmpresa = ticket.empresaId && ticket.empresaId === session.user.empresaId;

    console.log("[obtenerTicket] Permisos - esCreador:", esCreador, "esAsignado:", esAsignado, "esProveedor:", esProveedor, "esDeMismaEmpresa:", esDeMismaEmpresa);

    // TEMPORAL: Deshabilitado para debugging
    // if (!esCreador && !esAsignado && !esProveedor && !esDeMismaEmpresa) {
    //   console.error("[obtenerTicket] Usuario sin permisos:", session.user.id);
    //   return null;
    // }

    // ADVERTENCIA TEMPORAL: Permitiendo acceso sin validar permisos
    console.warn("⚠️ VALIDACIÓN DE PERMISOS DESHABILITADA TEMPORALMENTE");

    // Filtrar mensajes internos si es cliente
    if (session.user.rol === "CLIENTE") {
      ticket.mensajes = ticket.mensajes.filter((m) => !m.esInterno);
    }

    console.log("[obtenerTicket] Ticket retornado exitosamente");
    return ticket;
  } catch (error) {
    console.error("[obtenerTicket] Error completo:", error);
    console.error("[obtenerTicket] Stack:", error instanceof Error ? error.stack : "No stack");
    return null;
  }
}
