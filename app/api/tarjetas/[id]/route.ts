import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";
import { urlBase } from "@/lib/tarjetas/config";
import { serializar, validarTarjeta } from "@/lib/tarjetas/datos";
import { conTarjeta, SIN_CACHE, type ContextoId } from "@/lib/tarjetas/api";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: ContextoId) {
  const r = await conTarjeta(req, ctx);
  if (r instanceof Response) return r;
  return Response.json({ tarjeta: serializar(r.tarjeta, urlBase(req.headers)) }, { headers: SIN_CACHE });
}

/** Edita los datos de la persona (el QR/token no cambia). */
export async function PUT(req: Request, ctx: ContextoId) {
  const r = await conTarjeta(req, ctx);
  if (r instanceof Response) return r;

  const v = validarTarjeta(await req.json().catch(() => null));
  if (!v.ok) return Response.json({ error: v.error }, { status: 400 });
  const { extras, ...datos } = v.datos;

  const tarjeta = await prisma.tarjetaDigital.update({
    where: { id: r.tarjeta.id },
    data: { ...datos, extras: extras as unknown as Prisma.InputJsonValue },
  });
  return Response.json({ tarjeta: serializar(tarjeta, urlBase(req.headers)) }, { headers: SIN_CACHE });
}

/** Elimina la persona, su QR y su historial de escaneos. */
export async function DELETE(req: Request, ctx: ContextoId) {
  const r = await conTarjeta(req, ctx);
  if (r instanceof Response) return r;
  await prisma.tarjetaDigital.delete({ where: { id: r.tarjeta.id } });
  return Response.json({ ok: true }, { headers: SIN_CACHE });
}
