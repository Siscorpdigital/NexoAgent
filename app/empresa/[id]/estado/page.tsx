import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSystemStatus } from "@/lib/system-status";

const SLATE_DK = "#2D5750";
const MUTED = "#5C7872";
const TEAL = "#2BAA8A";
const TEAL_TXT = "#1E7D66";
const ORANGE_TXT = "#B4610A";
const LINE = "#C8DAD6";

export default async function EstadoSistemaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth();
  if (!session) redirect("/login");
  if (!session.user.esAdmin) redirect(`/empresa/${id}`);

  const checks = await getSystemStatus();
  const criticos = checks.filter((c) => c.critico);
  const criticosOk = criticos.filter((c) => c.ok).length;
  const listoParaVivir = criticosOk === criticos.length;

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-sora" style={{ color: SLATE_DK }}>
          Estado del sistema
        </h1>
        <p className="text-sm mt-1" style={{ color: MUTED }}>
          Diagnóstico en vivo de las conexiones necesarias para que el asistente funcione.
        </p>
      </div>

      {/* Resumen */}
      <div
        className="rounded-2xl p-5 mb-6"
        style={{
          background: listoParaVivir ? `${TEAL}0D` : `#F2A0200D`,
          border: `1px solid ${listoParaVivir ? `${TEAL}40` : "#F2A02040"}`,
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{listoParaVivir ? "✅" : "⚠️"}</span>
          <div>
            <p className="font-semibold font-sora" style={{ color: listoParaVivir ? TEAL_TXT : ORANGE_TXT }}>
              {listoParaVivir
                ? "Todo listo: el asistente está operativo."
                : `Faltan ${criticos.length - criticosOk} de ${criticos.length} conexiones críticas`}
            </p>
            <p className="text-xs mt-0.5" style={{ color: MUTED }}>
              {listoParaVivir
                ? "Las conexiones imprescindibles (base de datos, IA y WhatsApp) están activas."
                : "Completa las conexiones críticas para que el agente pueda atender por WhatsApp."}
            </p>
          </div>
        </div>
      </div>

      {/* Lista de chequeos */}
      <div className="space-y-3">
        {checks.map((c) => (
          <div
            key={c.id}
            className="bg-white rounded-xl p-4 flex items-start gap-3"
            style={{ border: `1px solid ${LINE}` }}
          >
            <span
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
              style={
                c.ok
                  ? { background: TEAL, color: "#fff" }
                  : { background: c.critico ? "#F2A0201F" : "#F4F7F6", color: c.critico ? ORANGE_TXT : MUTED, border: `1px solid ${LINE}` }
              }
            >
              {c.ok ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                "!"
              )}
            </span>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold font-sora" style={{ color: SLATE_DK }}>
                  {c.label}
                </p>
                {c.critico && !c.ok && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#F2A0201F", color: ORANGE_TXT }}>
                    Requerido
                  </span>
                )}
                {!c.critico && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: "#F4F7F6", color: MUTED }}>
                    Opcional
                  </span>
                )}
              </div>
              <p className="text-xs mt-1" style={{ color: c.ok ? TEAL_TXT : MUTED }}>
                {c.detalle}
              </p>
              {!c.ok && c.comoActivar && (
                <p className="text-xs mt-1.5 rounded-lg px-3 py-2" style={{ background: "#F4F7F6", color: MUTED }}>
                  <span className="font-semibold" style={{ color: SLATE_DK }}>Cómo activar: </span>
                  {c.comoActivar}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs mt-6" style={{ color: MUTED }}>
        Tras agregar o cambiar variables en Vercel, vuelve a desplegar para que tomen efecto y recarga esta página.
      </p>
    </div>
  );
}
