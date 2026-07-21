import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { actualizarContacto } from "@/app/actions/crm";
import DeleteContactButton from "@/app/components/actions/DeleteContactButton";
import LoadingButton from "@/app/components/ui/LoadingButton";
import ContactBadge from "@/app/components/crm/ContactBadge";
import Tooltip, { HelpIcon } from "@/app/components/help/Tooltip";

const BADGE: Record<string, { label: string; color: string; bg: string }> = {
  LEAD:      { label: "Lead",      color: "#2D5750", bg: "rgba(43,130,240,0.08)" },
  CLIENTE:   { label: "Cliente",   color: "#2BAA8A", bg: "rgba(43, 170, 138,0.08)" },
  PROVEEDOR: { label: "Proveedor", color: "#5C7872", bg: "rgba(115,134,154,0.08)" },
};

export default async function ContactoDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; contactoId: string }>;
  searchParams: Promise<{ guardado?: string }>;
}) {
  const { id, contactoId } = await params;
  const { guardado } = await searchParams;

  const contacto = await prisma.contacto.findUnique({
    where: { id: contactoId },
    include: {
      conversaciones: {
        orderBy: { actualizadoEn: "desc" },
        include: {
          mensajes: { orderBy: { creadoEn: "desc" }, take: 1 },
          _count: { select: { mensajes: true } },
        },
      },
    },
  });

  if (!contacto || contacto.empresaId !== id) notFound();

  const badge = BADGE[contacto.tipo];

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-2 sm:gap-3 mb-6">
        <Link href={`/empresa/${id}/crm`} className="transition-colors" style={{ color: "#5C7872" }}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold font-sora" style={{ background: badge.bg, color: badge.color }}>
          {(contacto.nombre ?? contacto.telefono)[0].toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-bold font-sora" style={{ color: "#2D5750" }}>
            {contacto.nombre ?? <span className="font-roboto tracking-wide">{contacto.telefono}</span>}
          </h1>
          <p className="text-xs font-roboto tracking-wide" style={{ color: "#5C7872" }}>{contacto.telefono}</p>
        </div>
        <ContactBadge
          tipo={contacto.tipo}
          label={badge.label}
          color={badge.color}
          bg={badge.bg}
        />
      </div>

      {guardado && (
        <div className="mb-5 rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2" style={{ background: "rgba(43, 170, 138,0.08)", border: "1px solid rgba(43, 170, 138,0.25)", color: "#2BAA8A" }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          Contacto actualizado correctamente.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Editar contacto */}
        <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #C8DAD6" }}>
          <h2 className="font-semibold font-sora text-sm mb-4" style={{ color: "#2D5750" }}>Datos del contacto</h2>
          <form action={actualizarContacto} className="space-y-3">
            <input type="hidden" name="id" value={contacto.id} />
            <input type="hidden" name="empresaId" value={id} />
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#3D6E65" }}>Nombre</label>
              <input name="nombre" type="text" defaultValue={contacto.nombre ?? ""}
                placeholder="Nombre del contacto"
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={{ border: "1px solid #C8DAD6", color: "#2D5750" }} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 flex items-center gap-1" style={{ color: "#3D6E65" }}>
                Tipo
                <HelpIcon tooltip="Lead: contacto potencial | Cliente: ya compró | Proveedor: proveedor de servicios" />
              </label>
              <select name="tipo" defaultValue={contacto.tipo}
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={{ border: "1px solid #C8DAD6", color: "#2D5750" }}>
                <option value="LEAD">Lead</option>
                <option value="CLIENTE">Cliente</option>
                <option value="PROVEEDOR">Proveedor</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 flex items-center gap-1" style={{ color: "#3D6E65" }}>
                Notas internas
                <HelpIcon tooltip="Información privada sobre este contacto (no se comparte)" />
              </label>
              <textarea name="notas" rows={4} defaultValue={contacto.notas ?? ""}
                placeholder="Notas sobre este contacto..."
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"
                style={{ border: "1px solid #C8DAD6", color: "#2D5750" }} />
            </div>
            <LoadingButton
              type="submit"
              className="w-full text-white text-sm font-medium py-2 rounded-lg transition-opacity hover:opacity-90 grad-bg"
            >
              Guardar
            </LoadingButton>
          </form>

          {/* Eliminar */}
          <div className="mt-4 pt-4" style={{ borderTop: "1px solid #F4F7F6" }}>
            <DeleteContactButton
              contactoId={contacto.id}
              empresaId={id}
              contactoNombre={contacto.nombre ?? contacto.telefono}
            />
          </div>
        </div>

        {/* Historial de conversaciones */}
        <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #C8DAD6" }}>
          <h2 className="font-semibold font-sora text-sm mb-4" style={{ color: "#2D5750" }}>
            Conversaciones ({contacto.conversaciones.length})
          </h2>
          {contacto.conversaciones.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: "#5C7872" }}>Sin conversaciones todavía</p>
          ) : (
            <div className="space-y-2">
              {contacto.conversaciones.map((c) => (
                <Link key={c.id} href={`/empresa/${id}/conversaciones/${c.id}`}
                  className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-gray-50"
                  style={{ border: "1px solid #F4F7F6" }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate" style={{ color: "#3D6E65" }}>
                      {c.mensajes[0]?.contenido ?? "Sin mensajes"}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#5C7872" }}>
                      {c.actualizadoEn.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {c.modoHumano && <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: "rgba(240,169,59,0.1)", color: "#F0A93B" }}>Humano</span>}
                    <span className="text-xs" style={{ color: "#5C7872" }}>{c._count.mensajes} msg</span>
                    <svg className="w-3.5 h-3.5" style={{ color: "#C8DAD6" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
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
