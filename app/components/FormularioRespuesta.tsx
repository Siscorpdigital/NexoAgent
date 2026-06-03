"use client";

import { useRef, useState, useTransition } from "react";
import LoadingButton from "./ui/LoadingButton";

interface FormularioRespuestaProps {
  conversacionId: string;
  empresaId: string;
  numeroCliente: string;
  modoHumano: boolean;
  enviarMensajeHumano: (formData: FormData) => Promise<void>;
  activarModoHumano?: (formData: FormData) => Promise<void>;
}

type SendStatus = "idle" | "sending" | "sent" | "error";

export default function FormularioRespuesta({
  conversacionId,
  empresaId,
  numeroCliente,
  modoHumano,
  enviarMensajeHumano,
  activarModoHumano,
}: FormularioRespuestaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<SendStatus>("idle");
  const [, startTransition] = useTransition();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Si presiona ENTER (sin Shift), enviar el formulario
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Evitar salto de línea

      if (formRef.current && textareaRef.current?.value.trim()) {
        formRef.current.requestSubmit(); // Enviar el formulario
      }
    }
    // Si presiona Shift+ENTER, permitir salto de línea (comportamiento por defecto)
  };

  const handleSubmit = async (formData: FormData) => {
    setStatus("sending");

    try {
      startTransition(async () => {
        await enviarMensajeHumano(formData);
        setStatus("sent");

        // Limpiar el textarea
        if (textareaRef.current) {
          textareaRef.current.value = "";
        }

        // Volver a idle después de 2 segundos
        setTimeout(() => {
          setStatus("idle");
        }, 2000);
      });
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
      setStatus("error");

      // Volver a idle después de 3 segundos
      setTimeout(() => {
        setStatus("idle");
      }, 3000);
    }
  };

  const getButtonContent = () => {
    switch (status) {
      case "sending":
        return (
          <>
            <svg
              className="w-4 h-4 animate-spin"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Enviando...
          </>
        );
      case "sent":
        return (
          <>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Enviado ✓
          </>
        );
      case "error":
        return (
          <>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Error
          </>
        );
      default:
        return (
          <>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
            Enviar
          </>
        );
    }
  };

  const getButtonStyle = () => {
    if (!modoHumano) {
      return { background: "#9CA3AF" };
    }

    switch (status) {
      case "sending":
        return { background: "linear-gradient(135deg, #6B7280 0%, #9CA3AF 100%)" };
      case "sent":
        return { background: "linear-gradient(135deg, #10B981 0%, #059669 100%)" };
      case "error":
        return { background: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)" };
      default:
        return { background: "linear-gradient(135deg, #2B82F0 0%, #15B8C9 100%)" };
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <form ref={formRef} action={handleSubmit} className="flex gap-3">
        <input type="hidden" name="conversacionId" value={conversacionId} />
        <input type="hidden" name="empresaId" value={empresaId} />

        <div className="flex-1">
          <textarea
            ref={textareaRef}
            name="contenido"
            placeholder={
              modoHumano
                ? "Escribe tu respuesta... (Enter para enviar, Shift+Enter para nueva línea)"
                : "IA está respondiendo automáticamente"
            }
            disabled={!modoHumano || status === "sending"}
            required
            rows={3}
            onKeyDown={handleKeyDown}
            className="w-full rounded-lg px-4 py-3 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed resize-none transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={!modoHumano || status === "sending"}
          className="self-end px-5 py-3 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:shadow-lg"
          style={getButtonStyle()}
        >
          {getButtonContent()}
        </button>
      </form>

      {!modoHumano && (
        <div className="mt-3 flex flex-col items-center gap-3 p-3 rounded-lg" style={{ background: "rgba(251,146,60,0.08)", border: "1px solid rgba(251,146,60,0.2)" }}>
          <p className="text-xs text-center font-medium" style={{ color: "#FB923C" }}>
            🤖 La IA está respondiendo automáticamente
          </p>
          {activarModoHumano ? (
            <form action={activarModoHumano} className="w-full flex justify-center">
              <input type="hidden" name="conversacionId" value={conversacionId} />
              <input type="hidden" name="empresaId" value={empresaId} />
              <input type="hidden" name="numeroCliente" value={numeroCliente} />
              <button
                type="submit"
                className="text-sm font-semibold px-6 py-3 rounded-lg text-white transition-all hover:shadow-lg hover:opacity-90"
                style={{ background: "#FB923C" }}
              >
                👤 Tomar control de la conversación
              </button>
            </form>
          ) : (
            <p className="text-xs text-gray-500 text-center">
              Para tomar control, actualiza la página
            </p>
          )}
        </div>
      )}

      {/* Indicador de estado adicional */}
      {status === "sent" && (
        <div className="mt-2 flex items-center justify-center gap-1 text-xs text-green-600">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          Mensaje enviado correctamente
        </div>
      )}

      {status === "error" && (
        <div className="mt-2 flex items-center justify-center gap-1 text-xs text-red-600">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          Error al enviar. Intenta de nuevo.
        </div>
      )}
    </div>
  );
}
