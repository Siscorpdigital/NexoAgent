/**
 * Utilidades para verificar y validar límites de planes
 */

import { prisma } from "@/lib/prisma";
import type { Empresa, Plan } from "../app/generated/prisma/client";

export type LimitType = "whatsapps" | "agentes" | "conversaciones" | "documentos";

export interface LimitCheck {
  allowed: boolean;
  current: number;
  max: number;
  message: string;
}

/**
 * Verifica si una empresa puede agregar un recurso según su plan
 */
export async function checkPlanLimit(
  empresaId: string,
  limitType: LimitType
): Promise<LimitCheck> {
  // Obtener empresa con su plan
  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
    include: { plan: true },
  });

  if (!empresa) {
    throw new Error("Empresa no encontrada");
  }

  if (!empresa.plan) {
    return {
      allowed: false,
      current: 0,
      max: 0,
      message: "La empresa no tiene un plan asignado",
    };
  }

  // Verificar estado del plan
  if (empresa.estadoPlan === "SUSPENDIDO" || empresa.estadoPlan === "CANCELADO") {
    return {
      allowed: false,
      current: 0,
      max: 0,
      message: `Plan ${empresa.estadoPlan.toLowerCase()}. Contacta al administrador.`,
    };
  }

  // Verificar vencimiento
  if (empresa.fechaVencimiento && new Date() > empresa.fechaVencimiento) {
    return {
      allowed: false,
      current: 0,
      max: 0,
      message: "Plan vencido. Renueva tu suscripción para continuar.",
    };
  }

  switch (limitType) {
    case "whatsapps":
      return await checkWhatsAppLimit(empresa, empresa.plan);
    case "agentes":
      return await checkAgentesLimit(empresa, empresa.plan);
    case "conversaciones":
      return checkConversacionesLimit(empresa, empresa.plan);
    case "documentos":
      return await checkDocumentosLimit(empresa, empresa.plan);
    default:
      throw new Error(`Tipo de límite desconocido: ${limitType}`);
  }
}

async function checkWhatsAppLimit(
  empresa: Empresa,
  plan: Plan
): Promise<LimitCheck> {
  // Contar números de WhatsApp activos
  const current = await prisma.numeroWhatsApp.count({
    where: {
      empresaId: empresa.id,
      activo: true,
    },
  });

  const max = plan.maxWhatsApps;
  const ilimitado = max === -1;

  return {
    allowed: ilimitado || current < max,
    current,
    max: ilimitado ? -1 : max,
    message: ilimitado
      ? "Números de WhatsApp ilimitados"
      : current >= max
      ? `Has alcanzado el límite de ${max} número${max > 1 ? "s" : ""} de WhatsApp. Actualiza tu plan para agregar más.`
      : `Puedes agregar ${max - current} número${max - current > 1 ? "s" : ""} más de WhatsApp.`,
  };
}

async function checkAgentesLimit(
  empresa: Empresa,
  plan: Plan
): Promise<LimitCheck> {
  // Contar agentes activos
  const current = await prisma.agente.count({
    where: {
      empresaId: empresa.id,
      activo: true,
    },
  });

  const max = plan.maxAgentes;
  const ilimitado = max === -1;

  return {
    allowed: ilimitado || current < max,
    current,
    max: ilimitado ? -1 : max,
    message: ilimitado
      ? "Agentes virtuales ilimitados"
      : current >= max
      ? `Has alcanzado el límite de ${max} agente${max > 1 ? "s" : ""}. Actualiza tu plan para crear más.`
      : `Puedes crear ${max - current} agente${max - current > 1 ? "s" : ""} más.`,
  };
}

function checkConversacionesLimit(
  empresa: Empresa,
  plan: Plan
): LimitCheck {
  const current = empresa.conversacionesEsteMes;
  const max = plan.maxConversacionesMes;
  const ilimitado = max === -1;

  return {
    allowed: ilimitado || current < max,
    current,
    max: ilimitado ? -1 : max,
    message: ilimitado
      ? "Conversaciones ilimitadas"
      : current >= max
        ? `Has alcanzado el límite de ${max} conversaciones este mes. Actualiza tu plan o espera al próximo ciclo.`
        : `Has usado ${current} de ${max} conversaciones este mes.`,
  };
}

async function checkDocumentosLimit(
  empresa: Empresa,
  plan: Plan
): Promise<LimitCheck> {
  // Calcular MB total de documentos
  // NOTA: El modelo Documento no tiene campo de tamaño aún
  // Cuando se implemente, calcular el total aquí
  const documentos = await prisma.documento.count({
    where: { empresaId: empresa.id },
  });

  // Temporal: estimar 1MB por documento
  const currentMB = documentos * 1;

  const max = plan.maxDocumentosMB;
  const ilimitado = max === -1;

  return {
    allowed: ilimitado || currentMB < max,
    current: currentMB,
    max: ilimitado ? -1 : max,
    message: ilimitado
      ? "Almacenamiento de documentos ilimitado"
      : currentMB >= max
      ? `Has alcanzado el límite de ${max}MB de documentos. Elimina documentos o actualiza tu plan.`
      : `Has usado ${currentMB}MB de ${max}MB disponibles.`,
  };
}

/**
 * Resetear contador mensual de conversaciones
 * Debe ejecutarse al inicio de cada mes (cron job o al recibir primera conversación del mes)
 */
export async function resetMonthlyConversationCounter(empresaId: string) {
  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
    select: { ultimoResetContador: true },
  });

  if (!empresa) return;

  const ahora = new Date();
  const ultimoReset = new Date(empresa.ultimoResetContador);

  // Si el último reset fue en un mes diferente, resetear
  if (
    ahora.getMonth() !== ultimoReset.getMonth() ||
    ahora.getFullYear() !== ultimoReset.getFullYear()
  ) {
    await prisma.empresa.update({
      where: { id: empresaId },
      data: {
        conversacionesEsteMes: 0,
        ultimoResetContador: ahora,
      },
    });

    console.log(`✅ Contador de conversaciones reseteado para empresa ${empresaId}`);
  }
}

/**
 * Incrementar contador de conversaciones
 * Llamar cuando se crea una nueva conversación
 */
export async function incrementConversationCounter(empresaId: string) {
  // Primero verificar si necesita reset
  await resetMonthlyConversationCounter(empresaId);

  // Incrementar contador
  await prisma.empresa.update({
    where: { id: empresaId },
    data: {
      conversacionesEsteMes: {
        increment: 1,
      },
    },
  });
}

/**
 * Obtener resumen de uso del plan
 */
export async function getPlanUsageSummary(empresaId: string) {
  const [whatsapps, agentes, conversaciones, documentos] = await Promise.all([
    checkPlanLimit(empresaId, "whatsapps"),
    checkPlanLimit(empresaId, "agentes"),
    checkPlanLimit(empresaId, "conversaciones"),
    checkPlanLimit(empresaId, "documentos"),
  ]);

  return {
    whatsapps,
    agentes,
    conversaciones,
    documentos,
  };
}
