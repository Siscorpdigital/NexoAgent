import { prisma } from "@/lib/prisma";
import Link from "next/link";
import SearchForm from "@/app/components/data/SearchForm";
import ScrollToTop from "@/app/components/ScrollToTop";
import EmptyState from "@/app/components/help/EmptyState";
import CRMHeader from "@/app/components/pages/CRMHeader";
import ContactForm from "@/app/components/forms/ContactForm";
import { FilterBarWithUrl } from "@/app/components/data/FilterBar";
import ContactBadge from "@/app/components/crm/ContactBadge";
import ConversationsCount from "@/app/components/crm/ConversationsCount";

const TIPOS = [
  { key: "TODOS", label: "Todos" },
  { key: "LEAD", label: "Leads" },
  { key: "CLIENTE", label: "Clientes" },
  { key: "PROVEEDOR", label: "Proveedores" },
];

const BADGE: Record<string, { label: string; color: string; bg: string }> = {
  LEAD:      { label: "Lead",      color: "#2D5750", bg: "rgba(43,130,240,0.08)" },
  CLIENTE:   { label: "Cliente",   color: "#2BAA8A", bg: "rgba(43, 170, 138,0.08)" },
  PROVEEDOR: { label: "Proveedor", color: "#5C7872", bg: "rgba(115,134,154,0.08)" },
};

export default async function CRMPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tipo?: string; q?: string }>;
}) {
  const { id } = await params;
  const { tipo, q } = await searchParams;
  const filtro = tipo && tipo !== "TODOS" ? tipo : undefined;

  const contactos = await prisma.contacto.findMany({
    where: {
      empresaId: id,
      ...(filtro ? { tipo: filtro as "LEAD" | "CLIENTE" | "PROVEEDOR" } : {}),
      ...(q ? {
        OR: [
          { nombre: { contains: q, mode: "insensitive" } },
          { telefono: { contains: q } },
        ]
      } : {}),
    },
    orderBy: { creadoEn: "desc" },
    include: { _count: { select: { conversaciones: true } } },
  });

  const totales = await prisma.contacto.groupBy({
    by: ["tipo"],
    where: { empresaId: id },
    _count: true,
  });

  const contar = (t: string) => totales.find((x) => x.tipo === t)?._count ?? 0;

  return (
    <div>
      <CRMHeader
        contactosCount={contactos.length}
        contactos={contactos}
        empresaId={id}
      />

      {/* Búsqueda */}
      <div className="mb-4">
        <SearchForm placeholder="Buscar por nombre o teléfono..." />
      </div>

      {/* Filtros */}
      <div className="mb-6">
        <FilterBarWithUrl
          filters={TIPOS.map((t) => ({
            id: t.key,
            label: t.label,
            value: t.key,
            count: t.key === "TODOS"
              ? totales.reduce((a, b) => a + b._count, 0)
              : contar(t.key),
            color: t.key === "TODOS" ? undefined : BADGE[t.key]?.color,
          }))}
          baseUrl={`/empresa/${id}/crm`}
          queryParam="tipo"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de contactos */}
        <div className="lg:col-span-2 bg-white rounded-xl" style={{ border: "1px solid #C8DAD6" }}>
          {contactos.length === 0 ? (
            <div className="py-16">
              <EmptyState
                icon="👥"
                title={q ? "No se encontraron contactos" : "No hay contactos todavía"}
                description={q ? `No hay resultados para "${q}"` : "Se crean automáticamente cuando llega un mensaje"}
                steps={!q ? [
                  "Los contactos se crean automáticamente",
                  "O agrégalos manualmente con el formulario",
                  "Organízalos como Leads, Clientes o Proveedores"
                ] : undefined}
              />
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "#F4F7F6" }}>
              {contactos.map((c) => {
                const badge = BADGE[c.tipo];
                return (
                  <Link
                    key={c.id}
                    href={`/empresa/${id}/crm/${c.id}`}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm font-sora" style={{ background: badge.bg, color: badge.color }}>
                      {(c.nombre ?? c.telefono)[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "#2D5750" }}>
                        {c.nombre ?? <span style={{ color: "#5C7872" }}>Sin nombre</span>}
                      </p>
                      <p className="text-xs mt-0.5 font-roboto tracking-wide" style={{ color: "#5C7872" }}>{c.telefono}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <ContactBadge
                        tipo={c.tipo}
                        label={badge.label}
                        color={badge.color}
                        bg={badge.bg}
                      />
                      <ConversationsCount count={c._count.conversaciones} />
                      <svg className="w-4 h-4" style={{ color: "#C8DAD6" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Formulario nuevo contacto */}
        <ContactForm empresaId={id} />
      </div>

      <ScrollToTop />
    </div>
  );
}
