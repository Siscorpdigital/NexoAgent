import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractText } from "unpdf";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const formData = await request.formData();
  const archivo = formData.get("archivo") as File | null;
  const textoDirecto = formData.get("texto") as string | null;
  const nombre = formData.get("nombre") as string;

  try {
    let contenido = "";
    let tipo = "texto";

    if (archivo) {
      tipo = archivo.type === "application/pdf" ? "pdf" : "texto";
      if (archivo.type === "application/pdf") {
        const buffer = new Uint8Array(await archivo.arrayBuffer());
        const { text } = await extractText(buffer, { mergePages: true });
        contenido = Array.isArray(text) ? text.join("\n") : text;
      } else {
        contenido = await archivo.text();
      }
    } else if (textoDirecto) {
      contenido = textoDirecto;
    } else {
      return Response.json({ error: "Sin contenido" }, { status: 400 });
    }

    const documento = await prisma.documento.create({
      data: {
        empresaId: id,
        nombre: nombre || archivo?.name || "Documento sin nombre",
        contenido: contenido.trim(),
        tipo,
      },
    });

    return Response.json({ ok: true, id: documento.id });
  } catch {
    return Response.json({ error: "Error al procesar el archivo" }, { status: 500 });
  }
}
