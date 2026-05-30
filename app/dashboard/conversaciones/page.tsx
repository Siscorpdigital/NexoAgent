import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function ConversacionesPage() {
  const conversaciones = await prisma.conversacion.findMany({
    orderBy: { actualizadoEn: "desc" },
    include: {
      empresa: { select: { nombre: true } },
      mensajes: {
        orderBy: { creadoEn: "desc" },
        take: 1,
      },
      _count: { select: { mensajes: true } },
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Conversaciones</h1>
      <p className="text-sm text-gray-500 mb-8">
        Todos los chats recibidos por WhatsApp
      </p>

      {conversaciones.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <div className="text-4xl mb-3">💬</div>
          <p className="text-gray-500 text-sm">
            Aún no hay conversaciones. Envía un mensaje de WhatsApp al sandbox.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {conversaciones.map((c) => {
            const ultimoMensaje = c.mensajes[0];
            return (
              <Link
                key={c.id}
                href={`/dashboard/conversaciones/${c.id}`}
                className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-lg flex-shrink-0">
                  👤
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 text-sm">
                        {c.numeroCliente}
                      </span>
                      {c.modoHumano && (
                        <span className="text-xs bg-orange-100 text-orange-700 rounded-full px-2 py-0.5 font-medium">
                          ⚠️ Atención humana
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {c.actualizadoEn.toLocaleDateString("es-MX", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 truncate">
                      {ultimoMensaje?.contenido ?? "Sin mensajes"}
                    </p>
                    <span className="ml-2 text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5 flex-shrink-0">
                      {c._count.mensajes} msg
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
