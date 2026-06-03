"use client";

import { useState } from "react";
import ConfirmDialog from "@/app/components/ui/ConfirmDialog";
import { eliminarContacto } from "@/app/actions/crm";

interface DeleteContactButtonProps {
  contactoId: string;
  empresaId: string;
  contactoNombre: string;
}

export default function DeleteContactButton({
  contactoId,
  empresaId,
  contactoNombre,
}: DeleteContactButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append("id", contactoId);
    formData.append("empresaId", empresaId);

    await eliminarContacto(formData);
    // La redirección la maneja el server action
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowDialog(true)}
        className="text-xs font-medium transition-colors hover:underline"
        style={{ color: "#DC2626" }}
      >
        Eliminar contacto
      </button>

      <ConfirmDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        onConfirm={handleDelete}
        title="¿Eliminar contacto?"
        message={`Se eliminará ${contactoNombre} y todo su historial de conversaciones. Esta acción no se puede deshacer.`}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        variant="danger"
        loading={isLoading}
      />
    </>
  );
}
