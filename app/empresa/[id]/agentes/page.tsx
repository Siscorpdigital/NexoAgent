import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { checkPlanLimit } from "@/lib/plan-limits";
import { actualizarPrompt } from "@/app/actions/empresas";

export default async function AgentesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const { id: empresaId } = await params;
  const { success, error } = await searchParams;

  const session = await auth();
  if (!session) redirect("/login");

  if (session.user.rol === "CLIENTE" && session.user.empresaId !== empresaId) {
    redirect(`/empresa/${session.user.empresaId}/agentes`);
  }

  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
    include: {
      plan: true,
      agentes: {
        orderBy: [
          { esPrincipal: "desc" },
          { creadoEn: "asc" },
        ],
      },
    },
  });

  if (!empresa) redirect("/dashboard");

  const limitCheck = await checkPlanLimit(empresaId, "agentes");

  // Contar conversaciones por agente
  const conversacionesPorAgente = await prisma.conversacion.groupBy({
    by: ["agenteId"],
    where: {
      empresaId,
      agenteId: { not: null },
    },
    _count: true,
  });

  const conversacionesMap = new Map(
    conversacionesPorAgente.map((item) => [item.agenteId, item._count])
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Agentes Virtuales</h1>
        <p className="text-gray-600 mt-2">
          Gestiona los agentes especializados de tu empresa
        </p>
      </div>

      {success && (
        <div className="mb-6 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
          ✓ {decodeURIComponent(success)}
        </div>
      )}

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          ⚠️ {decodeURIComponent(error)}
        </div>
      )}

      {/* Instrucciones del asistente (movido desde Configuración) */}
      <div className="mb-6 bg-white rounded-xl p-6" style={{ border: "1px solid #C8DAD6" }}>
        <h2 className="font-semibold font-sora mb-1" style={{ color: "#2D5750" }}>
          Instrucciones del asistente
        </h2>
        <p className="text-xs mb-4" style={{ color: "#5C7872" }}>
          Define el tono, la personalidad y las reglas de comportamiento de la IA para todas las conversaciones.
        </p>
        <form action={actualizarPrompt} className="space-y-4">
          <input type="hidden" name="id" value={empresa.id} />
          <input type="hidden" name="origen" value="agentes" />
          <textarea
            name="prompt"
            rows={6}
            defaultValue={empresa.promptSistema ?? ""}
            placeholder={`Ej: Eres el asistente de ${empresa.nombre}. Eres amable y profesional. Atendemos de lunes a viernes de 9am a 6pm. Si el cliente quiere cotizar, pídele su nombre y teléfono.`}
            className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 resize-none"
            style={{ border: "1px solid #C8DAD6", color: "#2D5750" }}
          />
          <button
            type="submit"
            className="text-white text-sm font-medium py-2.5 px-5 rounded-lg transition-opacity hover:opacity-90 grad-bg"
          >
            Guardar instrucciones
          </button>
        </form>
      </div>

      {/* Plan info */}
      <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-semibold text-gray-900">{empresa.plan?.nombre || "Sin plan"}</h3>
            <p className="text-sm text-gray-600 mt-1">{limitCheck.message}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">
              {limitCheck.current} / {limitCheck.max === -1 ? "∞" : limitCheck.max}
            </p>
            <p className="text-xs text-gray-500">agentes activos</p>
          </div>
        </div>
      </div>

      {/* Add button */}
      {limitCheck.allowed && (
        <div className="mb-6">
          <Link
            href={`/empresa/${empresaId}/agentes/nuevo`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition font-medium shadow-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Crear nuevo agente
          </Link>
        </div>
      )}

      {!limitCheck.allowed && (
        <div className="mb-6 p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
          <p className="text-yellow-800">
            ⚠️ Has alcanzado el límite de tu plan. Contacta al administrador para actualizar.
          </p>
        </div>
      )}

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {empresa.agentes.length === 0 ? (
          <div className="col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
            <p className="text-gray-500">No hay agentes creados</p>
          </div>
        ) : (
          empresa.agentes.map((agente) => {
            const conversaciones = conversacionesMap.get(agente.id) || 0;
            return (
              <div
                key={agente.id}
                className={`bg-white rounded-xl border shadow-sm p-5 hover:shadow-md transition ${
                  agente.esPrincipal
                    ? "border-purple-300 bg-gradient-to-br from-purple-50/50 to-transparent"
                    : "border-gray-200"
                }`}
                style={{
                  borderLeftWidth: "4px",
                  borderLeftColor: agente.color || "#9333EA",
                }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900">{agente.nombre}</h3>
                      {agente.esPrincipal && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                          Principal
                        </span>
                      )}
                      {!agente.activo && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                          Inactivo
                        </span>
                      )}
                    </div>
                    {agente.descripcion && (
                      <p className="text-sm text-gray-600 mb-2">{agente.descripcion}</p>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 mb-3 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span>{conversaciones} conversaciones</span>
                  </div>
                  {agente.palabrasClave && agente.palabrasClave.length > 0 && (
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <span>{agente.palabrasClave.length} keywords</span>
                    </div>
                  )}
                </div>

                {/* Keywords */}
                {agente.palabrasClave && agente.palabrasClave.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {agente.palabrasClave.slice(0, 5).map((kw, i) => (
                      <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                        {kw}
                      </span>
                    ))}
                    {agente.palabrasClave.length > 5 && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded">
                        +{agente.palabrasClave.length - 5}
                      </span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <Link
                    href={`/empresa/${empresaId}/agentes/${agente.id}`}
                    className="flex-1 px-3 py-1.5 text-center text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition font-medium"
                  >
                    Editar
                  </Link>
                  <Link
                    href={`/empresa/${empresaId}/agentes/${agente.id}/test`}
                    className="flex-1 px-3 py-1.5 text-center text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition font-medium"
                  >
                    Probar
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
