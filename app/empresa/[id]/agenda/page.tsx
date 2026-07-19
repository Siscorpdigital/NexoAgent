import { prisma } from "@/lib/prisma";
import { cambiarEstadoCita, desconectarGoogleCalendar } from "@/app/actions/agenda";
import { EstadoCita } from "@/app/generated/prisma/client";
import { getAuthUrl } from "@/lib/google-calendar";
import EmptyState from "@/app/components/help/EmptyState";
import LoadingButton from "@/app/components/ui/LoadingButton";
import ScrollToTop from "@/app/components/ScrollToTop";
import CitaForm from "@/app/components/forms/CitaForm";

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

function obtenerColorEstado(estado: EstadoCita): { bg: string; color: string } {
  switch (estado) {
    case "CONFIRMADA":
      return { bg: "rgba(43, 170, 138,0.08)", color: "#2BAA8A" };
    case "CANCELADA":
      return { bg: "rgba(239,68,68,0.08)", color: "#EF4444" };
    default:
      return { bg: "rgba(242, 160, 32,0.08)", color: "#F2A020" };
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
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-sora" style={{ color: "#2D5750" }}>
          📅 Agenda
        </h1>
        <p className="text-sm mt-1" style={{ color: "#5C7872" }}>
          {citas.length} citas/tareas · Gestiona tu calendario
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #C8DAD6" }}>
          <p className="text-3xl font-bold font-sora" style={{ color: "#2D5750" }}>{citasHoy}</p>
          <p className="text-sm font-medium mt-1" style={{ color: "#2D5750" }}>Citas/Tareas hoy</p>
          <p className="text-xs mt-0.5" style={{ color: "#5C7872" }}>pendientes de atender</p>
        </div>
        <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #C8DAD6" }}>
          <p className="text-3xl font-bold font-sora" style={{ color: "#2BAA8A" }}>{citasProximas}</p>
          <p className="text-sm font-medium mt-1" style={{ color: "#2D5750" }}>Próximas citas/tareas</p>
          <p className="text-xs mt-0.5" style={{ color: "#5C7872" }}>confirmadas</p>
        </div>
        <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #C8DAD6" }}>
          <p className="text-3xl font-bold font-sora" style={{ color: "#2BAA8A" }}>{citas.length}</p>
          <p className="text-sm font-medium mt-1" style={{ color: "#2D5750" }}>Total de citas/tareas</p>
          <p className="text-xs mt-0.5" style={{ color: "#5C7872" }}>histórico completo</p>
        </div>
      </div>

      {/* Integración Google Calendar */}
      <div className="bg-white rounded-xl p-6 mb-6" style={{ border: "1px solid #C8DAD6" }}>
        <h2 className="text-lg font-semibold font-sora mb-4 flex items-center gap-2" style={{ color: "#2D5750" }}>
          📅 Integración Google Calendar
        </h2>

        {empresa.googleAccessToken ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-lg" style={{ background: "rgba(43, 170, 138,0.08)", border: "1px solid rgba(43, 170, 138,0.2)" }}>
              <svg className="w-6 h-6 flex-shrink-0" style={{ color: "#2BAA8A" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="font-medium text-sm" style={{ color: "#2BAA8A" }}>Conectado a Google Calendar</p>
                <p className="text-xs mt-0.5" style={{ color: "#5C7872" }}>
                  Las citas/tareas se sincronizarán automáticamente
                </p>
              </div>
            </div>
            <form action={desconectarGoogleCalendar}>
              <input type="hidden" name="empresaId" value={id} />
              <LoadingButton
                type="submit"
                className="px-4 py-2 text-white rounded-lg transition text-sm font-medium"
                style={{ background: "#EF4444" }}
              >
                Desconectar Google Calendar
              </LoadingButton>
            </form>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: "#3D6E65" }}>
              Conecta tu cuenta de Google para sincronizar automáticamente las citas/tareas con Google Calendar.
            </p>
            <ul className="space-y-2 text-sm" style={{ color: "#5C7872" }}>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#2D5750" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Ver todas tus citas en tu calendario personal
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#2D5750" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Recibir notificaciones y recordatorios de Google
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#2D5750" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Acceder desde cualquier dispositivo
              </li>
            </ul>
            <a
              href={getAuthUrl(id)}
              className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-lg transition font-medium text-sm grad-bg hover:opacity-90"
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
      <CitaForm empresaId={id} />

      {/* Lista de citas futuras */}
      {citasFuturas.length > 0 && (
        <div className="bg-white rounded-xl p-6 mb-6" style={{ border: "1px solid #C8DAD6" }}>
          <h2 className="text-lg font-semibold font-sora mb-4 flex items-center gap-2" style={{ color: "#2D5750" }}>
            🔜 Próximas citas/tareas
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(43,130,240,0.08)", color: "#2D5750" }}>
              {citasFuturas.length}
            </span>
          </h2>
          <div className="space-y-3">
            {citasFuturas.map((cita) => {
              const estadoColor = obtenerColorEstado(cita.estado);
              return (
                <div
                  key={cita.id}
                  className="p-4 rounded-lg"
                  style={{
                    border: `1px solid ${cita.estado === "CONFIRMADA" ? "#2BAA8A" : "#F2A020"}`,
                    background: estadoColor.bg,
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm font-sora" style={{ color: "#2D5750" }}>
                        {cita.nombreCliente}
                      </h3>
                      <p className="text-xs mt-1" style={{ color: "#5C7872" }}>
                        📞 {cita.telefono}
                      </p>
                      <p className="text-xs mt-1" style={{ color: "#3D6E65" }}>
                        🕒 {formatearFecha(cita.inicio)} - {formatearHora(cita.fin)}
                      </p>
                      {cita.notas && (
                        <p className="text-xs mt-2 italic" style={{ color: "#5C7872" }}>
                          {cita.notas}
                        </p>
                      )}
                      {cita.googleCalendarLink && (
                        <a
                          href={cita.googleCalendarLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs mt-2 inline-flex items-center gap-1 hover:underline"
                          style={{ color: "#2D5750" }}
                        >
                          📅 Ver en Google Calendar
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <span
                        className="px-3 py-1 rounded-lg text-xs font-medium"
                        style={{ background: estadoColor.bg, color: estadoColor.color, border: `1px solid ${estadoColor.color}` }}
                      >
                        {cita.estado}
                      </span>
                      {cita.estado === "PENDIENTE" && (
                        <form action={cambiarEstadoCita}>
                          <input type="hidden" name="id" value={cita.id} />
                          <input type="hidden" name="empresaId" value={id} />
                          <LoadingButton
                            type="submit"
                            name="estado"
                            value="CONFIRMADA"
                            className="px-3 py-1 text-white text-xs rounded-lg transition font-medium"
                            style={{ background: "#2BAA8A" }}
                          >
                            Confirmar
                          </LoadingButton>
                        </form>
                      )}
                      <form action={cambiarEstadoCita}>
                        <input type="hidden" name="id" value={cita.id} />
                        <input type="hidden" name="empresaId" value={id} />
                        <LoadingButton
                          type="submit"
                          name="estado"
                          value="CANCELADA"
                          className="px-3 py-1 text-white text-xs rounded-lg transition font-medium"
                          style={{ background: "#EF4444" }}
                        >
                          Cancelar
                        </LoadingButton>
                      </form>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Historial de citas pasadas */}
      {citasPasadas.length > 0 && (
        <div className="bg-white rounded-xl p-6 mb-6" style={{ border: "1px solid #C8DAD6" }}>
          <h2 className="text-lg font-semibold font-sora mb-4 flex items-center gap-2" style={{ color: "#2D5750" }}>
            📜 Historial
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#F4F7F6", color: "#5C7872" }}>
              {citasPasadas.length}
            </span>
          </h2>
          <div className="space-y-2">
            {citasPasadas.slice(0, 10).map((cita) => {
              const estadoColor = obtenerColorEstado(cita.estado);
              return (
                <div
                  key={cita.id}
                  className="p-3 rounded-lg flex items-start justify-between"
                  style={{ background: "#F4F7F6", border: "1px solid #C8DAD6" }}
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm" style={{ color: "#2D5750" }}>
                      {cita.nombreCliente}
                    </h3>
                    <p className="text-xs mt-0.5" style={{ color: "#5C7872" }}>
                      {formatearFecha(cita.inicio)} • {cita.telefono}
                    </p>
                    {cita.notas && (
                      <p className="text-xs mt-1" style={{ color: "#5C7872" }}>
                        {cita.notas}
                      </p>
                    )}
                  </div>
                  <span
                    className="px-2 py-1 rounded text-xs font-medium flex-shrink-0"
                    style={{ background: estadoColor.bg, color: estadoColor.color }}
                  >
                    {cita.estado}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Citas/Tareas canceladas */}
      {citasCanceladas.length > 0 && (
        <details className="bg-white rounded-xl p-6 mb-6" style={{ border: "1px solid #C8DAD6" }}>
          <summary className="text-sm font-semibold cursor-pointer font-sora hover:opacity-80" style={{ color: "#EF4444" }}>
            ❌ Citas/Tareas canceladas ({citasCanceladas.length})
          </summary>
          <div className="mt-4 space-y-2">
            {citasCanceladas.slice(0, 10).map((cita) => (
              <div
                key={cita.id}
                className="p-3 rounded-lg"
                style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)" }}
              >
                <h3 className="font-medium text-sm" style={{ color: "#2D5750" }}>
                  {cita.nombreCliente}
                </h3>
                <p className="text-xs mt-0.5" style={{ color: "#5C7872" }}>
                  {formatearFecha(cita.inicio)} • {cita.telefono}
                </p>
              </div>
            ))}
          </div>
        </details>
      )}

      {citas.length === 0 && (
        <div className="bg-white rounded-xl p-12" style={{ border: "1px solid #C8DAD6" }}>
          <EmptyState
            icon="📅"
            title="Sin citas agendadas"
            description="Las citas se crean cuando los clientes las solicitan por WhatsApp o puedes crearlas manualmente."
            steps={[
              "Cliente solicita una cita por WhatsApp",
              "La IA la agenda automáticamente",
              "Se sincroniza con Google Calendar",
            ]}
          />
        </div>
      )}

      <ScrollToTop />
    </div>
  );
}
