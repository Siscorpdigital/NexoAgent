import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ConocimientoPanel from "./ConocimientoPanel";

export default async function ConocimientoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Solo PROVEEDOR puede acceder
  const session = await auth();
  if (!session || session.user.rol !== "PROVEEDOR") {
    redirect(`/empresa/${id}`);
  }

  const documentos = await prisma.documento.findMany({
    where: { empresaId: id },
    orderBy: { creadoEn: "desc" },
    include: { _count: { select: { chunks: true } } },
  });

  const totalChunks = documentos.reduce((acc, d) => acc + d._count.chunks, 0);

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold font-sora" style={{ color: "#0E2436" }}>
            Centro de conocimiento
          </h1>
          <p className="text-sm mt-1" style={{ color: "#73869A" }}>
            {documentos.length} documento{documentos.length !== 1 ? "s" : ""} ·{" "}
            {totalChunks} fragmentos indexados
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full font-medium" style={{ background: "rgba(34,178,107,0.08)", color: "#22B26B", border: "1px solid rgba(34,178,107,0.2)" }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#22B26B" }}></span>
          Búsqueda por relevancia activa
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
        <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #E2E9F0" }}>
          <p className="text-3xl font-bold font-sora" style={{ color: "#0E2436" }}>{documentos.length}</p>
          <p className="text-sm mt-1" style={{ color: "#73869A" }}>Documentos</p>
        </div>
        <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #E2E9F0" }}>
          <p className="text-3xl font-bold font-sora" style={{ color: "#2B82F0" }}>{totalChunks}</p>
          <p className="text-sm mt-1" style={{ color: "#73869A" }}>Fragmentos indexados</p>
        </div>
        <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #E2E9F0" }}>
          <p className="text-3xl font-bold font-sora" style={{ color: "#22B26B" }}>
            {documentos.filter(d => d._count.chunks > 0).length}
          </p>
          <p className="text-sm mt-1" style={{ color: "#73869A" }}>Listos para la IA</p>
        </div>
      </div>

      <ConocimientoPanel empresaId={id} documentosIniciales={documentos} />
    </div>
  );
}
