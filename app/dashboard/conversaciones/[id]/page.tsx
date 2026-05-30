import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { reactivarIA } from "@/app/actions/conversaciones";

export default async function ConversacionDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const conversacion = await prisma.conversacion.findUnique({
    where: { id },
    include: {
      empresa: { select: { nombre: true } },
      mensajes: { orderBy: { creadoEn: "asc" } },
    },
  });

  if (!conversacion) notFound();

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/conversaciones"
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          ← Volver
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {conversacion.numeroCliente}
          </h1>
          <p className="text-xs text-gray-400">{conversacion.empresa.nombre}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {conversacion.modoHumano && (
            <form action={reactivarIA}>
              <input type="hidden" name="id" value={conversacion.id} />
              <button
                type="submit"
                className="text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 font-medium px-3 py-1 rounded-full transition-colors"
              >
                ⚠️ Atención humana — Reactivar IA
              </button>
            </form>
          )}
          <span
            className={`text-xs px-2 py-1 rounded-full font-medium ${
              conversacion.estado === "ACTIVA"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {conversacion.estado}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3 min-h-64">
        {conversacion.mensajes.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">
            Sin mensajes en esta conversación
          </p>
        ) : (
          conversacion.mensajes.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.rol === "CLIENTE" ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${
                  m.rol === "CLIENTE"
                    ? "bg-gray-100 text-gray-800 rounded-tl-sm"
                    : "bg-blue-600 text-white rounded-tr-sm"
                }`}
              >
                <p>{m.contenido}</p>
                <p
                  className={`text-xs mt-1 ${
                    m.rol === "CLIENTE" ? "text-gray-400" : "text-blue-200"
                  }`}
                >
                  {m.creadoEn.toLocaleTimeString("es-MX", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
