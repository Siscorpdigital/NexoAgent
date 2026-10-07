import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Envío de correo del cotizador, directamente por SMTP de Google Workspace
 * (sin Google Apps Script).
 *
 *  - tipo "cotizacion": la cotización en PDF al cliente.
 *  - tipo "emision":    la solicitud de emisión (PDF de la planilla) SOLO a
 *                       suscripcion@previsionfamiliar.com.ve. El destino lo fija
 *                       el servidor; el navegador no puede cambiarlo.
 *
 * Ambos salen desde no_responder@previsionfamiliar.com.ve.
 *
 * Variables de entorno (Vercel):
 *   SMTP_USER   cuenta que envía (no_responder@previsionfamiliar.com.ve)
 *   SMTP_PASS   contraseña de aplicación de esa cuenta (16 letras, de Google)
 *   SMTP_HOST   opcional, por defecto smtp.gmail.com
 *   SMTP_PORT   opcional, por defecto 465 (SSL)
 *   CORREO_SUSCRIPCION  opcional, por defecto suscripcion@previsionfamiliar.com.ve
 *
 * Solo lo pueden usar usuarios con sesión activa en el cotizador.
 */

const NOMBRE_REMITENTE = "Previsión Familiar";
const SUSCRIPCION = (process.env.CORREO_SUSCRIPCION || "suscripcion@previsionfamiliar.com.ve").trim();
const EMAIL = /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/;
const MAX_HTML = 300_000;
const MAX_PDF_BYTES = 3_000_000; // Vercel limita el cuerpo de la petición a ~4,5 MB.

type Tipo = "cotizacion" | "emision";

interface Usuario {
  email: string;
  nombre: string;
}

const SIN_CACHE = { "Cache-Control": "no-store" };

function error(mensaje: string, status: number) {
  return Response.json({ status: "error", message: mensaje }, { status, headers: SIN_CACHE });
}

async function usuarioActivo(req: Request): Promise<Usuario | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const token = (req.headers.get("authorization") || "").match(/^Bearer\s+(.+)$/i)?.[1];
  if (!url || !anon || !token) return null;
  try {
    const sb = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data } = await sb.auth.getUser(token);
    if (!data.user) return null;
    const { data: perfil } = await sb.from("profiles").select("active, nombre, email").eq("id", data.user.id).maybeSingle();
    if (!perfil || perfil.active === false) return null;
    return { email: String(perfil.email || data.user.email || ""), nombre: String(perfil.nombre || "") };
  } catch {
    return null;
  }
}

let transporte: nodemailer.Transporter | null = null;

function obtenerTransporte(): nodemailer.Transporter | null {
  const user = process.env.SMTP_USER?.trim();
  // Google muestra la contraseña de aplicación en grupos con espacios; se aceptan igual.
  const pass = process.env.SMTP_PASS?.replace(/\s+/g, "");
  if (!user || !pass) return null;
  if (!transporte) {
    const port = Number(process.env.SMTP_PORT || 465);
    transporte = nodemailer.createTransport({
      host: process.env.SMTP_HOST?.trim() || "smtp.gmail.com",
      port,
      secure: port === 465,
      auth: { user, pass },
      connectionTimeout: 15_000,
      greetingTimeout: 15_000,
      socketTimeout: 40_000,
    });
  }
  return transporte;
}

