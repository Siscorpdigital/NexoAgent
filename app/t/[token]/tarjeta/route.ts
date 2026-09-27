import { urlBase, urlPublica } from "@/lib/tarjetas/config";
import { renderTarjeta } from "@/lib/tarjetas/render";
import { tarjetaActivaPorToken } from "@/lib/tarjetas/publica";

export const dynamic = "force-dynamic";

/** Imagen PNG de la tarjeta (solo perfiles activos). */
export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const tarjeta = await tarjetaActivaPorToken(token);
  if (!tarjeta) return new Response("Tarjeta no disponible", { status: 404 });

  return renderTarjeta({
    nombre: tarjeta.nombre,
    urlQR: urlPublica(urlBase(req.headers), tarjeta.token),
    origen: new URL(req.url).origin,
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=300",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
