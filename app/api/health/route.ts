import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const empresas = await prisma.empresa.count();
    return Response.json({
      estado: "ok",
      base_de_datos: "conectada",
      empresas_registradas: empresas,
    });
  } catch {
    return Response.json(
      { estado: "error", base_de_datos: "no disponible" },
      { status: 500 }
    );
  }
}
