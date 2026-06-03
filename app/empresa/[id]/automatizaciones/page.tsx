import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  crearAutomatizacion,
  toggleAutomatizacion,
} from "@/app/actions/automatizaciones";
import LoadingButton from "@/app/components/ui/LoadingButton";
import ScrollToTop from "@/app/components/ScrollToTop";
import DeleteAutomatizacionButton from "@/app/components/actions/DeleteAutomatizacionButton";

const TRIGGERS = [
  {
    key: "PRIMER_MENSAJE",
    label: "Primer mensaje",
    desc: "Cuando un contacto escribe por primera vez",
    color: "#2B82F0",
    condicionLabel: null,
  },
  {
    key: "PALABRA_CLAVE",
    label: "Palabra clave",
    desc: "Cuando el mensaje contiene ciertas palabras",
    color: "#15B8C9",
    condicionLabel: "Palabras clave (separadas por coma)",
    condicionPlaceholder: "Ej: precio, tarifa, costo",
  },
  {
    key: "FUERA_HORARIO",
    label: "Fuera de horario",
    desc: "Cuando llega un mensaje fuera del horario de atención",
    color: "#22B26B",
    condicionLabel: "Horario de atención",
    condicionPlaceholder: "Ej: 09:00-18:00",
  },
];

const TRIGGER_MAP = Object.fromEntries(TRIGGERS.map((t) => [t.key, t]));

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
        <h1 className="text-2xl font-bold font-sora" style={{ color: "#0E2436" }}>
          Automatizaciones
        </h1>
        <p className="text-sm mt-1" style={{ color: "#73869A" }}>
          Respuestas automáticas que se activan sin pasar por la IA
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Lista de automatizaciones */}
        <div className="space-y-3">
          {automatizaciones.length === 0 ? (
            <div className="bg-white rounded-xl p-10 text-center" style={{ border: "1px solid #E2E9F0" }}>
              <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "#F4F7FA" }}>
                <svg className="w-5 h-5" style={{ color: "#73869A" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <p className="text-sm" style={{ color: "#73869A" }}>Sin automatizaciones todavía.</p>
              <p className="text-xs mt-1" style={{ color: "#73869A" }}>Crea la primera con el formulario.</p>
            </div>
          ) : (
            automatizaciones.map((a) => {
              const t = TRIGGER_MAP[a.trigger];
              return (
                <div key={a.id} className="bg-white rounded-xl p-5" style={{ border: `1px solid ${a.activa ? "#E2E9F0" : "#F4F7FA"}`, opacity: a.activa ? 1 : 0.6 }}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: t?.color ?? "#73869A" }}></span>
                      <p className="font-semibold font-sora text-sm" style={{ color: "#0E2436" }}>{a.nombre}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: a.activa ? "rgba(34,178,107,0.08)" : "#F4F7FA", color: a.activa ? "#22B26B" : "#73869A" }}>
                        {a.activa ? "Activa" : "Pausada"}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs mb-1" style={{ color: "#73869A" }}>
                    {t?.label} {a.condicion ? `· ${a.condicion}` : ""}
                  </p>
                  <p className="text-xs italic mb-4 line-clamp-2" style={{ color: "#41566B" }}>
                    &ldquo;{a.mensaje}&rdquo;
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: "#73869A" }}>
                      {a.ejecuciones} ejecuciones
                    </span>
                    <div className="flex gap-2">
                      <form action={toggleAutomatizacion}>
                        <input type="hidden" name="id" value={a.id} />
                        <input type="hidden" name="empresaId" value={id} />
                        <input type="hidden" name="activa" value={String(a.activa)} />
                        <button type="submit" className="text-xs font-medium transition-colors hover:underline" style={{ color: "#2B82F0" }}>
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
        <div className="bg-white rounded-xl p-6 h-fit" style={{ border: "1px solid #E2E9F0" }}>
          <h2 className="font-semibold font-sora text-sm mb-5" style={{ color: "#0E2436" }}>
            Nueva automatización
          </h2>
          <NuevaAutomatizacionForm empresaId={id} />
        </div>
      </div>

      <ScrollToTop />
    </div>
  );
}

function NuevaAutomatizacionForm({ empresaId }: { empresaId: string }) {
  return (
    <form action={crearAutomatizacion} className="space-y-4">
      <input type="hidden" name="empresaId" value={empresaId} />

      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "#41566B" }}>Nombre</label>
        <input name="nombre" type="text" required placeholder="Ej: Bienvenida nuevos clientes"
          className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
          style={{ border: "1px solid #E2E9F0", color: "#0E2436" }} />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "#41566B" }}>Tipo de disparador</label>
        <select name="trigger" className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
          style={{ border: "1px solid #E2E9F0", color: "#0E2436" }}>
          {TRIGGERS.map((t) => (
            <option key={t.key} value={t.key}>{t.label} — {t.desc}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "#41566B" }}>
          Condición <span className="font-normal" style={{ color: "#73869A" }}>(solo para Palabra clave y Fuera de horario)</span>
        </label>
        <input name="condicion" type="text" placeholder="Ej: precio, tarifa  ó  09:00-18:00"
          className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
          style={{ border: "1px solid #E2E9F0", color: "#0E2436" }} />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "#41566B" }}>Mensaje a enviar</label>
        <textarea name="mensaje" required rows={4}
          placeholder="Ej: ¡Hola! Soy Katy 😊 ¿En qué te puedo ayudar hoy?"
          className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none resize-none"
          style={{ border: "1px solid #E2E9F0", color: "#0E2436" }} />
      </div>

      <LoadingButton
        type="submit"
        className="w-full text-white text-sm font-medium py-2.5 rounded-lg transition-opacity hover:opacity-90 grad-bg"
      >
        Crear automatización
      </LoadingButton>
    </form>
  );
}
