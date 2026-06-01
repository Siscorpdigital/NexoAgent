import { prisma } from "@/lib/prisma";
import { crearCita, cambiarEstadoCita, desconectarGoogleCalendar } from "@/app/actions/agenda";
import { EstadoCita } from "@/app/generated/prisma/client";
import { getAuthUrl } from "@/lib/google-calendar";

function formatearFecha(fecha: Date): string {
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(fecha);
}

function formatearHora(fecha: Date): string {
  return new Intl.DateTimeFormat("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(fecha);
}

function obtenerColorEstado(estado: EstadoCita): string {
  switch (estado) {
    case "CONFIRMADA":
      return "bg-green-100 text-green-800 border-green-300";
    case "CANCELADA":
      return "bg-red-100 text-red-800 border-red-300";
    default:
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
  }
}

export default async function AgendaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [empresa, citas, citasHoy, citasProximas] = await Promise.all([
    prisma.empresa.findUnique({
      where: { id },
      select: {
        nombre: true,
        calendlyUrl: true,
        googleAccessToken: true,
        googleCalendarId: true,
      }
    }),
    prisma.cita.findMany({
      where: { empresaId: id },
      include: { contacto: true },
      orderBy: { inicio: "desc" },
      take: 50,
    }),
    prisma.cita.count({
      where: {
        empresaId: id,
        inicio: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    }),
    prisma.cita.count({
      where: {
        empresaId: id,
        inicio: { gte: new Date() },
        estado: { not: "CANCELADA" },
      },
    }),
  ]);

  if (!empresa) return <div className="p-8 text-red-600">Empresa no encontrada</div>;

  const ahora = new Date();
  const citasPasadas = citas.filter((c) => c.fin < ahora);
  const citasFuturas = citas.filter((c) => c.inicio >= ahora && c.estado !== "CANCELADA");
  const citasCanceladas = citas.filter((c) => c.estado === "CANCELADA");

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header con KPIs */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">📅 Agenda</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <p className="text-sm text-gray-600">Citas/Tareas hoy</p>
          <p className="text-3xl font-bold text-blue-600">{citasHoy}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <p className="text-sm text-gray-600">Próximas citas/tareas</p>
          <p className="text-3xl font-bold text-green-600">{citasProximas}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
          <p className="text-sm text-gray-600">Total de citas/tareas</p>
          <p className="text-3xl font-bold text-purple-600">{citas.length}</p>
        </div>
      </div>

      {/* Integración Google Calendar */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          📅 Integración Google Calendar
        </h2>

        {empresa.googleAccessToken ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="font-medium text-green-900">Conectado a Google Calendar</p>
                <p className="text-sm text-green-700">
                  Las citas/tareas se sincronizarán automáticamente con tu calendario de Google
                </p>
              </div>
            </div>
            <form action={desconectarGoogleCalendar}>
              <input type="hidden" name="empresaId" value={id} />
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
              >
                Desconectar Google Calendar
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-700">
              Conecta tu cuenta de Google para sincronizar automáticamente las citas/tareas con Google Calendar.
              Esto te permitirá:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 text-sm">
              <li>Ver todas tus citas/tareas en tu calendario personal</li>
              <li>Recibir notificaciones y recordatorios de Google</li>
              <li>Compartir tu disponibilidad con otros</li>
              <li>Acceder desde cualquier dispositivo</li>
            </ul>
            <a
              href={getAuthUrl(id)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Conectar con Google
            </a>
          </div>
        )}
      </div>

      {/* Formulario para nueva cita */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">➕ Agendar nueva cita/tarea</h2>
        <form action={crearCita} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="hidden" name="empresaId" value={id} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del cliente *
            </label>
            <input
              type="text"
              name="nombreCliente"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono (WhatsApp) *
            </label>
            <input
              type="tel"
              name="telefono"
              required
              placeholder="5212345678901"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha y hora de inicio *
            </label>
            <input
              type="datetime-local"
              name="inicio"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duración (minutos) *
            </label>
            <select
              name="duracion"
              defaultValue="60"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="15">15 min</option>
              <option value="30">30 min</option>
              <option value="45">45 min</option>
              <option value="60">1 hora</option>
              <option value="90">1.5 horas</option>
              <option value="120">2 horas</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas adicionales
            </label>
            <textarea
              name="notas"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Crear cita/tarea
            </button>
          </div>
        </form>
      </div>

      {/* Lista de citas futuras */}
      {citasFuturas.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            🔜 Próximas citas/tareas ({citasFuturas.length})
          </h2>
          <div className="space-y-3">
            {citasFuturas.map((cita) => (
              <div
                key={cita.id}
                className={`p-4 border-l-4 rounded-lg ${
                  cita.estado === "CONFIRMADA"
                    ? "border-green-500 bg-green-50"
                    : "border-yellow-500 bg-yellow-50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{cita.nombreCliente}</h3>
                    <p className="text-sm text-gray-600">📞 {cita.telefono}</p>
                    <p className="text-sm text-gray-600">
                      🕒 {formatearFecha(cita.inicio)} - {formatearHora(cita.fin)}
                    </p>
                    {cita.notas && (
                      <p className="text-sm text-gray-500 mt-1 italic">{cita.notas}</p>
                    )}
                    {cita.googleCalendarLink && (
                      <a
                        href={cita.googleCalendarLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 mt-1 inline-flex items-center gap-1"
                      >
                        📅 Ver en Google Calendar
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${obtenerColorEstado(
                        cita.estado
                      )}`}
                    >
                      {cita.estado}
                    </span>
                    <form action={cambiarEstadoCita} className="inline">
                      <input type="hidden" name="id" value={cita.id} />
                      <input type="hidden" name="empresaId" value={id} />
                      {cita.estado === "PENDIENTE" && (
                        <button
                          type="submit"
                          name="estado"
                          value="CONFIRMADA"
                          className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition"
                        >
                          Confirmar
                        </button>
                      )}
                    </form>
                    <form action={cambiarEstadoCita} className="inline">
                      <input type="hidden" name="id" value={cita.id} />
                      <input type="hidden" name="empresaId" value={id} />
                      <button
                        type="submit"
                        name="estado"
                        value="CANCELADA"
                        className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition"
                      >
                        Cancelar
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historial de citas pasadas */}
      {citasPasadas.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            📜 Historial ({citasPasadas.length})
          </h2>
          <div className="space-y-2">
            {citasPasadas.slice(0, 10).map((cita) => (
              <div
                key={cita.id}
                className="p-3 bg-gray-50 rounded border border-gray-200 flex items-start justify-between"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800">{cita.nombreCliente}</h3>
                  <p className="text-sm text-gray-600">
                    {formatearFecha(cita.inicio)} • {cita.telefono}
                  </p>
                  {cita.notas && (
                    <p className="text-xs text-gray-500 mt-1">{cita.notas}</p>
                  )}
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${obtenerColorEstado(
                    cita.estado
                  )}`}
                >
                  {cita.estado}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Citas/Tareas canceladas */}
      {citasCanceladas.length > 0 && (
        <details className="bg-white p-6 rounded-lg shadow">
          <summary className="text-lg font-semibold cursor-pointer text-gray-700 hover:text-gray-900">
            ❌ Citas/Tareas canceladas ({citasCanceladas.length})
          </summary>
          <div className="mt-4 space-y-2">
            {citasCanceladas.slice(0, 10).map((cita) => (
              <div
                key={cita.id}
                className="p-3 bg-red-50 rounded border border-red-200"
              >
                <h3 className="font-medium text-gray-800">{cita.nombreCliente}</h3>
                <p className="text-sm text-gray-600">
                  {formatearFecha(cita.inicio)} • {cita.telefono}
                </p>
              </div>
            ))}
          </div>
        </details>
      )}

      {citas.length === 0 && (
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <p className="text-gray-500 text-lg">No hay citas/tareas agendadas aún</p>
          <p className="text-sm text-gray-400 mt-2">
            Crea tu primera cita/tarea usando el formulario de arriba
          </p>
        </div>
      )}
    </div>
  );
}
