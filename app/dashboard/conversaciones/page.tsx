import { prisma } from "@/lib/prisma";
import Link from "next/link";
import EmptyState from "@/app/components/help/EmptyState";
import SearchForm from "@/app/components/data/SearchForm";
import ScrollToTop from "@/app/components/ScrollToTop";
import ConversacionesHeader from "@/app/components/pages/ConversacionesHeader";

export default async function ConversacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const conversaciones = await prisma.conversacion.findMany({
    where: q
      ? {
          OR: [
            { numeroCliente: { contains: q } },
            { mensajes: { some: { contenido: { contains: q, mode: "insensitive" } } } },
          ],
        }
      : {},
    orderBy: { actualizadoEn: "desc" },
    include: {
      empresa: { select: { nombre: true } },
      mensajes: {
        orderBy: { creadoEn: "desc" },
        take: 1,
      },
      _count: { select: { mensajes: true } },
    },
  });

  return (
    <div>
      <ConversacionesHeader
        conversacionesCount={conversaciones.length}
        conversaciones={conversaciones}
      />

      <div className="mb-6">
        <SearchForm placeholder="Buscar por número o contenido..." />
      </div>

      {conversaciones.length === 0 ? (
        <div className="bg-white rounded-xl p-10" style={{ border: "1px solid #E2E9F0" }}>
          <EmptyState
            icon="💬"
            title={q ? "No se encontraron conversaciones" : "Aún no hay conversaciones"}
            description={
              q
                ? `No hay resultados para "${q}"`
                : "Cuando llegue el primer mensaje por WhatsApp, aparecerá aquí."
            }
            steps={
              !q
                ? [
                    "Conecta tu WhatsApp Business",
                    "Espera el primer mensaje de un cliente",
                    "¡Listo! El agente IA responderá automáticamente",
                  ]
                : undefined
            }
          />
        </div>
      ) : (
        <div className="space-y-3">
          {conversaciones.map((c) => {
            const ultimoMensaje = c.mensajes[0];
            return (
              <Link
                key={c.id}
                href={`/dashboard/conversaciones/${c.id}`}
                className="flex items-center gap-4 bg-white rounded-xl p-4 transition-all hover:shadow-md"
                style={{ border: "1px solid #E2E9F0" }}
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-lg flex-shrink-0 font-semibold font-sora"
                  style={{ background: "rgba(34,178,107,0.08)", color: "#22B26B" }}
                >
                  {c.numeroCliente[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm font-sora" style={{ color: "#0E2436" }}>
                        {c.numeroCliente}
                      </span>
                      {c.modoHumano && (
                        <span
                          className="text-xs rounded-full px-2 py-0.5 font-medium"
                          style={{ background: "rgba(251,146,60,0.08)", color: "#FB923C" }}
                        >
                          ⚠️ Atención humana
                        </span>
                      )}
                    </div>
                    <span className="text-xs" style={{ color: "#73869A" }}>
                      {c.actualizadoEn.toLocaleDateString("es-MX", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs truncate" style={{ color: "#73869A" }}>
                      {ultimoMensaje?.contenido ?? "Sin mensajes"}
                    </p>
                    <span
                      className="ml-2 text-xs rounded-full px-2 py-0.5 flex-shrink-0"
                      style={{ background: "rgba(34,178,107,0.08)", color: "#22B26B" }}
                    >
                      {c._count.mensajes} msg
                    </span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: "#73869A" }}>
                    {c.empresa.nombre}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <ScrollToTop />
    </div>
  );
}
