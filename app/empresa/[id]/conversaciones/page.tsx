import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function EmpresaConversacionesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const conversaciones = await prisma.conversacion.findMany({
    where: { empresaId: id },
    orderBy: { actualizadoEn: "desc" },
    include: {
      mensajes: { orderBy: { creadoEn: "desc" }, take: 1 },
      _count: { select: { mensajes: true } },
    },
  });

  const pendientes = conversaciones.filter((c) => c.modoHumano);
  const normales = conversaciones.filter((c) => !c.modoHumano);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Conversaciones</h1>
        <p className="text-gray-500 text-sm mt-1">{conversaciones.length} chats en total</p>
      </div>

      {conversaciones.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          </div>
          <p className="text-gray-500 text-sm">Aún no hay conversaciones.</p>
          <p className="text-gray-400 text-xs mt-1">Cuando llegue el primer WhatsApp aparecerá aquí.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pendientes.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
                Requieren atención humana ({pendientes.length})
              </p>
              <div className="bg-white rounded-xl border border-amber-200 shadow-sm divide-y divide-gray-50">
                {pendientes.map((c) => <ConversacionItem key={c.id} c={c} empresaId={id} />)}
              </div>
            </div>
          )}

          {normales.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                Activas con IA ({normales.length})
              </p>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-50">
                {normales.map((c) => <ConversacionItem key={c.id} c={c} empresaId={id} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface ConversacionItemProps {
  numeroCliente: string;
  modoHumano: boolean;
  mensajes: Array<{ contenido: string }>;
  _count: { mensajes: number };
  id: string;
  actualizadoEn: Date;
}

function ConversacionItem({ c, empresaId }: { c: ConversacionItemProps; empresaId: string }) {
  return (
    <Link href={`/empresa/${empresaId}/conversaciones/${c.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
      <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-medium text-gray-900">{c.numeroCliente}</p>
          {c.modoHumano && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">Atención humana</span>}
        </div>
        <p className="text-xs text-gray-400 truncate">{c.mensajes[0]?.contenido ?? "Sin mensajes"}</p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="text-xs text-gray-400">{c._count.mensajes} msg</span>
        <span className="text-xs text-gray-400">
          {c.actualizadoEn.toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}
        </span>
        <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
      </div>
    </Link>
  );
}
