import { prisma } from "@/lib/prisma";
import { urlBase } from "@/lib/tarjetas/config";
import { serializar } from "@/lib/tarjetas/datos";
import { conTarjeta, SIN_CACHE, type ContextoId } from "@/lib/tarjetas/api";

export const dynamic = "force-dynamic";

/** Activa o desactiva el perfil. Desactivado, su QR deja de abrir la tarjeta. */
export async function POST(req: Request, ctx: ContextoId) {
  const r = await conTarjeta(req, ctx);
  if (r instanceof Response) return r;

  const body = (await req.json().catch(() => ({}))) as { activa?: unknown };
  if (typeof body.activa !== "boolean") {
    return Response.json({ error: "Falta el estado (activa: true/false)." }, { status: 400 });
  }
  const tarjeta = await prisma.tarjetaDigital.update({
    where: { id: r.tarjeta.id },
    data: { activa: body.activa },
  });
  return Response.json({ tarjeta: serializar(tarjeta, urlBase(req.headers)) }, { headers: SIN_CACHE });
}
