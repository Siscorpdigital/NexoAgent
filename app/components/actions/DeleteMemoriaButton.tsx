"use client";

import { useState } from "react";
import ConfirmDialog from "@/app/components/ui/ConfirmDialog";
import { eliminarMemoria } from "@/app/actions/memoria";

interface DeleteMemoriaButtonProps {
  memoriaId: string;
  empresaId: string;
  clave: string;
}

export default function DeleteMemoriaButton({
  memoriaId,
  empresaId,
  clave,
}: DeleteMemoriaButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append("id", memoriaId);
    formData.append("empresaId", empresaId);

    await eliminarMemoria(formData);
    setIsLoading(false);
    setShowDialog(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowDialog(true)}
        className="text-xs transition-colors hover:underline"
        style={{ color: "#DC2626" }}
      >
        ×
      </button>

      <ConfirmDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        onConfirm={handleDelete}
        title="¿Eliminar entrada de memoria?"
        message={`Se eliminará "${clave}" de la memoria del negocio. La IA ya no tendrá acceso a esta información.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        loading={isLoading}
      />
    </>
  );
}
