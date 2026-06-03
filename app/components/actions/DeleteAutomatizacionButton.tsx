"use client";

import { useState } from "react";
import ConfirmDialog from "@/app/components/ui/ConfirmDialog";
import { eliminarAutomatizacion } from "@/app/actions/automatizaciones";

interface DeleteAutomatizacionButtonProps {
  automatizacionId: string;
  empresaId: string;
  nombre: string;
}

export default function DeleteAutomatizacionButton({
  automatizacionId,
  empresaId,
  nombre,
}: DeleteAutomatizacionButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append("id", automatizacionId);
    formData.append("empresaId", empresaId);

    await eliminarAutomatizacion(formData);
    setIsLoading(false);
    setShowDialog(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowDialog(true)}
        className="text-xs font-medium transition-colors hover:underline"
        style={{ color: "#DC2626" }}
      >
        Eliminar
      </button>

      <ConfirmDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        onConfirm={handleDelete}
        title="¿Eliminar automatización?"
        message={`Se eliminará "${nombre}" y dejará de ejecutarse automáticamente. Puedes volver a crearla después si lo necesitas.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="warning"
        loading={isLoading}
      />
    </>
  );
}
