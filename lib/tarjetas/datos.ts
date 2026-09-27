import { randomBytes } from "crypto";
import type { TarjetaDigital } from "@/app/generated/prisma/client";
import { urlPublica } from "./config";

export const TIPOS_EXTRA = ["whatsapp", "email", "telefono", "celular"] as const;
export type TipoExtra = (typeof TIPOS_EXTRA)[number];

export interface ContactoExtra {
  tipo: TipoExtra;
  valor: string;
  etiqueta?: string;
}

export interface DatosTarjeta {
  nombre: string;
  cargo: string | null;
  email: string | null;
  telefono: string | null;
  celular: string | null;
  whatsapp: string | null;
  web: string | null;
  foto: string | null;
  extras: ContactoExtra[];
}

/** Sin 0/O/1/l/I para evitar confusiones si alguien transcribe la URL. */
const ALFABETO = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Token aleatorio no adivinable para la URL oculta (/t/<token>). */
export function generarToken(longitud = 10): string {
  const limite = 256 - (256 % ALFABETO.length); // evita sesgo de módulo
  let token = "";
  while (token.length < longitud) {
    for (const b of randomBytes(longitud * 2)) {
      if (b < limite && token.length < longitud) token += ALFABETO[b % ALFABETO.length];
    }
  }
  return token;
}

export function tokenValido(token: string): boolean {
  return /^[A-Za-z0-9]{6,32}$/.test(token);
}

function texto(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.replace(/\s+/g, " ").trim();
  return t ? t.slice(0, max) : null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FOTO_RE = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/;

export function parsearExtras(v: unknown): ContactoExtra[] {
  if (!Array.isArray(v)) return [];
  const out: ContactoExtra[] = [];
  for (const e of v) {
    if (!e || typeof e !== "object") continue;
    const { tipo, valor, etiqueta } = e as Record<string, unknown>;
    if (!TIPOS_EXTRA.includes(tipo as TipoExtra)) continue;
    const val = texto(valor, 120);
    if (!val) continue;
    const et = texto(etiqueta, 40);
    out.push({ tipo: tipo as TipoExtra, valor: val, ...(et ? { etiqueta: et } : {}) });
    if (out.length >= 10) break;
  }
  return out;
}

/** Valida y normaliza los datos que envía el panel de administración. */
export function validarTarjeta(body: unknown): { ok: true; datos: DatosTarjeta } | { ok: false; error: string } {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const nombre = texto(b.nombre, 60);
  if (!nombre || nombre.length < 2) return { ok: false, error: "El nombre es obligatorio." };

  const email = texto(b.email, 120);
  if (email && !EMAIL_RE.test(email)) return { ok: false, error: "El email no es válido." };

  let foto: string | null = null;
  if (typeof b.foto === "string" && b.foto) {
    if (b.foto.length > 700_000) return { ok: false, error: "La foto es demasiado pesada." };
    if (!FOTO_RE.test(b.foto)) return { ok: false, error: "Formato de foto no válido." };
    foto = b.foto;
  }

  const extras = parsearExtras(b.extras);
  for (const e of extras) {
    if (e.tipo === "email" && !EMAIL_RE.test(e.valor)) {
      return { ok: false, error: `Email adicional no válido: ${e.valor}` };
    }
  }

  return {
    ok: true,
    datos: {
      nombre,
      cargo: texto(b.cargo, 80),
      email,
      telefono: texto(b.telefono, 30),
      celular: texto(b.celular, 30),
      whatsapp: texto(b.whatsapp, 30),
      web: texto(b.web, 120),
      foto,
      extras,
    },
  };
}

/**
 * Teléfono en formato internacional (+58…). Si se escribe en formato local
 * venezolano (0414…, 414…) se le antepone +58.
 */
export function telefonoInternacional(v: string | null | undefined): string {
  if (!v) return "";
  let t = v.replace(/[^\d+]/g, "");
  if (t.startsWith("00")) t = "+" + t.slice(2);
  if (t.startsWith("+")) return "+" + t.slice(1).replace(/\D/g, "");
  const d = t.replace(/\D/g, "");
  if (!d) return "";
  if (d.length === 11 && d.startsWith("0")) return "+58" + d.slice(1);
  if (d.length === 10 && /^[24]/.test(d)) return "+58" + d;
  return "+" + d;
}

/** Enlace de WhatsApp (wa.me) para un número. */
export function enlaceWhatsApp(v: string | null | undefined): string {
  const t = telefonoInternacional(v).replace(/\D/g, "");
  return t ? `https://wa.me/${t}` : "";
}

export function urlWeb(v: string | null | undefined): string {
  if (!v) return "";
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

/** Forma pública para el panel de administración. */
export function serializar(t: TarjetaDigital, base: string) {
  return {
    id: t.id,
    token: t.token,
    nombre: t.nombre,
    cargo: t.cargo,
    email: t.email,
    telefono: t.telefono,
    celular: t.celular,
    whatsapp: t.whatsapp,
    web: t.web,
    foto: t.foto,
    extras: parsearExtras(t.extras),
    activa: t.activa,
    escaneos: t.escaneos,
    contactosGuardados: t.contactosGuardados,
    ultimoEscaneo: t.ultimoEscaneo,
    creadoEn: t.creadoEn,
    actualizadoEn: t.actualizadoEn,
    urlPublica: urlPublica(base, t.token),
  };
}
