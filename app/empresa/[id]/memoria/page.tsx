import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ScrollToTop from "@/app/components/ScrollToTop";
import DeleteMemoriaButton from "@/app/components/actions/DeleteMemoriaButton";
import MemoriaForm from "@/app/components/forms/MemoriaForm";

const CATEGORIAS = [
  { key: "PRODUCTO",  label: "Productos y Servicios", color: "#2D5750", bg: "rgba(43,130,240,0.06)",  placeholder: "Ej: Consulta básica",       placeholderValor: "Ej: $500 · incluye revisión y diagnóstico" },
  { key: "HORARIO",   label: "Horarios",               color: "#2BAA8A", bg: "rgba(21,184,201,0.06)",  placeholder: "Ej: Lunes a Viernes",        placeholderValor: "Ej: 9:00am – 6:00pm" },
  { key: "PRECIO",    label: "Precios y Tarifas",      color: "#2BAA8A", bg: "rgba(43, 170, 138,0.06)",  placeholder: "Ej: Plan mensual",           placeholderValor: "Ej: $1,200 / mes" },
  { key: "POLITICA",  label: "Políticas internas",     color: "#5C7872", bg: "rgba(115,134,154,0.06)", placeholder: "Ej: Cancelaciones",          placeholderValor: "Ej: Con 24h de anticipación sin costo" },
];

export default async function MemoriaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Solo PROVEEDOR puede acceder
  const session = await auth();
  if (!session || session.user.rol !== "PROVEEDOR") {
    redirect(`/empresa/${id}`);
  }

  const entradas = await prisma.memoriaEmpresa.findMany({
    where: { empresaId: id },
    orderBy: { creadoEn: "asc" },
  });

  const porCategoria = (cat: string) => entradas.filter((e) => e.categoria === cat);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-sora" style={{ color: "#2D5750" }}>
          Datos del negocio
        </h1>
        <p className="text-sm mt-1" style={{ color: "#5C7872" }}>
          Precios, horarios y políticas que tu asistente responde con exactitud · {entradas.length} dato{entradas.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {CATEGORIAS.map((cat) => {
          const items = porCategoria(cat.key);
          return (
            <div key={cat.key} className="bg-white rounded-xl" style={{ border: "1px solid #C8DAD6" }}>
              {/* Header */}
              <div className="flex items-center gap-2.5 px-5 py-4" style={{ borderBottom: "1px solid #F4F7F6" }}>
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cat.color }}></span>
                <h2 className="font-semibold font-sora text-sm" style={{ color: "#2D5750" }}>
                  {cat.label}
                </h2>
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: cat.bg, color: cat.color }}>
                  {items.length}
                </span>
              </div>

              {/* Entradas */}
              <div className="divide-y" style={{ borderColor: "#F4F7F6" }}>
                {items.length === 0 ? (
                  <p className="px-5 py-4 text-xs" style={{ color: "#5C7872" }}>
                    Sin entradas todavía. Agrega la primera abajo.
                  </p>
                ) : (
                  items.map((e) => (
                    <div key={e.id} className="flex items-start gap-3 px-5 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium" style={{ color: "#2D5750" }}>{e.clave}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#5C7872" }}>{e.valor}</p>
                      </div>
                      <div className="flex-shrink-0 mt-0.5">
                        <DeleteMemoriaButton
                          memoriaId={e.id}
                          empresaId={id}
                          clave={e.clave}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Formulario para agregar */}
              <MemoriaForm
                empresaId={id}
                categoria={cat.key}
                color={cat.color}
                placeholder={cat.placeholder}
                placeholderValor={cat.placeholderValor}
              />
            </div>
          );
        })}
      </div>

      <ScrollToTop />
    </div>
  );
}
