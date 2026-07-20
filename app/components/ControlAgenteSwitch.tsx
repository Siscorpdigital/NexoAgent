"use client";

import { useState, useTransition } from "react";

interface ControlAgenteSwitchProps {
  conversacionId: string;
  empresaId: string;
  numeroCliente: string;
  modoHumano: boolean;
  cambiarControl: (formData: FormData) => Promise<void>;
}

const TEAL = "#2BAA8A";
const ORANGE = "#F2A020";
const SLATE_DK = "#2D5750";
const MUTED = "#5C7872";
const LINE = "#C8DAD6";

/**
 * Switch moderno para pasar el control de una conversación a un humano
 * o devolvérselo al agente virtual (IA). Optimista: refleja el cambio
 * al instante y llama a la Server Action en segundo plano.
 */
export default function ControlAgenteSwitch({
  conversacionId,
  empresaId,
  numeroCliente,
  modoHumano,
  cambiarControl,
}: ControlAgenteSwitchProps) {
  const [esHumano, setEsHumano] = useState(modoHumano);
  const [pendiente, startTransition] = useTransition();

  const alternar = (destino: boolean) => {
    if (destino === esHumano || pendiente) return;
    setEsHumano(destino);

    const fd = new FormData();
    fd.set("conversacionId", conversacionId);
    fd.set("empresaId", empresaId);
    fd.set("numeroCliente", numeroCliente);
    fd.set("modo", destino ? "humano" : "ia");

    startTransition(async () => {
      try {
        await cambiarControl(fd);
      } catch {
        // Revertir en caso de error
        setEsHumano(!destino);
      }
    });
  };

  const activo = esHumano ? ORANGE : TEAL;

  return (
    <div
      className="rounded-2xl p-4 sm:p-5 bg-white"
      style={{ border: `1px solid ${LINE}`, boxShadow: "0 1px 2px rgba(45,87,80,0.04)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: activo, boxShadow: `0 0 0 3px ${activo}22` }}
          />
          <h3 className="text-sm font-semibold font-sora" style={{ color: SLATE_DK }}>
            Control de la conversación
          </h3>
        </div>
        <span
          className="text-[11px] font-medium px-2.5 py-1 rounded-full transition-colors"
          style={{ color: activo, background: `${activo}14` }}
        >
          {pendiente ? "Actualizando…" : esHumano ? "Atención humana" : "IA activa"}
        </span>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Etiqueta IA (izquierda) */}
        <button
          type="button"
          onClick={() => alternar(false)}
          disabled={pendiente}
          className="flex-1 text-left rounded-xl px-3 py-2.5 transition-all disabled:cursor-not-allowed"
          style={{
            background: !esHumano ? `${TEAL}12` : "transparent",
            border: `1px solid ${!esHumano ? `${TEAL}55` : "transparent"}`,
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg leading-none">🤖</span>
            <div>
              <p
                className="text-sm font-semibold font-sora leading-tight"
                style={{ color: !esHumano ? TEAL : MUTED }}
              >
                Agente Virtual
              </p>
              <p className="text-[11px] leading-tight" style={{ color: MUTED }}>
                Responde la IA
              </p>
            </div>
          </div>
        </button>

        {/* Switch central */}
        <button
          type="button"
          role="switch"
          aria-checked={esHumano}
          aria-label={esHumano ? "Devolver control a la IA" : "Tomar control humano"}
          onClick={() => alternar(!esHumano)}
          disabled={pendiente}
          className="relative flex-shrink-0 rounded-full transition-colors duration-300 disabled:opacity-70"
          style={{
            width: 72,
            height: 38,
            background: activo,
            boxShadow: `inset 0 1px 3px rgba(0,0,0,0.12)`,
          }}
        >
          <span
            className="absolute top-1 flex items-center justify-center rounded-full bg-white transition-all duration-300"
            style={{
              width: 30,
              height: 30,
              left: esHumano ? 38 : 4,
              boxShadow: "0 2px 5px rgba(45,87,80,0.28)",
            }}
          >
            <span className="text-sm leading-none">{esHumano ? "👤" : "🤖"}</span>
          </span>
        </button>

        {/* Etiqueta Humano (derecha) */}
        <button
          type="button"
          onClick={() => alternar(true)}
          disabled={pendiente}
          className="flex-1 text-right rounded-xl px-3 py-2.5 transition-all disabled:cursor-not-allowed"
          style={{
            background: esHumano ? `${ORANGE}12` : "transparent",
            border: `1px solid ${esHumano ? `${ORANGE}55` : "transparent"}`,
          }}
        >
          <div className="flex items-center justify-end gap-2">
            <div>
              <p
                className="text-sm font-semibold font-sora leading-tight"
                style={{ color: esHumano ? ORANGE : MUTED }}
              >
                Atención Humana
              </p>
              <p className="text-[11px] leading-tight" style={{ color: MUTED }}>
                Respondes tú
              </p>
            </div>
            <span className="text-lg leading-none">👤</span>
          </div>
        </button>
      </div>

      <p className="text-[11px] mt-3 text-center" style={{ color: MUTED }}>
        {esHumano
          ? "Estás atendiendo esta conversación. La IA no responderá hasta que la reactives."
          : "La IA responde automáticamente. Toma el control cuando quieras intervenir."}
      </p>
    </div>
  );
}
