import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

/**
 * Envío de correo del cotizador (cotizaciones y solicitudes de emisión).
 *
 * El correo lo envía el Google Apps Script de la cuenta Google Workspace
 * suscripcion@previsionfamiliar.com.ve. Antes el navegador lo llamaba
 * directamente; ahora pasa por aquí para que no dependa de la política de
 * seguridad del navegador (CSP/CORS) ni de extensiones, y para devolver al
 * cotizador el motivo exacto cuando Google rechaza el envío.
 *
 * Solo lo pueden usar usuarios con sesión activa en el cotizador.
 */
const GAS_URL =
  process.env.CORREO_GAS_URL ||
  "https://script.google.com/macros/s/AKfycbwDJVcpLrCSLYwDT02OZ2l_guJVKeR7N_sG5SlABjRKCzFRtd1zlEQhyV6Xw9XTcJIo/exec";

const EMAIL = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;
const MAX_HTML = 300_000;

function error(mensaje: string, status: number) {
  return Response.json({ status: "error", message: mensaje }, { status, headers: { "Cache-Control": "no-store" } });
}

async function usuarioActivo(req: Request): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const token = (req.headers.get("authorization") || "").match(/^Bearer\s+(.+)$/i)?.[1];
  if (!url || !anon || !token) return false;
  try {
    const sb = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data } = await sb.auth.getUser(token);
    if (!data.user) return false;
    const { data: perfil } = await sb.from("profiles").select("active").eq("id", data.user.id).maybeSingle();
    return !!perfil && perfil.active !== false;
  } catch {
    return false;
  }
}

/** Texto legible de una respuesta HTML de Google (p. ej. página de error del script). */
function resumenHtml(texto: string): string {
  return texto
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300);
}

export async function POST(req: Request) {
  if (!(await usuarioActivo(req))) return error("Sesión no válida. Cierre sesión y vuelva a entrar al cotizador.", 401);

  const datos = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const to = typeof datos?.to === "string" ? datos.to.trim() : "";
  const subject = typeof datos?.subject === "string" ? datos.subject.trim().slice(0, 250) : "";
  const htmlBody = typeof datos?.htmlBody === "string" ? datos.htmlBody : "";
  const body = typeof datos?.body === "string" ? datos.body : htmlBody.replace(/<[^>]+>/g, "");

  if (!EMAIL.test(to)) return error("El correo del destinatario no es válido.", 400);
  if (!subject) return error("Falta el asunto del correo.", 400);
  if (!htmlBody || htmlBody.length > MAX_HTML) return error("El contenido del correo no es válido.", 400);

  let respuesta: Response;
  try {
    respuesta = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ to, subject, body, htmlBody }),
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(45_000),
    });
  } catch (e) {
    console.error("[correo] No se pudo contactar el servicio de Google:", e);
    return error("No se pudo contactar el servicio de correo de Google. Intente de nuevo en unos minutos.", 502);
  }

  const texto = await respuesta.text();
  let json: { status?: string; message?: string } | null = null;
  try {
    json = JSON.parse(texto);
  } catch {
    json = null;
  }

  if (json && json.status === "ok") {
    return Response.json(json, { headers: { "Cache-Control": "no-store" } });
  }

  const detalle = json?.message || resumenHtml(texto) || `HTTP ${respuesta.status}`;
  console.error("[correo] Google Apps Script rechazó el envío:", respuesta.status, detalle);
  return error(`El servicio de correo de Google respondió: ${detalle}`, 502);
}
