import { prisma } from "@/lib/prisma";

/** Vistas previas de enlaces (WhatsApp, Telegram…) y robots no cuentan como escaneo. */
const BOTS =
  /bot|crawl|spider|slurp|facebookexternalhit|facebot|whatsapp|telegram|slack|discord|twitter|linkedin|pinterest|skype|embedly|preview|headless|lighthouse|curl|wget|python|go-http|okhttp|axios|node-fetch/i;

function dispositivo(ua: string): string {
  if (/iPhone/i.test(ua)) return "iPhone";
  if (/iPad/i.test(ua)) return "iPad";
  if (/Android/i.test(ua)) return /Mobile/i.test(ua) ? "Android" : "Tablet Android";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Macintosh|Mac OS X/i.test(ua)) return "Mac";
  if (/Linux/i.test(ua)) return "Linux";
  return "Otro";
}

function decodificar(v: string | null): string | null {
  if (!v) return null;
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

/**
 * Registra un escaneo (visita desde el QR) o un "guardar contacto". Nunca
 * lanza: un fallo de registro no debe impedir ver la tarjeta.
 */
export async function registrarEvento(tarjetaId: string, tipo: "escaneo" | "vcard", h: Headers): Promise<void> {
  const ua = h.get("user-agent") || "";
  if (!ua || BOTS.test(ua)) return;
  try {
    await prisma.$transaction([
      prisma.tarjetaEvento.create({
        data: {
          tarjetaId,
          tipo,
          dispositivo: dispositivo(ua),
          ciudad: decodificar(h.get("x-vercel-ip-city")),
          pais: h.get("x-vercel-ip-country"),
        },
      }),
      prisma.tarjetaDigital.update({
        where: { id: tarjetaId },
        data:
          tipo === "escaneo"
            ? { escaneos: { increment: 1 }, ultimoEscaneo: new Date() }
            : { contactosGuardados: { increment: 1 } },
      }),
    ]);
  } catch (error) {
    console.error("[tarjetas] No se pudo registrar el evento:", error);
  }
}
