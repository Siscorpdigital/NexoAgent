import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import { urlBase } from "@/lib/tarjetas/config";
import { generarToken, serializar } from "@/lib/tarjetas/datos";
import { conTarjeta, SIN_CACHE, type ContextoId } from "@/lib/tarjetas/api";

export const dynamic = "force-dynamic";

/**
 * Genera un QR nuevo (nueva URL oculta). El QR anterior deja de funcionar;
 * útil si una tarjeta se compartió por error o un empleado cambia de puesto.
 */
export async function POST(req: Request, ctx: ContextoId) {
  const r = await conTarjeta(req, ctx);
  if (r instanceof Response) return r;

  for (let intento = 0; intento < 5; intento++) {
    try {
      const tarjeta = await prisma.tarjetaDigital.update({
        where: { id: r.tarjeta.id },
        data: { token: generarToken(r.tarjeta.nombre) },
      });
      return Response.json({ tarjeta: serializar(tarjeta, urlBase(req.headers)) }, { headers: SIN_CACHE });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") continue;
      throw error;
    }
  }
  return Response.json({ error: "No se pudo generar un código único." }, { status: 500 });
}
