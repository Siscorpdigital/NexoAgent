"use client";

import { useState, useRef } from "react";

type Documento = {
  id: string;
  nombre: string;
  tipo: string;
  creadoEn: Date;
  _count: { chunks: number };
};

export default function ConocimientoPanel({
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
  const [arrastrandoEncima, setArrastrandoEncima] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function subirDocumento(archivo?: File) {
    setSubiendo(true);
    const form = new FormData();

    if (archivo) {
      form.append("archivo", archivo);
      form.append("nombre", archivo.name);
    } else if (modo === "archivo" && fileRef.current?.files?.[0]) {
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
      alert("Error al procesar el documento.");
    }
    setSubiendo(false);
  }

  async function eliminarDocumento(docId: string) {
    if (!confirm("¿Eliminar este documento y todos sus fragmentos?")) return;
    await fetch(`/api/empresa/${empresaId}/documentos/${docId}`, { method: "DELETE" });
    setDocumentos((prev) => prev.filter((d) => d.id !== docId));
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setArrastrandoEncima(false);
    const file = e.dataTransfer.files[0];
    if (file) subirDocumento(file);
  }

  return (
    <div className="space-y-5">
      {/* Zona de subida */}
      <div className="bg-white rounded-xl p-6" style={{ border: "1px solid #C8DAD6" }}>
        <h2 className="font-semibold font-sora text-sm mb-1" style={{ color: "#2D5750" }}>
          Agregar documento
        </h2>
        <p className="text-xs mb-5" style={{ color: "#5C7872" }}>
          Los documentos se trocean automáticamente en fragmentos. La IA buscará los más relevantes para cada pregunta.
        </p>

        <div className="flex gap-2 mb-4">
          {[{ key: "archivo", label: "📎 Subir archivo" }, { key: "texto", label: "✏️ Pegar texto" }].map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setModo(m.key as "archivo" | "texto")}
              className="text-xs px-3 py-1.5 rounded-full border transition-colors"
              style={{
                background: modo === m.key ? "#2D5750" : "white",
                color: modo === m.key ? "white" : "#3D6E65",
                borderColor: modo === m.key ? "#2D5750" : "#C8DAD6",
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        {modo === "archivo" ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setArrastrandoEncima(true); }}
            onDragLeave={() => setArrastrandoEncima(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className="rounded-xl p-8 text-center cursor-pointer transition-colors"
            style={{
              border: `2px dashed ${arrastrandoEncima ? "#2D5750" : "#C8DAD6"}`,
              background: arrastrandoEncima ? "rgba(43,130,240,0.04)" : "#F4F7F6",
            }}
          >
            <div className="w-10 h-10 rounded-xl grad-bg mx-auto mb-3 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            </div>
            <p className="text-sm font-medium" style={{ color: "#2D5750" }}>
              {arrastrandoEncima ? "Suelta el archivo aquí" : "Arrastra un archivo o haz clic"}
            </p>
            <p className="text-xs mt-1" style={{ color: "#5C7872" }}>PDF o TXT · se indexa automáticamente</p>
            <input ref={fileRef} type="file" accept=".pdf,.txt" className="hidden" onChange={() => subirDocumento()} />
          </div>
        ) : (
          <div className="space-y-3">
            <input
              type="text"
              value={nombreTexto}
              onChange={(e) => setNombreTexto(e.target.value)}
              placeholder="Nombre del documento (ej: Lista de precios mayo 2026)"
              className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
              style={{ border: "1px solid #C8DAD6", color: "#2D5750" }}
            />
            <textarea
              value={textoDirecto}
              onChange={(e) => setTextoDirecto(e.target.value)}
              rows={6}
              placeholder="Pega aquí el contenido: precios, horarios, FAQs, descripción de servicios..."
              className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none resize-none"
              style={{ border: "1px solid #C8DAD6", color: "#2D5750" }}
            />
            <button
              onClick={() => subirDocumento()}
              disabled={subiendo || !textoDirecto.trim()}
              className="text-white text-sm font-medium py-2.5 px-5 rounded-lg transition-opacity hover:opacity-90 disabled:opacity-40 grad-bg"
            >
              {subiendo ? "Indexando..." : "Agregar a la base de conocimiento"}
            </button>
          </div>
        )}

        {subiendo && modo === "archivo" && (
          <p className="text-xs text-center mt-3" style={{ color: "#2D5750" }}>
            Procesando e indexando fragmentos...
          </p>
        )}
      </div>

      {/* Lista de documentos */}
      {documentos.length > 0 && (
        <div className="bg-white rounded-xl" style={{ border: "1px solid #C8DAD6" }}>
          <div className="px-5 py-4" style={{ borderBottom: "1px solid #F4F7F6" }}>
            <h2 className="font-semibold font-sora text-sm" style={{ color: "#2D5750" }}>
              Documentos indexados ({documentos.length})
            </h2>
          </div>
          <div className="divide-y" style={{ borderColor: "#F4F7F6" }}>
            {documentos.map((d) => (
              <div key={d.id} className="flex items-center gap-4 px-5 py-4">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-lg"
                  style={{ background: "#F4F7F6" }}>
                  {d.tipo === "pdf" ? "📄" : "📝"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "#2D5750" }}>{d.nombre}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#5C7872" }}>
                    {new Date(d.creadoEn).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {d._count.chunks > 0 ? (
                    <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium"
                      style={{ background: "rgba(43, 170, 138,0.08)", color: "#2BAA8A", border: "1px solid rgba(43, 170, 138,0.2)" }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#2BAA8A" }}></span>
                      {d._count.chunks} fragmentos
                    </span>
                  ) : (
                    <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: "#FEF3C7", color: "#92400E" }}>
                      Sin fragmentos
                    </span>
                  )}
                  <button
                    onClick={() => eliminarDocumento(d.id)}
                    className="text-xs transition-colors hover:underline"
                    style={{ color: "#DC2626" }}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
