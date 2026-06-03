"use client";

import { useState } from "react";
import { exportToCSV, exportToJSON } from "@/lib/export";

interface ExportButtonProps {
  data: any[];
  filename: string;
  prepareData?: (data: any[]) => any[];
  variant?: "primary" | "secondary";
}

export default function ExportButton({
  data,
  filename,
  prepareData,
  variant = "secondary",
}: ExportButtonProps) {
  const [showMenu, setShowMenu] = useState(false);

  const handleExport = (format: "csv" | "json") => {
    const exportData = prepareData ? prepareData(data) : data;

    if (format === "csv") {
      exportToCSV(exportData, filename);
    } else {
      exportToJSON(exportData, filename);
    }

    setShowMenu(false);
  };

  if (data.length === 0) {
    return null;
  }

  const buttonClass =
    variant === "primary"
      ? "px-4 py-2 text-white text-sm font-medium rounded-lg transition-opacity hover:opacity-90 grad-bg"
      : "px-4 py-2 text-sm font-medium rounded-lg transition-colors"
        + " hover:bg-gray-100";

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={buttonClass}
        style={variant === "secondary" ? { color: "#41566B", border: "1px solid #E2E9F0" } : undefined}
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Exportar
        </span>
      </button>

      {showMenu && (
        <>
          {/* Overlay para cerrar al hacer click fuera */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />

          {/* Menu */}
          <div
            className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg z-20"
            style={{ border: "1px solid #E2E9F0" }}
          >
            <button
              onClick={() => handleExport("csv")}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 rounded-t-lg transition-colors"
              style={{ color: "#0E2436" }}
            >
              📊 CSV
            </button>
            <button
              onClick={() => handleExport("json")}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 rounded-b-lg transition-colors"
              style={{ color: "#0E2436", borderTop: "1px solid #F4F7FA" }}
            >
              📄 JSON
            </button>
          </div>
        </>
      )}
    </div>
  );
}
