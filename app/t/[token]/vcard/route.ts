import { construirVCard } from "@/lib/tarjetas/vcard";
import { parsearExtras } from "@/lib/tarjetas/datos";
import { registrarEvento } from "@/lib/tarjetas/eventos";
import { tarjetaActivaPorToken } from "@/lib/tarjetas/publica";
import { slugArchivo } from "@/lib/tarjetas/texto";

export const dynamic = "force-dynamic";

/**
 * "Guardar contacto": devuelve la vCard. En iPhone se abre directamente la
 * ficha con "Crear contacto nuevo"; en Android se abre con la app Contactos.
 */
export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const tarjeta = await tarjetaActivaPorToken(token);
  if (!tarjeta) return new Response("Tarjeta no disponible", { status: 404 });

  await registrarEvento(tarjeta.id, "vcard", req.headers);

  const vcard = construirVCard({ ...tarjeta, extras: parsearExtras(tarjeta.extras) });
  return new Response(vcard, {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `inline; filename="${slugArchivo(tarjeta.nombre)}.vcf"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
