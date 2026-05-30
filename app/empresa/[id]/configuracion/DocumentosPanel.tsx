"use client";

import { useState, useRef } from "react";

type Documento = {
  id: string;
  nombre: string;
  tipo: string;
  creadoEn: Date;
};

export default function DocumentosPanel({
  empresaId,
  documentosIniciales,
}: {
  empresaId: string;
  documentosIniciales: Documento[];
}) {
  const [documentos, setDocumentos] = useState(documentosIniciales);
  const [subiendo, setSubiendo] = useState(false);
  const [modo, setModo] = useState<"archivo" | "texto">("archivo");
  const [textoDirecto, setTextoDirecto] = useState("");
  const [nombreTexto, setNombreTexto] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function subirArchivo(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubiendo(true);

    const form = new FormData();

    if (modo === "archivo" && fileRef.current?.files?.[0]) {
      form.append("archivo", fileRef.current.files[0]);
      form.append("nombre", fileRef.current.files[0].name);
    } else if (modo === "texto" && textoDirecto.trim()) {
      form.append("texto", textoDirecto);
      form.append("nombre", nombreTexto || "Texto sin nombre");
    } else {
      setSubiendo(false);
      return;
    }

    const res = await fetch(`/api/empresa/${empresaId}/documentos`, {
      method: "POST",
      body: form,
    });

    if (res.ok) {
      window.location.reload();
    } else {
      alert("Error al subir el documento. Intenta de nuevo.");
    }
    setSubiendo(false);
  }

  async function eliminarDocumento(docId: string) {
    if (!confirm("¿Eliminar este documento?")) return;
    await fetch(`/api/empresa/${empresaId}/documentos/${docId}`, {
      method: "DELETE",
    });
    setDocumentos((prev) => prev.filter((d) => d.id !== docId));
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="font-semibold text-gray-800 mb-1">Base de conocimiento</h2>
      <p className="text-xs text-gray-400 mb-5">
        Sube PDFs, listas de precios, FAQs o pega texto. La IA usará esta
        información para responder con datos reales del negocio.
      </p>

      {/* Selector de modo */}
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setModo("archivo")}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
            modo === "archivo"
              ? "bg-blue-600 text-white border-blue-600"
              : "text-gray-600 border-gray-300 hover:bg-gray-50"
          }`}
        >
          📎 Subir archivo
        </button>
        <button
          type="button"
          onClick={() => setModo("texto")}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
            modo === "texto"
              ? "bg-blue-600 text-white border-blue-600"
              : "text-gray-600 border-gray-300 hover:bg-gray-50"
          }`}
        >
          ✏️ Pegar texto
        </button>
      </div>

      <form onSubmit={subirArchivo} className="space-y-3 mb-6">
        {modo === "archivo" ? (
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.txt"
            required
            className="w-full text-sm text-gray-600 border border-gray-300 rounded-lg px-3 py-2 file:mr-3 file:text-xs file:bg-blue-50 file:text-blue-600 file:border-0 file:rounded file:px-2 file:py-1"
          />
        ) : (
          <>
            <input
              type="text"
              value={nombreTexto}
              onChange={(e) => setNombreTexto(e.target.value)}
              placeholder="Nombre del documento (ej: Lista de precios)"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              value={textoDirecto}
              onChange={(e) => setTextoDirecto(e.target.value)}
              rows={5}
              required
              placeholder="Pega aquí el contenido: precios, horarios, FAQs, descripción de servicios..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </>
        )}
        <button
          type="submit"
          disabled={subiendo}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium py-2 px-5 rounded-lg transition-colors"
        >
          {subiendo ? "Subiendo..." : "Agregar a la base de conocimiento"}
        </button>
      </form>

      {/* Lista de documentos */}
      {documentos.length === 0 ? (
        <p className="text-xs text-gray-400">
          Aún no hay documentos. Agrega el primero arriba.
        </p>
      ) : (
        <ul className="space-y-2">
          {documentos.map((d) => (
            <li
              key={d.id}
              className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2"
            >
              <span className="text-base">{d.tipo === "pdf" ? "📄" : "📝"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 truncate">{d.nombre}</p>
                <p className="text-xs text-gray-400">
                  {new Date(d.creadoEn).toLocaleDateString("es-MX")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => eliminarDocumento(d.id)}
                className="text-xs text-red-400 hover:text-red-600 transition-colors"
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
