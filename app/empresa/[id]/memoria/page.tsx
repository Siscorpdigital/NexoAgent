import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { agregarMemoria } from "@/app/actions/memoria";
import LoadingButton from "@/app/components/ui/LoadingButton";
import ScrollToTop from "@/app/components/ScrollToTop";
import DeleteMemoriaButton from "@/app/components/actions/DeleteMemoriaButton";

const CATEGORIAS = [
  { key: "PRODUCTO",  label: "Productos y Servicios", color: "#2B82F0", bg: "rgba(43,130,240,0.06)",  placeholder: "Ej: Consulta básica",       placeholderValor: "Ej: $500 · incluye revisión y diagnóstico" },
  { key: "HORARIO",   label: "Horarios",               color: "#15B8C9", bg: "rgba(21,184,201,0.06)",  placeholder: "Ej: Lunes a Viernes",        placeholderValor: "Ej: 9:00am – 6:00pm" },
  { key: "PRECIO",    label: "Precios y Tarifas",      color: "#22B26B", bg: "rgba(34,178,107,0.06)",  placeholder: "Ej: Plan mensual",           placeholderValor: "Ej: $1,200 / mes" },
  { key: "POLITICA",  label: "Políticas internas",     color: "#73869A", bg: "rgba(115,134,154,0.06)", placeholder: "Ej: Cancelaciones",          placeholderValor: "Ej: Con 24h de anticipación sin costo" },
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
        <h1 className="text-2xl font-bold font-sora" style={{ color: "#0E2436" }}>
          Memoria del negocio
        </h1>
        <p className="text-sm mt-1" style={{ color: "#73869A" }}>
          Datos exactos que la IA usa como fuente de verdad · {entradas.length} entradas
        </p>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {CATEGORIAS.map((cat) => {
          const items = porCategoria(cat.key);
          return (
            <div key={cat.key} className="bg-white rounded-xl" style={{ border: "1px solid #E2E9F0" }}>
              {/* Header */}
              <div className="flex items-center gap-2.5 px-5 py-4" style={{ borderBottom: "1px solid #F4F7FA" }}>
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cat.color }}></span>
                <h2 className="font-semibold font-sora text-sm" style={{ color: "#0E2436" }}>
                  {cat.label}
                </h2>
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: cat.bg, color: cat.color }}>
                  {items.length}
                </span>
              </div>

              {/* Entradas */}
              <div className="divide-y" style={{ borderColor: "#F4F7FA" }}>
                {items.length === 0 ? (
                  <p className="px-5 py-4 text-xs" style={{ color: "#73869A" }}>
                    Sin entradas todavía. Agrega la primera abajo.
                  </p>
                ) : (
                  items.map((e) => (
                    <div key={e.id} className="flex items-start gap-3 px-5 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium" style={{ color: "#0E2436" }}>{e.clave}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#73869A" }}>{e.valor}</p>
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
              <form action={agregarMemoria} className="p-4 space-y-2" style={{ borderTop: "1px solid #F4F7FA", background: "#FAFCFE" }}>
                <input type="hidden" name="empresaId" value={id} />
                <input type="hidden" name="categoria" value={cat.key} />
                <input
                  name="clave"
                  type="text"
                  required
                  placeholder={cat.placeholder}
                  className="w-full rounded-lg px-3 py-2 text-xs focus:outline-none"
                  style={{ border: "1px solid #E2E9F0", color: "#0E2436" }}
                />
                <input
                  name="valor"
                  type="text"
                  required
                  placeholder={cat.placeholderValor}
                  className="w-full rounded-lg px-3 py-2 text-xs focus:outline-none"
                  style={{ border: "1px solid #E2E9F0", color: "#0E2436" }}
                />
                <LoadingButton
                  type="submit"
                  className="w-full text-xs font-medium py-2 rounded-lg transition-opacity hover:opacity-90"
                  style={{ background: cat.color, color: "white" }}
                >
                  + Agregar
                </LoadingButton>
              </form>
            </div>
          );
        })}
      </div>

      <ScrollToTop />
    </div>
  );
}
