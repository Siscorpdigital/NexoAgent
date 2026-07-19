import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { toggleAutomatizacion } from "@/app/actions/automatizaciones";
import ScrollToTop from "@/app/components/ScrollToTop";
import DeleteAutomatizacionButton from "@/app/components/actions/DeleteAutomatizacionButton";
import AutomatizacionForm from "@/app/components/forms/AutomatizacionForm";

const TRIGGER_MAP: Record<string, { label: string; color: string }> = {
  PRIMER_MENSAJE: { label: "Primer mensaje", color: "#2D5750" },
  PALABRA_CLAVE: { label: "Palabra clave", color: "#2BAA8A" },
  FUERA_HORARIO: { label: "Fuera de horario", color: "#2BAA8A" },
};

export default async function AutomatizacionesPage({
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

  const automatizaciones = await prisma.automatizacion.findMany({
    where: { empresaId: id },
    orderBy: { creadoEn: "desc" },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-sora" style={{ color: "#2D5750" }}>
          Automatizaciones
        </h1>
        <p className="text-sm mt-1" style={{ color: "#5C7872" }}>
          Respuestas automáticas que se activan sin pasar por la IA
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de automatizaciones */}
        <div className="space-y-3">
          {automatizaciones.length === 0 ? (
            <div className="bg-white rounded-xl p-10 text-center" style={{ border: "1px solid #C8DAD6" }}>
              <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "#F4F7F6" }}>
                <svg className="w-5 h-5" style={{ color: "#5C7872" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <p className="text-sm" style={{ color: "#5C7872" }}>Sin automatizaciones todavía.</p>
              <p className="text-xs mt-1" style={{ color: "#5C7872" }}>Crea la primera con el formulario.</p>
            </div>
          ) : (
            automatizaciones.map((a) => {
              const t = TRIGGER_MAP[a.trigger];
              return (
                <div key={a.id} className="bg-white rounded-xl p-5" style={{ border: `1px solid ${a.activa ? "#C8DAD6" : "#F4F7F6"}`, opacity: a.activa ? 1 : 0.6 }}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: t?.color ?? "#5C7872" }}></span>
                      <p className="font-semibold font-sora text-sm" style={{ color: "#2D5750" }}>{a.nombre}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: a.activa ? "rgba(43, 170, 138,0.08)" : "#F4F7F6", color: a.activa ? "#2BAA8A" : "#5C7872" }}>
                        {a.activa ? "Activa" : "Pausada"}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs mb-1" style={{ color: "#5C7872" }}>
                    {t?.label} {a.condicion ? `· ${a.condicion}` : ""}
                  </p>
                  <p className="text-xs italic mb-4 line-clamp-2" style={{ color: "#3D6E65" }}>
                    &ldquo;{a.mensaje}&rdquo;
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: "#5C7872" }}>
                      {a.ejecuciones} ejecuciones
                    </span>
                    <div className="flex gap-2">
                      <form action={toggleAutomatizacion}>
                        <input type="hidden" name="id" value={a.id} />
                        <input type="hidden" name="empresaId" value={id} />
                        <input type="hidden" name="activa" value={String(a.activa)} />
                        <button type="submit" className="text-xs font-medium transition-colors hover:underline" style={{ color: "#2D5750" }}>
                          {a.activa ? "Pausar" : "Activar"}
                        </button>
                      </form>
                      <DeleteAutomatizacionButton
                        automatizacionId={a.id}
                        empresaId={id}
                        nombre={a.nombre}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Formulario nueva automatización */}
        <div className="bg-white rounded-xl p-6 h-fit" style={{ border: "1px solid #C8DAD6" }}>
          <h2 className="font-semibold font-sora text-sm mb-5" style={{ color: "#2D5750" }}>
            Nueva automatización
          </h2>
          <AutomatizacionForm empresaId={id} />
        </div>
      </div>

      <ScrollToTop />
    </div>
  );
}
