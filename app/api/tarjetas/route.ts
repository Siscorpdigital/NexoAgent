import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import { autorizarAdmin } from "@/lib/tarjetas/auth";
import { urlBase } from "@/lib/tarjetas/config";
import { generarToken, serializar, validarTarjeta } from "@/lib/tarjetas/datos";
import { SIN_CACHE } from "@/lib/tarjetas/api";

export const dynamic = "force-dynamic";

/** Lista de tarjetas (panel de administración). */
export async function GET(req: Request) {
  const admin = await autorizarAdmin(req);
  if (admin instanceof Response) return admin;

  const tarjetas = await prisma.tarjetaDigital.findMany({ orderBy: { creadoEn: "desc" } });
  const base = urlBase(req.headers);
  return Response.json({ tarjetas: tarjetas.map((t) => serializar(t, base)) }, { headers: SIN_CACHE });
}

/** Crea una persona con su QR (token único) ya generado. */
export async function POST(req: Request) {
  const admin = await autorizarAdmin(req);
  if (admin instanceof Response) return admin;

  const v = validarTarjeta(await req.json().catch(() => null));
  if (!v.ok) return Response.json({ error: v.error }, { status: 400 });
  const { extras, ...datos } = v.datos;

  for (let intento = 0; intento < 5; intento++) {
    try {
      const tarjeta = await prisma.tarjetaDigital.create({
        data: {
          ...datos,
          extras: extras as unknown as Prisma.InputJsonValue,
          token: generarToken(datos.nombre),
          creadoPor: admin.email,
        },
      });
      return Response.json({ tarjeta: serializar(tarjeta, urlBase(req.headers)) }, { status: 201, headers: SIN_CACHE });
    } catch (error) {
      // Colisión de token (prácticamente imposible): se reintenta con otro.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") continue;
      throw error;
    }
  }
  return Response.json({ error: "No se pudo generar un código único." }, { status: 500 });
}
