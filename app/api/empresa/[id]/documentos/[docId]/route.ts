import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const { id, docId } = await params;
  await prisma.documento.deleteMany({
    where: { id: docId, empresaId: id },
  });
  return Response.json({ ok: true });
}
