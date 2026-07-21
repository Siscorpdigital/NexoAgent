import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { enviarMensajeHumano, cambiarControlConversacion } from "@/app/actions/conversaciones";
import { transferirConversacion } from "@/app/actions/agentes";
import FormularioRespuesta from "@/app/components/FormularioRespuesta";
import ChatMessages from "@/app/components/ChatMessages";
import ControlAgenteSwitch from "@/app/components/ControlAgenteSwitch";

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
      agente: true,
      mensajes: { orderBy: { creadoEn: "asc" } },
    },
  });

  if (!conversacion || conversacion.empresaId !== id) notFound();

  // Obtener todos los agentes activos de la empresa para el selector
  const agentes = await prisma.agente.findMany({
    where: {
      empresaId: id,
      activo: true,
    },
    orderBy: { esPrincipal: "desc" },
  });

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/empresa/${id}/conversaciones`}
          className="transition-colors hover:opacity-70"
          style={{ color: "#5C7872" }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold font-roboto tracking-wide" style={{ color: "#2D5750" }}>
            {conversacion.numeroCliente}
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "#5C7872" }}>
            {conversacion.mensajes.length} mensaje{conversacion.mensajes.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Switch de control: IA ↔ Atención humana */}
      <div className="mb-4">
        <ControlAgenteSwitch
          conversacionId={conversacion.id}
          empresaId={id}
          numeroCliente={conversacion.numeroCliente}
          modoHumano={conversacion.modoHumano}
          cambiarControl={cambiarControlConversacion}
        />
      </div>

      {/* Info del agente asignado */}
      {conversacion.agente && (
        <div
          className="mb-4 rounded-xl px-4 py-3 flex items-center justify-between"
          style={{
            background: `${conversacion.agente.color}10`,
            border: `1px solid ${conversacion.agente.color}40`,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: conversacion.agente.color || "#3B82F6" }}
            >
              {conversacion.agente.nombre[0]}
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "#2D5750" }}>
                {conversacion.agente.nombre}
              </p>
              {conversacion.agente.descripcion && (
                <p className="text-xs" style={{ color: "#5C7872" }}>
                  {conversacion.agente.descripcion}
                </p>
              )}
            </div>
          </div>

          {agentes.length > 1 && (
            <details className="relative">
              <summary className="cursor-pointer text-xs px-3 py-1.5 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 list-none">
                Transferir
              </summary>
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-10">
                <p className="text-xs font-medium text-gray-700 mb-2 px-2">Transferir a:</p>
                {agentes
                  .filter((a) => a.id !== conversacion.agenteId)
                  .map((agente) => (
                    <form key={agente.id} action={transferirConversacion}>
                      <input type="hidden" name="empresaId" value={id} />
                      <input type="hidden" name="conversacionId" value={convId} />
                      <input type="hidden" name="agenteDestinoId" value={agente.id} />
                      <input type="hidden" name="motivo" value="Transferencia manual desde UI" />
                      <button
                        type="submit"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-lg flex items-center gap-2"
                      >
                        <div
                          className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: agente.color || "#9333EA" }}
                        >
                          {agente.nombre[0]}
                        </div>
                        <span className="flex-1">{agente.nombre}</span>
                      </button>
                    </form>
                  ))}
              </div>
            </details>
          )}
        </div>
      )}

      {/* Área de mensajes */}
      <div
        className="bg-white rounded-xl shadow-sm p-6 space-y-4 min-h-96 max-h-[600px] overflow-y-auto mb-4"
        style={{ border: "1px solid #C8DAD6" }}
      >
        <ChatMessages mensajes={conversacion.mensajes} />
      </div>

      {/* Formulario de respuesta */}
      <FormularioRespuesta
        conversacionId={conversacion.id}
        empresaId={id}
        numeroCliente={conversacion.numeroCliente}
        modoHumano={conversacion.modoHumano}
        enviarMensajeHumano={enviarMensajeHumano}
        ocultarActivacion
      />
    </div>
  );
}
