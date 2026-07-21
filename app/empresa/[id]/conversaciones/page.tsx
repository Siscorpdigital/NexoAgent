import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatTimeAgo } from "@/lib/utils";
import Breadcrumbs from "@/app/components/Breadcrumbs";
import ScrollToTop from "@/app/components/ScrollToTop";
import EmptyState from "@/app/components/help/EmptyState";
import ConversacionesMobileActions from "@/app/components/ConversacionesMobileActions";
import { FilterBarWithUrl } from "@/app/components/data/FilterBar";
import ControlSwitchMini from "@/app/components/ControlSwitchMini";
import { cambiarControlConversacion } from "@/app/actions/conversaciones";

export default async function EmpresaConversacionesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ modo?: string }>;
}) {
  const { modo } = await searchParams;
  const { id } = await params;

  const empresa = await prisma.empresa.findUnique({
    where: { id },
    select: { nombre: true },
  });

  const conversaciones = await prisma.conversacion.findMany({
    where: { empresaId: id },
    orderBy: { actualizadoEn: "desc" },
    include: {
      mensajes: { orderBy: { creadoEn: "desc" }, take: 1 },
      _count: { select: { mensajes: true } },
    },
  });

  const pendientes = conversaciones.filter((c) => c.modoHumano);
  const normales = conversaciones.filter((c) => !c.modoHumano);

  // Filtrar según el modo seleccionado
  const conversacionesFiltradas = modo === "humano"
    ? pendientes
    : modo === "ia"
    ? normales
    : conversaciones;

  return (
    <div>
      {/* Breadcrumbs */}
      <Breadcrumbs empresaId={id} empresaNombre={empresa?.nombre} />

      <div className="mb-6">
        <h1 className="text-2xl font-bold font-sora" style={{ color: "#2D5750" }}>
          Conversaciones
        </h1>
        <p className="text-sm mt-1" style={{ color: "#5C7872" }}>
          {conversaciones.length} chat{conversaciones.length !== 1 ? "s" : ""} · Usa el interruptor para atender tú o dejar que responda la IA
        </p>
      </div>

      {conversaciones.length === 0 ? (
        <EmptyState
          icon="💬"
          title="No hay conversaciones aún"
          description="Cuando llegue el primer mensaje de WhatsApp aparecerá aquí"
          steps={[
            "Configura tu número de WhatsApp Business",
            "Comparte tu número con tus clientes",
            "Las conversaciones aparecerán automáticamente"
          ]}
        />
      ) : (
        <>
          {/* FilterBar */}
          <div className="mb-6">
            <FilterBarWithUrl
              filters={[
                {
                  id: "todas",
                  label: "Todas",
                  value: "",
                  count: conversaciones.length,
                  icon: "💬",
                },
                {
                  id: "humano",
                  label: "Atención humana",
                  value: "humano",
                  count: pendientes.length,
                  color: "#F2A020",
                  icon: "⚠️",
                },
                {
                  id: "ia",
                  label: "IA activa",
                  value: "ia",
                  count: normales.length,
                  color: "#2BAA8A",
                  icon: "🤖",
                },
              ]}
              baseUrl={`/empresa/${id}/conversaciones`}
              queryParam="modo"
            />
          </div>

          {/* Lista de conversaciones */}
          {conversacionesFiltradas.length === 0 ? (
            <div className="bg-white rounded-xl p-10" style={{ border: "1px solid #C8DAD6" }}>
              <EmptyState
                icon="🔍"
                title="No hay conversaciones en esta categoría"
                description="Intenta con otro filtro"
              />
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm divide-y" style={{ border: "1px solid #C8DAD6" }}>
              {conversacionesFiltradas.map((c) => <ConversacionItem key={c.id} c={c} empresaId={id} />)}
            </div>
          )}
        </>
      )}

      <ScrollToTop />
      <ConversacionesMobileActions empresaId={id} />
    </div>
  );
}

interface ConversacionItemProps {
  numeroCliente: string;
  modoHumano: boolean;
  mensajes: Array<{ contenido: string }>;
  _count: { mensajes: number };
  id: string;
  actualizadoEn: Date;
}

function ConversacionItem({ c, empresaId }: { c: ConversacionItemProps; empresaId: string }) {
  return (
    <div className="flex items-center hover:bg-gray-50 transition-colors">
      <Link
        href={`/empresa/${empresaId}/conversaciones/${c.id}`}
        className="flex-1 min-w-0 flex items-center gap-3 sm:gap-4 pl-4 sm:pl-5 pr-2 py-4"
      >
        <div
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm font-sora"
          style={{ background: "rgba(43, 170, 138,0.08)", color: "#2BAA8A" }}
        >
          {c.numeroCliente[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-medium font-roboto tracking-wide" style={{ color: "#2D5750" }}>
              {c.numeroCliente}
            </p>
          </div>
          <p className="text-xs truncate" style={{ color: "#5C7872" }}>
            {c.mensajes[0]?.contenido ?? "Sin mensajes"}
          </p>
          <div className="flex items-center gap-2 mt-1 text-xs" style={{ color: "#5C7872" }}>
            <span>{c._count.mensajes} msg</span>
            <span>·</span>
            <span>{formatTimeAgo(c.actualizadoEn)}</span>
          </div>
        </div>
      </Link>

      {/* Switch de control rápido (fuera del enlace para no navegar al tocarlo) */}
      <div className="flex-shrink-0 pr-4 sm:pr-5 pl-1">
        <ControlSwitchMini
          conversacionId={c.id}
          empresaId={empresaId}
          numeroCliente={c.numeroCliente}
          modoHumano={c.modoHumano}
          cambiarControl={cambiarControlConversacion}
        />
      </div>
    </div>
  );
}
