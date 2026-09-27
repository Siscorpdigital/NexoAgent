import { urlBase, urlPublica } from "@/lib/tarjetas/config";
import { qrPng, qrSvg } from "@/lib/tarjetas/qr";
import { slugArchivo } from "@/lib/tarjetas/texto";
import { conTarjeta, descarga, type ContextoId } from "@/lib/tarjetas/api";

export const dynamic = "force-dynamic";

/** Descarga del QR del empleado: ?formato=png (por defecto) o ?formato=svg. */
export async function GET(req: Request, ctx: ContextoId) {
  const r = await conTarjeta(req, ctx);
  if (r instanceof Response) return r;

  const url = urlPublica(urlBase(req.headers), r.tarjeta.token);
  const archivo = `qr-${slugArchivo(r.tarjeta.nombre)}`;
  const formato = new URL(req.url).searchParams.get("formato");

  if (formato === "svg") {
    return new Response(qrSvg(url), { headers: descarga(`${archivo}.svg`, "image/svg+xml") });
  }
  const png = await qrPng(url);
  return new Response(new Uint8Array(png), { headers: descarga(`${archivo}.png`, "image/png") });
}
