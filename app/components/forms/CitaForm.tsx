"use client";

import { useFormState } from "react-dom";
import { crearCita } from "@/app/actions/agenda";
import LoadingButton from "@/app/components/ui/LoadingButton";
import ErrorMessage from "@/app/components/ui/ErrorMessage";

interface CitaFormProps {
  empresaId: string;
}

export default function CitaForm({ empresaId }: CitaFormProps) {
  const [state, formAction] = useFormState(
    async (_prevState: any, formData: FormData) => {
      try {
        await crearCita(formData);
        return { success: true, error: null };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || "Error al crear cita"
        };
      }
    },
    { success: false, error: null }
  );

  return (
    <div className="bg-white rounded-xl p-6 mb-6" style={{ border: "1px solid #C8DAD6" }}>
      <h2 className="text-lg font-semibold font-sora mb-5" style={{ color: "#2D5750" }}>
        ➕ Agendar nueva cita/tarea
      </h2>

      {state.error && (
        <div className="mb-4">
          <ErrorMessage
            message={state.error}
            type="error"
          />
        </div>
      )}

      {state.success && (
        <div className="mb-4 rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2"
          style={{ background: "rgba(43, 170, 138,0.08)", border: "1px solid rgba(43, 170, 138,0.25)", color: "#2BAA8A" }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Cita creada correctamente
        </div>
      )}

      <form action={formAction} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input type="hidden" name="empresaId" value={empresaId} />

        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "#3D6E65" }}>
            Nombre del cliente <span style={{ color: "#DC2626" }}>*</span>
          </label>
          <input
            type="text"
            name="nombreCliente"
            required
            placeholder="Ej: Juan Pérez"
            className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none"
            style={{ border: "1px solid #C8DAD6", color: "#2D5750" }}
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "#3D6E65" }}>
            Teléfono (WhatsApp) <span style={{ color: "#DC2626" }}>*</span>
          </label>
          <input
            type="tel"
            name="telefono"
            required
            placeholder="+521234567890"
            className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none"
            style={{ border: "1px solid #C8DAD6", color: "#2D5750" }}
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "#3D6E65" }}>
            Fecha y hora de inicio <span style={{ color: "#DC2626" }}>*</span>
          </label>
          <input
            type="datetime-local"
            name="inicio"
            required
            className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none"
            style={{ border: "1px solid #C8DAD6", color: "#2D5750" }}
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "#3D6E65" }}>
            Duración <span style={{ color: "#DC2626" }}>*</span>
          </label>
          <select
            name="duracion"
            defaultValue="60"
            className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none"
            style={{ border: "1px solid #C8DAD6", color: "#2D5750" }}
          >
            <option value="15">15 min</option>
            <option value="30">30 min</option>
            <option value="45">45 min</option>
            <option value="60">1 hora</option>
            <option value="90">1.5 horas</option>
            <option value="120">2 horas</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-medium mb-1.5" style={{ color: "#3D6E65" }}>
            Notas adicionales
          </label>
          <textarea
            name="notas"
            rows={3}
            placeholder="Detalles de la cita o tarea..."
            className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none resize-none"
            style={{ border: "1px solid #C8DAD6", color: "#2D5750" }}
          />
        </div>

        <div className="md:col-span-2">
          <LoadingButton
            type="submit"
            className="w-full text-white text-sm font-medium py-2.5 rounded-lg transition-opacity hover:opacity-90 grad-bg"
          >
            Crear cita/tarea
          </LoadingButton>
        </div>
      </form>
    </div>
  );
}
