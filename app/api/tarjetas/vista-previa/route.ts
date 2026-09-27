import { autorizarAdmin } from "@/lib/tarjetas/auth";
import { urlBase, urlPublica } from "@/lib/tarjetas/config";
import { renderTarjeta } from "@/lib/tarjetas/render";
import { SIN_CACHE } from "@/lib/tarjetas/api";

export const dynamic = "force-dynamic";

/** Vista previa en vivo de la tarjeta mientras se escribe el nombre en el editor. */
export async function POST(req: Request) {
  const admin = await autorizarAdmin(req);
  if (admin instanceof Response) return admin;

  const body = (await req.json().catch(() => ({}))) as { nombre?: unknown; token?: unknown };
  const nombre = typeof body.nombre === "string" && body.nombre.trim() ? body.nombre.trim().slice(0, 60) : "Nombre Apellido";
  const token = typeof body.token === "string" && /^[A-Za-z0-9]{6,32}$/.test(body.token) ? body.token : "vistaprevia";

  return renderTarjeta({
    nombre,
    urlQR: urlPublica(urlBase(req.headers), token),
    origen: new URL(req.url).origin,
    headers: SIN_CACHE,
  });
}
