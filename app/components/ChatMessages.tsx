"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { formatChatTimestamp } from "@/lib/utils";

interface Mensaje {
  id: string;
  rol: "CLIENTE" | "ASISTENTE";
  contenido: string;
  creadoEn: Date;
}

interface ChatMessagesProps {
  mensajes: Mensaje[];
  autoRefresh?: boolean;
  refreshInterval?: number; // en milisegundos
}

export default function ChatMessages({
  mensajes,
  autoRefresh = true,
  refreshInterval = 5000,
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Auto-scroll al final cuando cambian los mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  // Auto-refresh con polling
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      router.refresh(); // Revalida la página
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, router]);

  if (mensajes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full py-10">
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg
              className="w-6 h-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <p className="text-sm text-gray-400">Sin mensajes en esta conversación</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {mensajes.map((m) => (
        <div
          key={m.id}
          className={`flex ${m.rol === "CLIENTE" ? "justify-start" : "justify-end"}`}
        >
          <div
            className={`max-w-[85%] sm:max-w-md lg:max-w-lg ${
              m.rol === "CLIENTE" ? "items-start" : "items-end"
            } flex flex-col gap-1`}
          >
            <div
              className={`px-3 py-2.5 sm:px-4 sm:py-3 rounded-2xl text-sm leading-relaxed ${
                m.rol === "CLIENTE"
                  ? "bg-gray-100 text-gray-800 rounded-tl-sm"
                  : "bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-tr-sm shadow-sm"
              }`}
            >
              {m.contenido}
            </div>
            <p className="text-xs text-gray-400 px-1">
              {m.rol === "CLIENTE" ? "Cliente" : "Asistente"} ·{" "}
              {formatChatTimestamp(m.creadoEn)}
            </p>
          </div>
        </div>
      ))}
      {/* Referencia invisible al final para el scroll automático */}
      <div ref={messagesEndRef} />
    </>
  );
}
