import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { reactivarIA, enviarMensajeHumano, activarModoHumanoFormData } from "@/app/actions/conversaciones";
import FormularioRespuesta from "@/app/components/FormularioRespuesta";
import ChatMessages from "@/app/components/ChatMessages";
import LoadingButton from "@/app/components/ui/LoadingButton";

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
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/empresa/${id}/conversaciones`}
          className="transition-colors hover:opacity-70"
          style={{ color: "#73869A" }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold font-sora" style={{ color: "#0E2436" }}>
            {conversacion.numeroCliente}
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "#73869A" }}>
            {conversacion.mensajes.length} mensaje{conversacion.mensajes.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {conversacion.modoHumano ? (
            <form action={reactivarIA}>
              <input type="hidden" name="id" value={conversacion.id} />
              <LoadingButton
                type="submit"
                className="flex items-center gap-1.5 text-xs text-white px-3 py-1.5 rounded-lg font-medium transition-opacity hover:opacity-90"
                style={{ background: "#FB923C" }}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Reactivar IA
              </LoadingButton>
            </form>
          ) : (
            <span
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium"
              style={{ color: "#22B26B", background: "rgba(34,178,107,0.08)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#22B26B" }}></span>
              IA activa
            </span>
          )}
        </div>
      </div>

      {conversacion.modoHumano && (
        <div
          className="mb-4 rounded-xl px-4 py-3 text-sm"
          style={{ background: "rgba(251,146,60,0.08)", border: "1px solid rgba(251,146,60,0.2)", color: "#FB923C" }}
        >
          💬 Modo humano activo. Puedes responder al cliente usando el formulario de abajo.
        </div>
      )}

      {/* Área de mensajes */}
      <div
        className="bg-white rounded-xl shadow-sm p-6 space-y-4 min-h-96 max-h-[600px] overflow-y-auto mb-4"
        style={{ border: "1px solid #E2E9F0" }}
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
        activarModoHumano={activarModoHumanoFormData}
      />
    </div>
  );
}
