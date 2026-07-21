"use client";

import { useState, useTransition } from "react";

interface ControlSwitchMiniProps {
  conversacionId: string;
  empresaId: string;
  numeroCliente: string;
  modoHumano: boolean;
  cambiarControl: (formData: FormData) => Promise<void>;
}

const TEAL = "#2BAA8A";
const ORANGE = "#F2A020";
const MUTED = "#5C7872";

/**
 * Versión compacta del switch de control para usar dentro de la lista de
 * conversaciones (cambiar IA ↔ humano sin abrir el chat). Detiene la
 * navegación del enlace que lo contiene y aplica el cambio de forma optimista.
 */
export default function ControlSwitchMini({
  conversacionId,
  empresaId,
  numeroCliente,
  modoHumano,
  cambiarControl,
}: ControlSwitchMiniProps) {
  const [esHumano, setEsHumano] = useState(modoHumano);
  const [pendiente, startTransition] = useTransition();

  const alternar = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (pendiente) return;

    const destino = !esHumano;
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
        setEsHumano(!destino);
      }
    });
  };

  const activo = esHumano ? ORANGE : TEAL;

  return (
    <div className="flex items-center gap-2">
      <span
        className="hidden sm:inline text-[11px] font-medium tabular-nums"
        style={{ color: pendiente ? MUTED : activo, width: 52, textAlign: "right" }}
      >
        {esHumano ? "Humano" : "IA"}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={esHumano}
        aria-label={esHumano ? "Devolver a la IA" : "Tomar control humano"}
        title={esHumano ? "Atención humana · toca para devolver a la IA" : "IA activa · toca para tomar el control"}
        onClick={alternar}
        disabled={pendiente}
        className="relative flex-shrink-0 rounded-full transition-colors duration-300 disabled:opacity-60"
        style={{
          width: 46,
          height: 26,
          background: activo,
          boxShadow: "inset 0 1px 2px rgba(0,0,0,0.15)",
        }}
      >
        <span
          className="absolute top-[3px] flex items-center justify-center rounded-full bg-white transition-all duration-300"
          style={{
            width: 20,
            height: 20,
            left: esHumano ? 23 : 3,
            fontSize: 10,
            boxShadow: "0 1px 3px rgba(45,87,80,0.3)",
          }}
        >
          {esHumano ? "👤" : "🤖"}
        </span>
      </button>
    </div>
  );
}
