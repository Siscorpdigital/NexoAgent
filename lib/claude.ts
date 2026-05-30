import Anthropic from "@anthropic-ai/sdk";
import { Rol } from "@/app/generated/prisma/client";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

type MensajeHistorial = {
  rol: Rol;
  contenido: string;
};

export async function generarRespuesta(
  nombreEmpresa: string,
  historial: MensajeHistorial[],
  promptPersonalizado?: string | null,
  documentos?: { nombre: string; contenido: string }[]
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

  const seccionDocumentos =
    documentos && documentos.length > 0
      ? `\n\n--- INFORMACIÓN DEL NEGOCIO ---\nUsa estos documentos para responder preguntas del cliente:\n\n` +
        documentos
          .map((d) => `## ${d.nombre}\n${d.contenido}`)
          .join("\n\n") +
        `\n--- FIN DE LA INFORMACIÓN ---`
      : "";

  const systemPrompt = basePrompt + seccionDocumentos;

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
