import { autorizarAdmin } from "@/lib/tarjetas/auth";
import { urlBase, urlPublica } from "@/lib/tarjetas/config";
import { renderTarjeta } from "@/lib/tarjetas/render";
import { SIN_CACHE } from "@/lib/tarjetas/api";
import { slugPersona, tokenValido } from "@/lib/tarjetas/datos";

export const dynamic = "force-dynamic";

/** Vista previa en vivo de la tarjeta mientras se escriben el nombre y el cargo en el editor. */
export async function POST(req: Request) {
  const admin = await autorizarAdmin(req);
  if (admin instanceof Response) return admin;

  const body = (await req.json().catch(() => ({}))) as { nombre?: unknown; cargo?: unknown; token?: unknown };
  const nombre = typeof body.nombre === "string" && body.nombre.trim() ? body.nombre.trim().slice(0, 60) : "Nombre Apellido";
  const cargo = typeof body.cargo === "string" ? body.cargo.trim().slice(0, 80) : "";
  // Tarjeta nueva: el QR de muestra ya lleva el nombre, como quedará al guardar.
  const token = typeof body.token === "string" && tokenValido(body.token) ? body.token : `${slugPersona(nombre)}-xxxxx`;

  return renderTarjeta({
    nombre,
    cargo,
    urlQR: urlPublica(urlBase(req.headers), token),
    origen: new URL(req.url).origin,
    headers: SIN_CACHE,
  });
}
