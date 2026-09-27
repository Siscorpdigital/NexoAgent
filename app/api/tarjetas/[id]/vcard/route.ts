import { construirVCard } from "@/lib/tarjetas/vcard";
import { parsearExtras } from "@/lib/tarjetas/datos";
import { slugArchivo } from "@/lib/tarjetas/texto";
import { conTarjeta, descarga, type ContextoId } from "@/lib/tarjetas/api";

export const dynamic = "force-dynamic";

/** Archivo vCard (.vcf) del empleado, para el panel de administración. */
export async function GET(req: Request, ctx: ContextoId) {
  const r = await conTarjeta(req, ctx);
  if (r instanceof Response) return r;
  const vcard = construirVCard({ ...r.tarjeta, extras: parsearExtras(r.tarjeta.extras) });
  return new Response(vcard, {
    headers: descarga(`${slugArchivo(r.tarjeta.nombre)}.vcf`, "text/vcard; charset=utf-8"),
  });
}
