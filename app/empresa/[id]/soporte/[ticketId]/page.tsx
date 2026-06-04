import { auth } from "@/lib/auth";
import {
  obtenerTicket,
  agregarMensajeTicket,
  actualizarEstadoTicket,
  asignarTicket,
} from "@/app/actions/tickets";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import Image from "next/image";

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

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string; ticketId: string }>;
}) {
  const { id: empresaId, ticketId } = await params;

  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const ticket = await obtenerTicket(ticketId);

  if (!ticket) {
    console.error("❌ TICKET ES NULL - ticketId:", ticketId, "empresaId:", empresaId, "userId:", session.user.id);
    redirect(`/empresa/${empresaId}/soporte?error=No+tienes+permisos+para+ver+este+ticket`);
  }

  console.log("✅ TICKET OBTENIDO - ID:", ticket.id, "Título:", ticket.titulo);

  // Obtener usuarios proveedores para asignar (solo si es proveedor)
  let proveedores: any[] = [];
  if (session.user.rol === "PROVEEDOR") {
    proveedores = await prisma.usuario.findMany({
      where: {
        rol: "PROVEEDOR",
      },
      select: {
        id: true,
        nombre: true,
        email: true,
      },
    });
  }

  const esProveedor = session.user.rol === "PROVEEDOR";
  const esCerrado = ticket.estado === "CERRADO";

  return (
    <div>
      <div className="max-w-6xl mx-auto">
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

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-3xl font-bold text-gray-900">
                  {ticket.titulo}
                </h1>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    estadoColors[ticket.estado]
                  }`}
                >
                  {estadoLabels[ticket.estado]}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    prioridadColors[ticket.prioridad]
                  }`}
                >
                  {prioridadLabels[ticket.prioridad]}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>#{ticket.id.slice(0, 8)}</span>
                <span>{categoriaLabels[ticket.categoria]}</span>
                <span>
                  Creado {new Date(ticket.creadoEn).toLocaleDateString("es-ES")}
                </span>
              </div>
            </div>

            {esProveedor && !esCerrado && (
              <form action={actualizarEstadoTicket} className="flex gap-2">
                <input type="hidden" name="ticketId" value={ticket.id} />
                <select
                  name="estado"
                  defaultValue={ticket.estado}
                  onChange={(e) => e.currentTarget.form?.requestSubmit()}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="ABIERTO">Abierto</option>
                  <option value="EN_PROGRESO">En progreso</option>
                  <option value="RESUELTO">Resuelto</option>
                  <option value="CERRADO">Cerrado</option>
                </select>
              </form>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Conversación */}
          <div className="col-span-2 space-y-6">
            {/* Mensajes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Conversación
              </h2>

              <div className="space-y-6 mb-6">
                {ticket.mensajes.map((mensaje) => {
                  const esMio = mensaje.usuarioId === session.user.id;
                  const esInterno = mensaje.esInterno;

                  return (
                    <div
                      key={mensaje.id}
                      className={`flex gap-4 ${esMio ? "flex-row-reverse" : ""}`}
                    >
                      <div className="flex-shrink-0">
                        {mensaje.usuario.image ? (
                          <Image
                            src={mensaje.usuario.image}
                            alt={mensaje.usuario.nombre}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center text-white font-medium">
                            {mensaje.usuario.nombre.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className={`flex-1 ${esMio ? "text-right" : ""}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-gray-900">
                            {mensaje.usuario.nombre}
                          </span>
                          {mensaje.usuario.rol === "PROVEEDOR" && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                              Soporte
                            </span>
                          )}
                          {esInterno && (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                              Interno
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            {new Date(mensaje.creadoEn).toLocaleString("es-ES")}
                          </span>
                        </div>
                        <div
                          className={`inline-block px-4 py-3 rounded-lg ${
                            esInterno
                              ? "bg-yellow-50 border border-yellow-200"
                              : esMio
                              ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
                              : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">
                            {mensaje.mensaje}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Formulario de respuesta */}
              {!esCerrado && (
                <form action={agregarMensajeTicket} className="border-t pt-6">
                  <input type="hidden" name="ticketId" value={ticket.id} />
                  <textarea
                    name="mensaje"
                    required
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none mb-3"
                    placeholder="Escribe tu respuesta..."
                  />
                  <div className="flex items-center justify-between">
                    {esProveedor && (
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          name="esInterno"
                          value="true"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        Nota interna (solo visible para soporte)
                      </label>
                    )}
                    <button
                      type="submit"
                      className="ml-auto px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 font-medium text-sm"
                    >
                      Enviar respuesta
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Info del ticket */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Información
              </h3>
              <div className="space-y-4 text-sm">
                <div>
                  <div className="text-gray-600 mb-1">Creado por</div>
                  <div className="font-medium">{ticket.creadoPor.nombre}</div>
                  <div className="text-gray-500 text-xs">
                    {ticket.creadoPor.email}
                  </div>
                </div>

                {ticket.asignadoA ? (
                  <div>
                    <div className="text-gray-600 mb-1">Asignado a</div>
                    <div className="font-medium">{ticket.asignadoA.nombre}</div>
                    <div className="text-gray-500 text-xs">
                      {ticket.asignadoA.email}
                    </div>
                  </div>
                ) : (
                  esProveedor && (
                    <div>
                      <div className="text-gray-600 mb-1">Sin asignar</div>
                    </div>
                  )
                )}

                {esProveedor && !esCerrado && (
                  <form action={asignarTicket}>
                    <input type="hidden" name="ticketId" value={ticket.id} />
                    <label className="block text-gray-600 mb-2">
                      Asignar a
                    </label>
                    <select
                      name="asignadoAId"
                      defaultValue={ticket.asignadoAId || ""}
                      onChange={(e) => e.currentTarget.form?.requestSubmit()}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="">Sin asignar</option>
                      {proveedores.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre}
                        </option>
                      ))}
                    </select>
                  </form>
                )}

                <div>
                  <div className="text-gray-600 mb-1">Última actualización</div>
                  <div className="text-xs text-gray-500">
                    {new Date(ticket.actualizadoEn).toLocaleString("es-ES")}
                  </div>
                </div>

                {ticket.cerradoEn && (
                  <div>
                    <div className="text-gray-600 mb-1">Cerrado el</div>
                    <div className="text-xs text-gray-500">
                      {new Date(ticket.cerradoEn).toLocaleString("es-ES")}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
