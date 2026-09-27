import { prisma } from "@/lib/prisma";
import type { TarjetaDigital } from "@/app/generated/prisma/client";
import { autorizarAdmin, type AdminTarjetas } from "./auth";

export type ContextoId = { params: Promise<{ id: string }> };

export const SIN_CACHE = { "Cache-Control": "private, no-store" };

/** Autoriza al admin y carga la tarjeta del parámetro [id]. */
export async function conTarjeta(
  req: Request,
  ctx: ContextoId,
): Promise<{ admin: AdminTarjetas; tarjeta: TarjetaDigital } | Response> {
  const admin = await autorizarAdmin(req);
  if (admin instanceof Response) return admin;
  const { id } = await ctx.params;
  const tarjeta = await prisma.tarjetaDigital.findUnique({ where: { id } });
  if (!tarjeta) return Response.json({ error: "Tarjeta no encontrada." }, { status: 404 });
  return { admin, tarjeta };
}

export function descarga(nombreArchivo: string, tipo: string): Record<string, string> {
  return {
    ...SIN_CACHE,
    "Content-Type": tipo,
    "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
  };
}
