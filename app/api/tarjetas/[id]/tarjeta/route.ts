import { urlBase, urlPublica } from "@/lib/tarjetas/config";
import { renderTarjeta } from "@/lib/tarjetas/render";
import { slugArchivo } from "@/lib/tarjetas/texto";
import { conTarjeta, descarga, SIN_CACHE, type ContextoId } from "@/lib/tarjetas/api";

export const dynamic = "force-dynamic";

/** Tarjeta en PNG (funciona aunque el perfil esté desactivado). ?descargar=1 para bajarla. */
export async function GET(req: Request, ctx: ContextoId) {
  const r = await conTarjeta(req, ctx);
  if (r instanceof Response) return r;

  const base = urlBase(req.headers);
  const descargar = new URL(req.url).searchParams.get("descargar") === "1";
  return renderTarjeta({
    nombre: r.tarjeta.nombre,
    urlQR: urlPublica(base, r.tarjeta.token),
    origen: new URL(req.url).origin,
    headers: descargar ? descarga(`tarjeta-${slugArchivo(r.tarjeta.nombre)}.png`, "image/png") : SIN_CACHE,
  });
}