/** Nombre de archivo seguro para el adjunto. */
function nombreArchivo(nombre: unknown, porDefecto: string): string {
  const limpio = String(nombre || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
  return (limpio || porDefecto).replace(/(\.pdf)?$/i, ".pdf");
}

/** Mensaje claro para los fallos típicos de SMTP con Google. */
function explicarFallo(e: unknown): string {
  const err = e as { code?: string; responseCode?: number; response?: string; message?: string };
  const texto = `${err.response || ""} ${err.message || ""}`;
  if (err.code === "EAUTH" || err.responseCode === 535 || /Username and Password not accepted|BadCredentials/i.test(texto)) {
    return "Google rechazó el usuario o la contraseña de aplicación de la cuenta que envía. Revise SMTP_USER y SMTP_PASS en Vercel.";
  }
  if (/Daily user sending limit|limit exceeded|5\.4\.5/i.test(texto)) {
    return "Se alcanzó el límite diario de envíos de Google para la cuenta que envía. Intente más tarde.";
  }
  if (err.code === "ETIMEDOUT" || err.code === "ECONNECTION" || err.code === "ESOCKET") {
    return "No se pudo conectar con el servidor de correo de Google. Intente de nuevo en unos minutos.";
  }
  return `El servidor de correo respondió: ${(err.response || err.message || "error desconocido").slice(0, 300)}`;
}

/** Comprobación rápida desde el navegador de que el servicio está publicado y configurado. */
export function GET() {
  return Response.json(
    {
      servicio: "correo del cotizador",
      version: 3,
      envio: "SMTP Google Workspace",
      configurado: !!(process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim()),
      remitente: process.env.SMTP_USER?.trim() || null,
    },
    { headers: SIN_CACHE },
  );
}

export async function POST(req: Request) {
  const usuario = await usuarioActivo(req);
  if (!usuario) return error("Sesión no válida. Cierre sesión y vuelva a entrar al cotizador.", 401);

  const smtp = obtenerTransporte();
  if (!smtp) {
    return error("El envío de correos no está configurado todavía (faltan SMTP_USER y SMTP_PASS en Vercel).", 503);
  }

  const datos = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const tipo: Tipo = datos?.tipo === "emision" ? "emision" : "cotizacion";
  const subject = typeof datos?.subject === "string" ? datos.subject.replace(/[\r\n]+/g, " ").trim().slice(0, 250) : "";
  const html = typeof datos?.htmlBody === "string" ? datos.htmlBody : "";
  const text = html.replace(/<(style|script)[\s\S]*?<\/\1>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  const to = tipo === "emision" ? SUSCRIPCION : typeof datos?.to === "string" ? datos.to.trim() : "";
  if (!EMAIL.test(to)) return error("El correo del destinatario no es válido.", 400);
  if (!subject) return error("Falta el asunto del correo.", 400);
  if (!html || html.length > MAX_HTML) return error("El contenido del correo no es válido.", 400);

  const attachments: { filename: string; content: Buffer; contentType: string }[] = [];
  const adjunto = datos?.adjunto as { nombre?: unknown; base64?: unknown } | undefined;
  if (adjunto && typeof adjunto.base64 === "string" && adjunto.base64) {
    const contenido = Buffer.from(adjunto.base64, "base64");
    if (contenido.length > MAX_PDF_BYTES) return error("El PDF es demasiado grande para enviarlo por correo.", 413);
    if (contenido.subarray(0, 5).toString("latin1") !== "%PDF-") return error("El adjunto no es un PDF válido.", 400);
    attachments.push({
      filename: nombreArchivo(adjunto.nombre, tipo === "emision" ? "Solicitud_Emision_PF.pdf" : "Cotizacion_PF.pdf"),
      content: contenido,
      contentType: "application/pdf",
    });
  }

  const remitente = process.env.SMTP_USER!.trim();
  try {
    const info = await smtp.sendMail({
      from: { name: NOMBRE_REMITENTE, address: remitente },
      to,
      // Las solicitudes de emisión se responden directamente al asesor que las envió.
      replyTo: tipo === "emision" && EMAIL.test(usuario.email) ? { name: usuario.nombre || usuario.email, address: usuario.email } : undefined,
      subject,
      html,
      text,
      attachments,
    });
    return Response.json({ status: "ok", id: info.messageId, to }, { headers: SIN_CACHE });
  } catch (e) {
    console.error("[correo] Fallo al enviar", tipo, "a", to, e);
    return error(explicarFallo(e), 502);
  }
}
