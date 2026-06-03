import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { crearContacto } from "@/app/actions/crm";
import SearchForm from "@/app/components/data/SearchForm";
import ScrollToTop from "@/app/components/ScrollToTop";
import EmptyState from "@/app/components/help/EmptyState";
import LoadingButton from "@/app/components/ui/LoadingButton";
import CRMHeader from "@/app/components/pages/CRMHeader";

const TIPOS = [
  { key: "TODOS", label: "Todos" },
  { key: "LEAD", label: "Leads" },
  { key: "CLIENTE", label: "Clientes" },
  { key: "PROVEEDOR", label: "Proveedores" },
];

const BADGE: Record<string, { label: string; color: string; bg: string }> = {
  LEAD:      { label: "Lead",      color: "#2B82F0", bg: "rgba(43,130,240,0.08)" },
  CLIENTE:   { label: "Cliente",   color: "#22B26B", bg: "rgba(34,178,107,0.08)" },
  PROVEEDOR: { label: "Proveedor", color: "#73869A", bg: "rgba(115,134,154,0.08)" },
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
      <div className="flex gap-2 mb-6">
        {TIPOS.map((t) => {
          const count = t.key === "TODOS"
            ? totales.reduce((a, b) => a + b._count, 0)
            : contar(t.key);
          const activo = (tipo ?? "TODOS") === t.key;
          return (
            <Link
              key={t.key}
              href={`/empresa/${id}/crm?tipo=${t.key}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
              style={{
                background: activo ? "#0E2436" : "white",
                color: activo ? "white" : "#41566B",
                border: "1px solid #E2E9F0",
              }}
            >
              {t.label}
              <span className="text-xs opacity-60">{count}</span>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Lista de contactos */}
        <div className="col-span-2 bg-white rounded-xl" style={{ border: "1px solid #E2E9F0" }}>
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
            <div className="divide-y" style={{ borderColor: "#F4F7FA" }}>
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
                      <p className="text-sm font-medium truncate" style={{ color: "#0E2436" }}>
                        {c.nombre ?? <span style={{ color: "#73869A" }}>Sin nombre</span>}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "#73869A" }}>{c.telefono}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: badge.bg, color: badge.color }}>
                        {badge.label}
                      </span>
                      <span className="text-xs" style={{ color: "#73869A" }}>{c._count.conversaciones} conv.</span>
                      <svg className="w-4 h-4" style={{ color: "#E2E9F0" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Formulario nuevo contacto */}
        <div className="bg-white rounded-xl p-5 h-fit" style={{ border: "1px solid #E2E9F0" }}>
          <h2 className="font-semibold font-sora text-sm mb-4" style={{ color: "#0E2436" }}>Nuevo contacto</h2>
          <form action={crearContacto} className="space-y-3">
            <input type="hidden" name="empresaId" value={id} />
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#41566B" }}>Nombre</label>
              <input name="nombre" type="text" placeholder="Ej: María García"
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={{ border: "1px solid #E2E9F0", color: "#0E2436" }} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#41566B" }}>Teléfono <span style={{ color: "#DC2626" }}>*</span></label>
              <input name="telefono" type="text" required placeholder="Ej: +521234567890"
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={{ border: "1px solid #E2E9F0", color: "#0E2436" }} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#41566B" }}>Tipo</label>
              <select name="tipo"
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={{ border: "1px solid #E2E9F0", color: "#0E2436" }}>
                <option value="LEAD">Lead</option>
                <option value="CLIENTE">Cliente</option>
                <option value="PROVEEDOR">Proveedor</option>
              </select>
            </div>
            <LoadingButton
              type="submit"
              className="w-full text-white text-sm font-medium py-2 rounded-lg transition-opacity hover:opacity-90 grad-bg"
            >
              Crear contacto
            </LoadingButton>
          </form>
        </div>
      </div>

      <ScrollToTop />
    </div>
  );
}
