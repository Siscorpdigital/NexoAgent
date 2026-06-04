import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function EmpresaHomePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const empresa = await prisma.empresa.findUnique({ where: { id } });
  if (!empresa) notFound();

  const [conversaciones, mensajes, pendientes] = await Promise.all([
    prisma.conversacion.count({ where: { empresaId: id } }),
    prisma.mensaje.count({ where: { conversacion: { empresaId: id } } }),
    prisma.conversacion.count({ where: { empresaId: id, modoHumano: true } }),
  ]);

  const ultimasConversaciones = await prisma.conversacion.findMany({
    where: { empresaId: id },
    orderBy: { actualizadoEn: "desc" },
    take: 5,
    include: {
      mensajes: { orderBy: { creadoEn: "desc" }, take: 1 },
      _count: { select: { mensajes: true } },
    },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{empresa.nombre}</h1>
        <p className="text-gray-500 text-sm mt-1">Resumen de actividad del asistente</p>
      </div>

      {pendientes > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <div>
              <p className="text-amber-800 font-semibold text-sm">{pendientes} conversación{pendientes > 1 ? "es" : ""} esperan atención humana</p>
              <p className="text-amber-600 text-xs">Revisa y retoma con IA cuando estén atendidas</p>
            </div>
          </div>
          <Link href={`/empresa/${id}/conversaciones`} className="text-xs bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors">
            Ver ahora
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-sm text-gray-600">Conversaciones</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{conversaciones}</p>
              <p className="text-xs text-gray-400 mt-1">totales</p>
            </div>
            <span className="text-2xl">💬</span>
          </div>
          {conversaciones > 0 && (
            <Link href={`/empresa/${id}/conversaciones`} className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-2 inline-block">
              Ver todas →
            </Link>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-sm text-gray-600">Mensajes</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{mensajes}</p>
              <p className="text-xs text-gray-400 mt-1">procesados por IA</p>
            </div>
            <span className="text-2xl">🤖</span>
          </div>
        </div>

        <div className={`rounded-xl border p-5 shadow-sm hover:shadow-md transition-shadow ${
          pendientes > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className={`text-sm ${pendientes > 0 ? 'text-amber-700' : 'text-gray-600'}`}>Pendientes</p>
              <p className={`text-3xl font-bold mt-1 ${pendientes > 0 ? 'text-amber-900' : 'text-gray-900'}`}>{pendientes}</p>
              <p className={`text-xs mt-1 ${pendientes > 0 ? 'text-amber-600' : 'text-gray-400'}`}>requieren humano</p>
            </div>
            <span className="text-2xl">{pendientes > 0 ? '⚠️' : '✅'}</span>
          </div>
          {pendientes > 0 && (
            <Link href={`/empresa/${id}/conversaciones`} className="text-xs text-amber-700 hover:text-amber-800 font-medium mt-2 inline-block">
              Atender ahora →
            </Link>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 text-sm">Conversaciones recientes</h2>
          <Link href={`/empresa/${id}/conversaciones`} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
            Ver todas →
          </Link>
        </div>
        {ultimasConversaciones.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-400 text-sm">
            Aún no hay conversaciones. Cuando llegue el primer WhatsApp aparecerá aquí.
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {ultimasConversaciones.map((c) => (
              <Link key={c.id} href={`/empresa/${id}/conversaciones/${c.id}`} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">{c.numeroCliente}</p>
                    {c.modoHumano && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">Humano</span>}
                  </div>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{c.mensajes[0]?.contenido ?? "Sin mensajes"}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-gray-400">{c._count.mensajes} msg</span>
                  <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
