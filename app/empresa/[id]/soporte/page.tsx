import { auth } from "@/lib/auth";
import { obtenerMisTickets } from "@/app/actions/tickets";
import Link from "next/link";
import { redirect } from "next/navigation";

const estadoColors = {
  ABIERTO: "bg-blue-100 text-blue-800",
  EN_PROGRESO: "bg-yellow-100 text-yellow-800",
  RESUELTO: "bg-green-100 text-green-800",
  CERRADO: "bg-gray-100 text-gray-800",
};

const prioridadColors = {
  BAJA: "bg-gray-100 text-gray-700",
  MEDIA: "bg-blue-100 text-blue-700",
  ALTA: "bg-orange-100 text-orange-700",
  URGENTE: "bg-red-100 text-red-700",
};

const estadoLabels = {
  ABIERTO: "Abierto",
  EN_PROGRESO: "En progreso",
  RESUELTO: "Resuelto",
  CERRADO: "Cerrado",
};

const prioridadLabels = {
  BAJA: "Baja",
  MEDIA: "Media",
  ALTA: "Alta",
  URGENTE: "Urgente",
};

const categoriaLabels = {
  GENERAL: "General",
  TECNICO: "Técnico",
  FACTURACION: "Facturación",
  FUNCIONALIDAD: "Funcionalidad",
  BUG: "Bug",
  MEJORA: "Mejora",
};

export default async function SoportePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: empresaId } = await params;

  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const tickets = await obtenerMisTickets();

  return (
    <div>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
              Soporte Técnico
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Gestiona tus solicitudes de soporte
            </p>
          </div>
          <Link
            href={`/empresa/${empresaId}/soporte/nuevo`}
            className="w-full sm:w-auto text-center px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 font-medium shadow-lg shadow-blue-500/30 text-sm sm:text-base"
          >
            + Nuevo Ticket
          </Link>
        </div>

        {/* Filtros rápidos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="text-3xl font-bold text-blue-600">
              {tickets.filter((t) => t.estado === "ABIERTO").length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Abiertos</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="text-3xl font-bold text-yellow-600">
              {tickets.filter((t) => t.estado === "EN_PROGRESO").length}
            </div>
            <div className="text-sm text-gray-600 mt-1">En progreso</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="text-3xl font-bold text-green-600">
              {tickets.filter((t) => t.estado === "RESUELTO").length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Resueltos</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="text-3xl font-bold text-gray-600">
              {tickets.filter((t) => t.estado === "CERRADO").length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Cerrados</div>
          </div>
        </div>

        {/* Lista de tickets */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {tickets.length === 0 ? (
            <div className="p-12 text-center">
              <svg
                className="w-16 h-16 text-gray-300 mx-auto mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay tickets
              </h3>
              <p className="text-gray-600 mb-6">
                Crea tu primer ticket para obtener soporte
              </p>
              <Link
                href={`/empresa/${empresaId}/soporte/nuevo`}
                className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 font-medium"
              >
                Crear Ticket
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {tickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/empresa/${empresaId}/soporte/${ticket.id}`}
                  className="block p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {ticket.titulo}
                        </h3>
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            estadoColors[ticket.estado]
                          }`}
                        >
                          {estadoLabels[ticket.estado]}
                        </span>
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            prioridadColors[ticket.prioridad]
                          }`}
                        >
                          {prioridadLabels[ticket.prioridad]}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                        {ticket.descripcion}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>#{ticket.id.slice(0, 8)}</span>
                        <span>{categoriaLabels[ticket.categoria]}</span>
                        <span>
                          Creado por {ticket.creadoPor.nombre}
                        </span>
                        {ticket.asignadoA && (
                          <span>
                            Asignado a {ticket.asignadoA.nombre}
                          </span>
                        )}
                        <span>{ticket._count.mensajes} mensajes</span>
                        <span>
                          {new Date(ticket.actualizadoEn).toLocaleDateString(
                            "es-ES",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </span>
                      </div>
                    </div>
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
