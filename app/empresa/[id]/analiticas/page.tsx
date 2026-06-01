import { prisma } from "@/lib/prisma";

function hace(dias: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatHoras(minutos: number): string {
  if (minutos < 60) return `${minutos} min`;
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export default async function AnaliticasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const hace7 = hace(7);
  const hace30 = hace(30);

  const [
    totalConversaciones,
    totalMensajesIA,
    totalMensajesHumano,
    totalContactos,
    contactosNuevos30,
    autoEjecuciones,
    convUltimos30,
    mensajesUltimos7,
  ] = await Promise.all([
    prisma.conversacion.count({ where: { empresaId: id } }),
    prisma.mensaje.count({ where: { conversacion: { empresaId: id }, rol: "ASISTENTE" } }),
    prisma.mensaje.count({ where: { conversacion: { empresaId: id }, rol: "CLIENTE" } }),
    prisma.contacto.count({ where: { empresaId: id } }),
    prisma.contacto.count({ where: { empresaId: id, creadoEn: { gte: hace30 } } }),
    prisma.automatizacion.aggregate({ where: { empresaId: id }, _sum: { ejecuciones: true } }),
    prisma.conversacion.count({ where: { empresaId: id, creadoEn: { gte: hace30 } } }),
    prisma.mensaje.findMany({
      where: { conversacion: { empresaId: id }, creadoEn: { gte: hace7 }, rol: "ASISTENTE" },
      select: { creadoEn: true },
    }),
  ]);

  // Tiempo ahorrado: 3 min por cada mensaje que atendió la IA
  const minAhorrados = totalMensajesIA * 3;

  // Tasa IA
  const totalMensajes = totalMensajesIA + totalMensajesHumano;
  const tasaIA = totalMensajes > 0 ? Math.round((totalMensajesIA / totalMensajes) * 100) : 0;

  // Actividad últimos 7 días
  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  const actividadPorDia = dias.map((dia) => {
    const inicio = new Date(dia);
    inicio.setHours(0, 0, 0, 0);
    const fin = new Date(dia);
    fin.setHours(23, 59, 59, 999);
    const count = mensajesUltimos7.filter(
      (m) => m.creadoEn >= inicio && m.creadoEn <= fin
    ).length;
    return { dia, count };
  });

  const maxDia = Math.max(...actividadPorDia.map((d) => d.count), 1);

  const DIAS_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  const kpis = [
    { label: "Conversaciones", valor: totalConversaciones, sub: "totales", color: "#2B82F0" },
    { label: "Mensajes atendidos por IA", valor: totalMensajesIA, sub: "respuestas automáticas", color: "#15B8C9" },
    { label: "Contactos", valor: totalContactos, sub: `+${contactosNuevos30} este mes`, color: "#22B26B" },
    { label: "Tiempo ahorrado", valor: formatHoras(minAhorrados), sub: "estimado (3 min/msg)", color: "#2B82F0" },
    { label: "Automatizaciones", valor: autoEjecuciones._sum.ejecuciones ?? 0, sub: "ejecuciones totales", color: "#15B8C9" },
    { label: "Tasa de atención IA", valor: `${tasaIA}%`, sub: "del total de mensajes", color: "#22B26B" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-sora" style={{ color: "#0E2436" }}>Analíticas</h1>
        <p className="text-sm mt-1" style={{ color: "#73869A" }}>
          Actividad del asistente virtual · últimos 30 días
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white rounded-xl p-5" style={{ border: "1px solid #E2E9F0" }}>
            <p className="text-3xl font-bold font-sora" style={{ color: k.color }}>{k.valor}</p>
            <p className="text-sm font-medium mt-1" style={{ color: "#0E2436" }}>{k.label}</p>
            <p className="text-xs mt-0.5" style={{ color: "#73869A" }}>{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Actividad últimos 7 días */}
        <div className="bg-white rounded-xl p-6" style={{ border: "1px solid #E2E9F0" }}>
          <h2 className="font-semibold font-sora text-sm mb-5" style={{ color: "#0E2436" }}>
            Mensajes IA · últimos 7 días
          </h2>
          <div className="flex items-end gap-2 h-32">
            {actividadPorDia.map(({ dia, count }) => {
              const altura = maxDia > 0 ? Math.max((count / maxDia) * 100, count > 0 ? 8 : 0) : 0;
              return (
                <div key={dia.toISOString()} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-xs font-medium" style={{ color: "#2B82F0" }}>
                    {count > 0 ? count : ""}
                  </span>
                  <div className="w-full rounded-t-md transition-all" style={{
                    height: `${altura}%`,
                    minHeight: count > 0 ? "8px" : "2px",
                    background: count > 0
                      ? "linear-gradient(180deg, #2B82F0, #15B8C9)"
                      : "#F4F7FA",
                  }} />
                  <span className="text-xs" style={{ color: "#73869A" }}>
                    {DIAS_ES[dia.getDay()]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Distribución */}
        <div className="bg-white rounded-xl p-6" style={{ border: "1px solid #E2E9F0" }}>
          <h2 className="font-semibold font-sora text-sm mb-5" style={{ color: "#0E2436" }}>
            Distribución de mensajes
          </h2>
          <div className="space-y-4">
            {[
              { label: "Atendidos por IA", count: totalMensajesIA, color: "#2B82F0", bg: "rgba(43,130,240,0.08)" },
              { label: "Mensajes de clientes", count: totalMensajesHumano, color: "#15B8C9", bg: "rgba(21,184,201,0.08)" },
              { label: "Automatizaciones", count: autoEjecuciones._sum.ejecuciones ?? 0, color: "#22B26B", bg: "rgba(34,178,107,0.08)" },
            ].map((item) => {
              const pct = totalMensajes > 0 ? Math.round((item.count / Math.max(totalMensajes, 1)) * 100) : 0;
              return (
                <div key={item.label}>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-xs font-medium" style={{ color: "#41566B" }}>{item.label}</span>
                    <span className="text-xs font-semibold" style={{ color: item.color }}>{item.count}</span>
                  </div>
                  <div className="w-full rounded-full h-2" style={{ background: "#F4F7FA" }}>
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{ width: `${pct}%`, background: item.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-5" style={{ borderTop: "1px solid #F4F7FA" }}>
            <p className="text-xs font-medium mb-1" style={{ color: "#41566B" }}>Conversaciones este mes</p>
            <p className="text-2xl font-bold font-sora" style={{ color: "#0E2436" }}>{convUltimos30}</p>
            <p className="text-xs mt-0.5" style={{ color: "#73869A" }}>de {totalConversaciones} totales</p>
          </div>
        </div>
      </div>
    </div>
  );
}
