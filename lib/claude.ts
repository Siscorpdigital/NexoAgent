import Anthropic from "@anthropic-ai/sdk";
import { Rol } from "@/app/generated/prisma/client";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

type MensajeHistorial = {
  rol: Rol;
  contenido: string;
};

type EntradaMemoria = {
  categoria: string;
  clave: string;
  valor: string;
};

const LABEL_CATEGORIA: Record<string, string> = {
  PRODUCTO: "Productos y Servicios",
  HORARIO:  "Horarios",
  PRECIO:   "Precios y Tarifas",
  POLITICA: "Políticas",
};

function formatearMemoria(memoria: EntradaMemoria[]): string {
  if (memoria.length === 0) return "";

  const porCategoria: Record<string, EntradaMemoria[]> = {};
  for (const e of memoria) {
    if (!porCategoria[e.categoria]) porCategoria[e.categoria] = [];
    porCategoria[e.categoria].push(e);
  }

  const secciones = Object.entries(porCategoria).map(([cat, items]) => {
    const titulo = LABEL_CATEGORIA[cat] ?? cat;
    const lineas = items.map((i) => `  • ${i.clave}: ${i.valor}`).join("\n");
    return `${titulo}:\n${lineas}`;
  });

  return (
    "\n\n--- DATOS EXACTOS DEL NEGOCIO (usa estos datos siempre) ---\n" +
    secciones.join("\n\n") +
    "\n--- FIN DE DATOS ---"
  );
}

export async function generarRespuesta(
  nombreEmpresa: string,
  historial: MensajeHistorial[],
  promptPersonalizado?: string | null,
  documentos?: { nombre: string; contenido: string }[],
  memoria?: EntradaMemoria[]
): Promise<string> {
  const mensajes = historial.map((m) => ({
    role: m.rol === "CLIENTE" ? ("user" as const) : ("assistant" as const),
    content: m.contenido,
  }));

  const basePrompt = promptPersonalizado?.trim()
    ? promptPersonalizado.trim()
    : `Eres un asistente virtual de WhatsApp para "${nombreEmpresa}".
Responde siempre en español, de forma amable, breve y útil.
Si no sabes algo específico del negocio, ofrece conectar al cliente con un agente humano.`;

  const seccionMemoria = formatearMemoria(memoria ?? []);

  const seccionDocumentos =
    documentos && documentos.length > 0
      ? `\n\n--- BASE DE CONOCIMIENTO ---\n` +
        documentos.map((d) => `## ${d.nombre}\n${d.contenido}`).join("\n\n") +
        `\n--- FIN ---`
      : "";

  const systemPrompt = basePrompt + seccionMemoria + seccionDocumentos;

  const respuesta = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 500,
    system: systemPrompt,
    messages: mensajes,
  });

  const bloque = respuesta.content[0];
  if (bloque.type === "text") return bloque.text;
  return "Gracias por tu mensaje, en breve te atendemos.";
}
