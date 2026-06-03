"use client";

import ExportButton from "@/app/components/actions/ExportButton";
import { prepareConversacionesForExport } from "@/lib/export";

interface ConversacionesHeaderProps {
  conversacionesCount: number;
  conversaciones: any[];
}

export default function ConversacionesHeader({
  conversacionesCount,
  conversaciones,
}: ConversacionesHeaderProps) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold font-sora" style={{ color: "#0E2436" }}>
          Conversaciones
        </h1>
        <p className="text-sm mt-1" style={{ color: "#73869A" }}>
          {conversacionesCount} conversacion{conversacionesCount !== 1 ? "es" : ""} · Todos los chats recibidos por WhatsApp
        </p>
      </div>

      <ExportButton
        data={conversaciones}
        filename={`conversaciones-${new Date().toISOString().split('T')[0]}`}
        prepareData={prepareConversacionesForExport}
        variant="secondary"
      />
    </div>
  );
}
