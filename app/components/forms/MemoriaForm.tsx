"use client";

import { useFormState } from "react-dom";
import { agregarMemoria } from "@/app/actions/memoria";
import LoadingButton from "@/app/components/ui/LoadingButton";
import ErrorMessage from "@/app/components/ui/ErrorMessage";

interface MemoriaFormProps {
  empresaId: string;
  categoria: string;
  color: string;
  placeholder: string;
  placeholderValor: string;
}

export default function MemoriaForm({
  empresaId,
  categoria,
  color,
  placeholder,
  placeholderValor,
}: MemoriaFormProps) {
  const [state, formAction] = useFormState(
    async (_prevState: any, formData: FormData) => {
      try {
        await agregarMemoria(formData);
        return { success: true, error: null };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || "Error al agregar memoria"
        };
      }
    },
    { success: false, error: null }
  );

  return (
    <form action={formAction} className="p-4 space-y-2" style={{ borderTop: "1px solid #F4F7F6", background: "#FAFCFE" }}>
      <input type="hidden" name="empresaId" value={empresaId} />
      <input type="hidden" name="categoria" value={categoria} />

      {state.error && (
        <ErrorMessage
          message={state.error}
          type="error"
        />
      )}

      <input
        name="clave"
        type="text"
        required
        placeholder={placeholder}
        className="w-full rounded-lg px-3 py-2 text-xs focus:outline-none"
        style={{ border: "1px solid #C8DAD6", color: "#2D5750" }}
      />
      <input
        name="valor"
        type="text"
        required
        placeholder={placeholderValor}
        className="w-full rounded-lg px-3 py-2 text-xs focus:outline-none"
        style={{ border: "1px solid #C8DAD6", color: "#2D5750" }}
      />
      <LoadingButton
        type="submit"
        className="w-full text-xs font-medium py-2 rounded-lg transition-opacity hover:opacity-90"
        style={{ background: color, color: "white" }}
      >
        + Agregar
      </LoadingButton>
    </form>
  );
}
