"use client";

import ExportButton from "@/app/components/actions/ExportButton";
import { prepareContactosForExport } from "@/lib/export";

interface CRMHeaderProps {
  contactosCount: number;
  contactos: any[];
  empresaId: string;
}

export default function CRMHeader({ contactosCount, contactos, empresaId }: CRMHeaderProps) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold font-sora" style={{ color: "#0E2436" }}>
          CRM
        </h1>
        <p className="text-sm mt-1" style={{ color: "#73869A" }}>
          {contactosCount} contacto{contactosCount !== 1 ? "s" : ""} · Leads, clientes y proveedores
        </p>
      </div>

      <ExportButton
        data={contactos}
        filename={`contactos-${new Date().toISOString().split('T')[0]}`}
        prepareData={prepareContactosForExport}
        variant="secondary"
      />
    </div>
  );
}
