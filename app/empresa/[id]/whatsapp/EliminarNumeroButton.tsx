"use client";

import { eliminarNumeroWhatsApp } from "@/app/actions/whatsapp";

export default function EliminarNumeroButton({
  empresaId,
  numeroId,
  telefono,
}: {
  empresaId: string;
  numeroId: string;
  telefono: string;
}) {
  async function handleSubmit(formData: FormData) {
    if (!confirm(`¿Seguro que deseas eliminar el número ${telefono}? Esta acción no se puede deshacer.`)) {
      return;
    }
    await eliminarNumeroWhatsApp(formData);
  }

  return (
    <form action={handleSubmit}>
      <input type="hidden" name="empresaId" value={empresaId} />
      <input type="hidden" name="numeroId" value={numeroId} />
      <button
        type="submit"
        className="w-full px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-medium"
      >
        Eliminar
      </button>
    </form>
  );
}
