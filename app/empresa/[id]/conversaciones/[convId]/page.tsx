import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { reactivarIA } from "@/app/actions/conversaciones";

export default async function EmpresaConversacionDetallePage({
  params,
}: {
  params: Promise<{ id: string; convId: string }>;
}) {
  const { id, convId } = await params;

  const conversacion = await prisma.conversacion.findUnique({
    where: { id: convId },
    include: {
      empresa: { select: { nombre: true } },
      mensajes: { orderBy: { creadoEn: "asc" } },
    },
  });

  if (!conversacion || conversacion.empresaId !== id) notFound();

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/empresa/${id}/conversaciones`} className="text-gray-400 hover:text-gray-600 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-900">{conversacion.numeroCliente}</h1>
          <p className="text-xs text-gray-400">{conversacion.mensajes.length} mensajes</p>
        </div>
        <div className="flex items-center gap-2">
          {conversacion.modoHumano ? (
            <form action={reactivarIA}>
              <input type="hidden" name="id" value={conversacion.id} />
              <button type="submit" className="flex items-center gap-1.5 text-xs bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Reactivar IA
              </button>
            </form>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              IA activa
            </span>
          )}
        </div>
      </div>

      {conversacion.modoHumano && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
          Esta conversación está en modo humano. La IA no responderá hasta que hagas clic en &ldquo;Reactivar IA&rdquo;.
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4 min-h-80">
        {conversacion.mensajes.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">Sin mensajes en esta conversación</p>
        ) : (
          conversacion.mensajes.map((m) => (
            <div key={m.id} className={`flex ${m.rol === "CLIENTE" ? "justify-start" : "justify-end"}`}>
              <div className={`max-w-sm ${m.rol === "CLIENTE" ? "items-start" : "items-end"} flex flex-col gap-1`}>
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  m.rol === "CLIENTE"
                    ? "bg-gray-100 text-gray-800 rounded-tl-sm"
                    : "bg-blue-600 text-white rounded-tr-sm"
                }`}>
                  {m.contenido}
                </div>
                <p className="text-xs text-gray-400 px-1">
                  {m.rol === "CLIENTE" ? "Cliente" : "IA"} · {m.creadoEn.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
