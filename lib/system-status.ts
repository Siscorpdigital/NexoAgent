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

  // WhatsApp (Twilio) — envío/recepción de mensajes
  const twilio = !!(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
    process.env.TWILIO_AUTH_TOKEN?.trim() &&
    process.env.TWILIO_WHATSAPP_FROM?.trim()
  );
  checks.push({
    id: "whatsapp",
    label: "WhatsApp (Twilio)",
    ok: twilio,
    critico: true,
    detalle: twilio
      ? "Credenciales de Twilio configuradas."
      : "Faltan credenciales de Twilio; el agente no puede enviar/recibir por WhatsApp.",
    comoActivar: twilio
      ? undefined
      : "Agrega TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN y TWILIO_WHATSAPP_FROM en Vercel, y apunta el webhook de Twilio a /api/webhook.",
  });

  // Token de verificación del webhook (Meta) — opcional
  const verify = !!process.env.WHATSAPP_VERIFY_TOKEN?.trim();
  checks.push({
    id: "verify",
    label: "Token de verificación del webhook",
    ok: verify,
    critico: false,
    detalle: verify
      ? "Configurado (necesario si verificas el webhook con Meta)."
      : "No configurado (solo necesario si usas verificación de Meta).",
    comoActivar: verify ? undefined : "Opcional: agrega WHATSAPP_VERIFY_TOKEN en Vercel.",
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
