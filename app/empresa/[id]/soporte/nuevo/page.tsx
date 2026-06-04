import { auth } from "@/lib/auth";
import { crearTicket } from "@/app/actions/tickets";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function NuevoTicketPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: { error?: string };
}) {
  const { id: empresaId } = await params;

  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/empresa/${empresaId}/soporte`}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Volver a tickets
          </Link>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
            Crear Nuevo Ticket
          </h1>
          <p className="text-gray-600">
            Describe tu problema o solicitud y te ayudaremos
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          {searchParams.error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{searchParams.error}</p>
            </div>
          )}

          <form action={crearTicket} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título del ticket <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="titulo"
                required
                maxLength={200}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Resumen breve del problema"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción detallada <span className="text-red-500">*</span>
              </label>
              <textarea
                name="descripcion"
                required
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Describe el problema en detalle. Incluye pasos para reproducirlo si aplica."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría
                </label>
                <select
                  name="categoria"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="GENERAL">General</option>
                  <option value="TECNICO">Técnico</option>
                  <option value="FACTURACION">Facturación</option>
                  <option value="FUNCIONALIDAD">Funcionalidad</option>
                  <option value="BUG">Reportar Bug</option>
                  <option value="MEJORA">Sugerencia de mejora</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prioridad
                </label>
                <select
                  name="prioridad"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="BAJA">Baja</option>
                  <option value="MEDIA" selected>
                    Media
                  </option>
                  <option value="ALTA">Alta</option>
                  <option value="URGENTE">Urgente</option>
                </select>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <svg
                  className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Consejos para crear un buen ticket:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-700">
                    <li>Usa un título claro y descriptivo</li>
                    <li>Incluye todos los detalles relevantes</li>
                    <li>Si es un error, describe los pasos para reproducirlo</li>
                    <li>Indica la prioridad correcta según tu necesidad</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 font-medium shadow-lg shadow-blue-500/30"
              >
                Crear Ticket
              </button>
              <Link
                href={`/empresa/${empresaId}/soporte`}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
