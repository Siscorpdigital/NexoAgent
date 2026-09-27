import { prisma } from "@/lib/prisma";
import { conTarjeta, SIN_CACHE, type ContextoId } from "@/lib/tarjetas/api";

export const dynamic = "force-dynamic";

/** Historial de escaneos: totales, actividad de los últimos 30 días y detalle reciente. */
export async function GET(req: Request, ctx: ContextoId) {
  const r = await conTarjeta(req, ctx);
  if (r instanceof Response) return r;
  const { tarjeta } = r;

  const hace30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [recientes, ultimos30] = await Promise.all([
    prisma.tarjetaEvento.findMany({
      where: { tarjetaId: tarjeta.id },
      orderBy: { creadoEn: "desc" },
      take: 200,
      select: { tipo: true, dispositivo: true, ciudad: true, pais: true, creadoEn: true },
    }),
    prisma.tarjetaEvento.findMany({
      where: { tarjetaId: tarjeta.id, tipo: "escaneo", creadoEn: { gte: hace30 } },
      select: { creadoEn: true },
    }),
  ]);

  // Escaneos por día (clave AAAA-MM-DD en hora de Venezuela).
  const porDia: Record<string, number> = {};
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Caracas" });
  for (const e of ultimos30) {
    const dia = fmt.format(e.creadoEn);
    porDia[dia] = (porDia[dia] || 0) + 1;
  }

  return Response.json(
    {
      escaneos: tarjeta.escaneos,
      contactosGuardados: tarjeta.contactosGuardados,
      ultimoEscaneo: tarjeta.ultimoEscaneo,
      ultimos30Dias: ultimos30.length,
      porDia,
      eventos: recientes,
    },
    { headers: SIN_CACHE },
  );
}
