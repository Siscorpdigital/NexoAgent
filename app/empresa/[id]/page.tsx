import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatTimeAgo } from "@/lib/utils";

const SLATE_DK = "#2D5750";
const MUTED = "#5C7872";
const TEAL = "#2BAA8A";
const ORANGE = "#F2A020"; // relleno/decorativo (switch, tintes)
const ORANGE_TXT = "#B4610A"; // naranja para TEXTO: cumple contraste AA sobre blanco
const LINE = "#C8DAD6";

export default async function EmpresaHomePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const empresa = await prisma.empresa.findUnique({ where: { id } });
  if (!empresa) notFound();

  const [conversaciones, mensajes, pendientes, whatsappCount, documentosCount] = await Promise.all([
    prisma.conversacion.count({ where: { empresaId: id } }),
    prisma.mensaje.count({ where: { conversacion: { empresaId: id } } }),
    prisma.conversacion.count({ where: { empresaId: id, modoHumano: true } }),
    prisma.numeroWhatsApp.count({ where: { empresaId: id } }),
    prisma.documento.count({ where: { empresaId: id } }),
  ]);

  const ultimasConversaciones = await prisma.conversacion.findMany({
    where: { empresaId: id },
    orderBy: { actualizadoEn: "desc" },
    take: 5,
    include: {
      mensajes: { orderBy: { creadoEn: "desc" }, take: 1 },
      _count: { select: { mensajes: true } },
    },
  });

  const promptDefinido = !!(empresa.promptSistema && empresa.promptSistema.trim());

  // Checklist de puesta en marcha
  const pasos = [
    {
      ok: whatsappCount > 0,
      titulo: "Conecta tu WhatsApp",
      desc: "Vincula el número por el que atenderá el asistente.",
      href: `/empresa/${id}/whatsapp`,
      cta: "Conectar",
      emoji: "📱",
    },
    {
      ok: promptDefinido,
      titulo: "Define las instrucciones del asistente",
      desc: "Indícale cómo hablar, qué ofrecer y cómo tratar a tus clientes.",
      href: `/empresa/${id}/agentes`,
      cta: "Configurar",
      emoji: "🤖",
    },
    {
      ok: documentosCount > 0,
      titulo: "Carga tu conocimiento",
      desc: "Sube tus planes, precios y respuestas frecuentes.",
      href: `/empresa/${id}/conocimiento`,
      cta: "Cargar",
      emoji: "📚",
    },
    {
      ok: conversaciones > 0,
      titulo: "Recibe tu primer mensaje",
      desc: "Escribe al número desde otro teléfono y prueba al asistente.",
      href: `/empresa/${id}/conversaciones`,
      cta: "Ver chats",
      emoji: "💬",
    },
  ];
  const completados = pasos.filter((p) => p.ok).length;
  const setupCompleto = completados === pasos.length;
  const progreso = Math.round((completados / pasos.length) * 100);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-sora" style={{ color: SLATE_DK }}>
          {empresa.nombre}
        </h1>
        <p className="text-sm mt-1" style={{ color: MUTED }}>
          Resumen de actividad de tu asistente virtual
        </p>
      </div>

      {/* Checklist de puesta en marcha (se oculta al completarse) */}
      {!setupCompleto && (
        <div className="mb-6 bg-white rounded-2xl p-5 sm:p-6" style={{ border: `1px solid ${LINE}` }}>
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold font-sora" style={{ color: SLATE_DK }}>
              Puesta en marcha
            </h2>
            <span className="text-xs font-semibold" style={{ color: TEAL }}>
              {completados} de {pasos.length}
            </span>
          </div>
          <p className="text-xs mb-4" style={{ color: MUTED }}>
            Completa estos pasos para dejar tu asistente atendiendo por WhatsApp.
          </p>

          {/* Barra de progreso */}
          <div className="h-2 w-full rounded-full mb-5" style={{ background: `${TEAL}1A` }}>
            <div
              className="h-2 rounded-full transition-all"
              style={{ width: `${progreso}%`, background: `linear-gradient(90deg, ${SLATE_DK}, ${TEAL})` }}
            />
          </div>

          <ul className="space-y-2.5">
            {pasos.map((p, i) => (
              <li
                key={i}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                style={{ background: p.ok ? `${TEAL}0D` : "#FBFDFC", border: `1px solid ${p.ok ? `${TEAL}33` : LINE}` }}
              >
                {/* Indicador */}
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                  style={
                    p.ok
                      ? { background: TEAL, color: "#fff" }
                      : { background: "#fff", color: MUTED, border: `1.5px solid ${LINE}` }
                  }
                >
                  {p.ok ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </span>

                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium font-sora leading-tight"
                    style={{ color: p.ok ? MUTED : SLATE_DK, textDecoration: p.ok ? "line-through" : "none" }}
                  >
                    {p.emoji} {p.titulo}
                  </p>
                  {!p.ok && (
                    <p className="text-xs leading-tight mt-0.5" style={{ color: MUTED }}>
                      {p.desc}
                    </p>
                  )}
                </div>

                {!p.ok && (
                  <Link
                    href={p.href}
                    className="text-xs font-semibold text-white px-3 py-1.5 rounded-lg transition-opacity hover:opacity-90 flex-shrink-0 grad-bg"
                  >
                    {p.cta} →
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Alerta de pendientes */}
      {pendientes > 0 && (
        <div
          className="mb-6 rounded-xl px-5 py-4 flex items-center justify-between gap-3"
          style={{ background: `${ORANGE}12`, border: `1px solid ${ORANGE}40` }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${ORANGE}1F` }}>
              <svg className="w-4 h-4" style={{ color: ORANGE }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: SLATE_DK }}>
                {pendientes} conversación{pendientes > 1 ? "es" : ""} espera{pendientes > 1 ? "n" : ""} atención humana
              </p>
              <p className="text-xs" style={{ color: MUTED }}>Retoma con la IA cuando estén atendidas.</p>
            </div>
          </div>
          <Link
            href={`/empresa/${id}/conversaciones?modo=humano`}
            className="text-xs text-white px-3 py-1.5 rounded-lg font-medium transition-opacity hover:opacity-90 flex-shrink-0"
            style={{ background: ORANGE_TXT }}
          >
            Ver ahora
          </Link>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        <StatCard
          label="Conversaciones"
          sub="totales"
          value={conversaciones}
          emoji="💬"
          href={conversaciones > 0 ? `/empresa/${id}/conversaciones` : undefined}
        />
        <StatCard label="Mensajes" sub="atendidos por la IA" value={mensajes} emoji="🤖" />
        <div
          className="rounded-xl p-5 shadow-sm transition-shadow hover:shadow-md"
          style={{
            background: pendientes > 0 ? `${ORANGE}0D` : "#fff",
            border: `1px solid ${pendientes > 0 ? `${ORANGE}40` : LINE}`,
          }}
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-sm" style={{ color: pendientes > 0 ? ORANGE_TXT : MUTED }}>Pendientes</p>
              <p className="text-3xl font-bold mt-1 font-sora" style={{ color: pendientes > 0 ? ORANGE_TXT : SLATE_DK }}>
                {pendientes}
              </p>
              <p className="text-xs mt-1" style={{ color: MUTED }}>requieren humano</p>
            </div>
            <span className="text-2xl">{pendientes > 0 ? "⚠️" : "✅"}</span>
          </div>
          {pendientes > 0 && (
            <Link
              href={`/empresa/${id}/conversaciones?modo=humano`}
              className="text-xs font-medium mt-2 inline-block"
              style={{ color: ORANGE_TXT }}
            >
              Atender ahora →
            </Link>
          )}
        </div>
      </div>

      {/* Conversaciones recientes */}
      <div className="bg-white rounded-xl shadow-sm" style={{ border: `1px solid ${LINE}` }}>
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${LINE}` }}>
          <h2 className="font-semibold font-sora text-sm" style={{ color: SLATE_DK }}>
            Conversaciones recientes
          </h2>
          <Link href={`/empresa/${id}/conversaciones`} className="text-xs font-medium" style={{ color: TEAL }}>
            Ver todas →
          </Link>
        </div>
        {ultimasConversaciones.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm" style={{ color: MUTED }}>
            Aún no hay conversaciones. Cuando llegue el primer WhatsApp aparecerá aquí.
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "#EEF3F1" }}>
            {ultimasConversaciones.map((c) => (
              <Link
                key={c.id}
                href={`/empresa/${id}/conversaciones/${c.id}`}
                className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm font-sora"
                  style={{ background: `${TEAL}14`, color: TEAL }}
                >
                  {c.numeroCliente[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium font-roboto tracking-wide" style={{ color: SLATE_DK }}>{c.numeroCliente}</p>
                    {c.modoHumano && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                        style={{ background: `${ORANGE}1F`, color: ORANGE_TXT }}
                      >
                        Humano
                      </span>
                    )}
                  </div>
                  <p className="text-xs truncate mt-0.5" style={{ color: MUTED }}>
                    {c.mensajes[0]?.contenido ?? "Sin mensajes"}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs" style={{ color: MUTED }}>{formatTimeAgo(c.actualizadoEn)}</span>
                  <svg className="w-4 h-4" style={{ color: LINE }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  sub,
  value,
  emoji,
  href,
}: {
  label: string;
  sub: string;
  value: number;
  emoji: string;
  href?: string;
}) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm transition-shadow hover:shadow-md" style={{ border: `1px solid ${LINE}` }}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-sm" style={{ color: MUTED }}>{label}</p>
          <p className="text-3xl font-bold mt-1 font-sora" style={{ color: SLATE_DK }}>{value}</p>
          <p className="text-xs mt-1" style={{ color: MUTED }}>{sub}</p>
        </div>
        <span className="text-2xl">{emoji}</span>
      </div>
      {href && (
        <Link href={href} className="text-xs font-medium mt-2 inline-block" style={{ color: TEAL }}>
          Ver todas →
        </Link>
      )}
    </div>
  );
}
