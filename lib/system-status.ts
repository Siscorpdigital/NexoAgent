import { prisma } from "@/lib/prisma";

export type EstadoCheck = {
  id: string;
  label: string;
  ok: boolean;
  critico: boolean; // si es imprescindible para el funcionamiento del agente
  detalle: string;
  comoActivar?: string;
};

/**
 * Chequeos reales del estado del sistema (presencia de credenciales + ping a la
 * base de datos). No expone valores secretos: solo indica si están configurados.
 */
export async function getSystemStatus(): Promise<EstadoCheck[]> {
  const checks: EstadoCheck[] = [];

  // Base de datos (ping real)
  let dbOk = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {
    dbOk = false;
  }
  checks.push({
    id: "db",
    label: "Base de datos",
    ok: dbOk,
    critico: true,
    detalle: dbOk ? "Conectada y respondiendo." : "Sin conexión con la base de datos.",
    comoActivar: dbOk ? undefined : "Revisa DATABASE_URL / DIRECT_URL en Vercel.",
  });

  // Inteligencia Artificial (Anthropic)
  const ia = !!process.env.ANTHROPIC_API_KEY?.trim();
  checks.push({
    id: "ia",
    label: "Inteligencia Artificial (Anthropic)",
    ok: ia,
    critico: true,
    detalle: ia
      ? "Clave configurada. El asistente puede generar respuestas."
      : "Falta la clave de Anthropic; el asistente no podrá responder.",
    comoActivar: ia ? undefined : "Agrega ANTHROPIC_API_KEY en Vercel → Settings → Environment Variables.",
  });

  // WhatsApp (Meta Cloud API) — envío/recepción de mensajes
  const metaToken = !!process.env.WHATSAPP_TOKEN?.trim();
  const metaPhone = !!process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const metaOk = metaToken && metaPhone;
  checks.push({
    id: "whatsapp",
    label: "WhatsApp (Meta Cloud API)",
    ok: metaOk,
    critico: true,
    detalle: metaOk
      ? "Credenciales de Meta configuradas (token + número)."
      : `Faltan credenciales de Meta${!metaToken ? " (WHATSAPP_TOKEN)" : ""}${!metaPhone ? " (WHATSAPP_PHONE_NUMBER_ID)" : ""}; el agente no puede enviar/recibir por WhatsApp.`,
    comoActivar: metaOk
      ? undefined
      : "Agrega WHATSAPP_TOKEN y WHATSAPP_PHONE_NUMBER_ID en Vercel, y configura el webhook de Meta apuntando a /api/webhook.",
  });

  // Token de verificación del webhook (Meta) — requerido para conectar el webhook
  const verify = !!process.env.WHATSAPP_VERIFY_TOKEN?.trim();
  checks.push({
    id: "verify",
    label: "Token de verificación del webhook (Meta)",
    ok: verify,
    critico: true,
    detalle: verify
      ? "Configurado. Permite que Meta verifique y active el webhook."
      : "No configurado; Meta no podrá verificar el webhook para enviarte mensajes.",
    comoActivar: verify
      ? undefined
      : "Define WHATSAPP_VERIFY_TOKEN en Vercel (un texto que tú inventas, ej. pf_nexo_verify_2026) y ponlo igual en la configuración del webhook de Meta.",
  });

  // Email transaccional (Resend)
  const email = !!process.env.RESEND_API_KEY?.trim();
  checks.push({
    id: "email",
    label: "Email (Resend)",
    ok: email,
    critico: false,
    detalle: email
      ? "Configurado. Se pueden enviar notificaciones por email."
      : "No configurado; las notificaciones por email quedan deshabilitadas.",
    comoActivar: email ? undefined : "Opcional: agrega RESEND_API_KEY y EMAIL_FROM en Vercel.",
  });

  // Notificaciones push (VAPID)
  const push = !!(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() && process.env.VAPID_PRIVATE_KEY?.trim()
  );
  checks.push({
    id: "push",
    label: "Notificaciones push",
    ok: push,
    critico: false,
    detalle: push
      ? "Configuradas. El equipo recibe avisos de nuevos mensajes."
      : "No configuradas; sin avisos push en el navegador.",
    comoActivar: push
      ? undefined
      : "Opcional: agrega NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY y VAPID_SUBJECT en Vercel.",
  });

  return checks;
}
