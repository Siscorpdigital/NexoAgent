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

export type ToolResult = {
  tipo: "crear_cita";
  nombreCliente: string;
  telefono: string;
  fecha: string;
  hora: string;
  duracion: number;
  notas?: string;
} | {
  tipo: "verificar_disponibilidad";
  fecha: string;
  hora?: string;
  duracion: number;
  preferencia?: "mañana" | "tarde" | "noche";
} | null;

export async function generarRespuesta(
  nombreEmpresa: string,
  historial: MensajeHistorial[],
  promptPersonalizado?: string | null,
  documentos?: { nombre: string; contenido: string }[],
  memoria?: EntradaMemoria[]
): Promise<{ respuesta: string; tool?: ToolResult }> {
  const mensajes = historial.map((m) => ({
    role: m.rol === "CLIENTE" ? ("user" as const) : ("assistant" as const),
    content: m.contenido,
  }));

  const basePrompt = promptPersonalizado?.trim()
    ? promptPersonalizado.trim()
    : `Eres el asistente virtual de "${nombreEmpresa}" 👋

PERSONALIDAD:
- Habla como una persona real, cálida y cercana
- Usa el nombre del cliente cuando lo sepas
- Sé conversacional, no robotizado
- Usa emojis con moderación y cuando sea apropiado
- Muestra entusiasmo genuino por ayudar

TONO:
- Amable y profesional, pero relajado
- Breve pero completo (2-3 líneas máximo)
- Empático y paciente
- Positivo y proactivo

EJEMPLOS DE RESPUESTAS NATURALES:
❌ "Entendido. Procedo a agendar."
✅ "¡Perfecto! Te voy a apartar ese horario 😊"

❌ "Nombre requerido para continuar."
✅ "¿Me podrías decir tu nombre para confirmar la cita?"

❌ "Cita confirmada para 2026-06-01 14:00"
✅ "Listo Juan, quedas agendado para mañana a las 2pm. ¡Nos vemos! 👍"

CUANDO NO SEPAS ALGO:
En lugar de decir "No tengo esa información", di algo como:
"Mmm, esa info no la tengo a la mano. ¿Quieres que te conecte con alguien del equipo?"

IMPORTANTE:
- SIEMPRE responde en español
- Si el cliente parece molesto, sé extra empático
- Confirma los detalles importantes repitiendo en tus palabras
- Termina con algo positivo o útil`;

  const seccionMemoria = formatearMemoria(memoria ?? []);

  const seccionDocumentos =
    documentos && documentos.length > 0
      ? `\n\n--- BASE DE CONOCIMIENTO ---\n` +
        documentos.map((d) => `## ${d.nombre}\n${d.contenido}`).join("\n\n") +
        `\n--- FIN ---`
      : "";

  const systemPrompt = basePrompt + seccionMemoria + seccionDocumentos;

  const tools: Anthropic.Tool[] = [
    {
      name: "verificar_disponibilidad",
      description: "Verifica disponibilidad antes de agendar. Úsala cuando el cliente mencione una fecha/hora. Es tu manera de 'revisar la agenda' antes de confirmar. Responde de forma natural como: 'Déjame revisar la agenda...' o 'Voy a ver qué tengo disponible...'",
      input_schema: {
        type: "object" as const,
        properties: {
          fecha: {
            type: "string",
            description: "Fecha en formato YYYY-MM-DD (ej: 2026-06-01)",
          },
          hora: {
            type: "string",
            description: "Hora específica en formato HH:MM 24h (ej: 14:30). Opcional si solo quieres ver disponibilidad general.",
          },
          duracion: {
            type: "number",
            description: "Duración estimada en minutos (default: 60)",
          },
          preferencia: {
            type: "string",
            enum: ["mañana", "tarde", "noche"],
            description: "Preferencia horaria del cliente: mañana (8-12), tarde (12-18), noche (18+)",
          },
        },
        required: ["fecha"],
      },
    },
    {
      name: "crear_cita",
      description: "Crea/agenda la cita cuando tengas TODOS los datos y hayas verificado disponibilidad. Di algo natural como: '¡Perfecto! Te aparto ese horario' o 'Listo, ya quedaste agendado'. Usa el nombre del cliente en tu respuesta.",
      input_schema: {
        type: "object" as const,
        properties: {
          nombreCliente: {
            type: "string",
            description: "Nombre completo del cliente",
          },
          telefono: {
            type: "string",
            description: "Número de teléfono del cliente (incluye código de país)",
          },
          fecha: {
            type: "string",
            description: "Fecha en formato YYYY-MM-DD (ej: 2026-06-01)",
          },
          hora: {
            type: "string",
            description: "Hora en formato HH:MM 24h (ej: 14:30)",
          },
          duracion: {
            type: "number",
            description: "Duración en minutos (default: 60)",
          },
          notas: {
            type: "string",
            description: "Detalles adicionales o motivo de la cita/tarea",
          },
        },
        required: ["nombreCliente", "telefono", "fecha", "hora"],
      },
    },
  ];

  const respuesta = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 800,
    temperature: 0.8,
    system: systemPrompt,
    messages: mensajes,
    tools,
  });

  // Verificar si Claude quiere usar una tool
  const toolUse = respuesta.content.find((block) => block.type === "tool_use");

  if (toolUse && toolUse.type === "tool_use") {
    if (toolUse.name === "verificar_disponibilidad") {
      const input = toolUse.input as {
        fecha: string;
        hora?: string;
        duracion?: number;
        preferencia?: "mañana" | "tarde" | "noche";
      };

      const textoBloque = respuesta.content.find((b) => b.type === "text");
      const textoRespuesta = textoBloque && textoBloque.type === "text"
        ? textoBloque.text
        : "Déjame verificar la disponibilidad...";

      return {
        respuesta: textoRespuesta,
        tool: {
          tipo: "verificar_disponibilidad",
          fecha: input.fecha,
          hora: input.hora,
          duracion: input.duracion || 60,
          preferencia: input.preferencia,
        },
      };
    }

    if (toolUse.name === "crear_cita") {
      const input = toolUse.input as {
        nombreCliente: string;
        telefono: string;
        fecha: string;
        hora: string;
        duracion?: number;
        notas?: string;
      };

      // Obtener el texto de respuesta si existe
      const textoBloque = respuesta.content.find((b) => b.type === "text");
      const textoRespuesta = textoBloque && textoBloque.type === "text"
        ? textoBloque.text
        : `Perfecto, he agendado tu cita para el ${input.fecha} a las ${input.hora}. Te llegará una confirmación.`;

      return {
        respuesta: textoRespuesta,
        tool: {
          tipo: "crear_cita",
          nombreCliente: input.nombreCliente,
          telefono: input.telefono,
          fecha: input.fecha,
          hora: input.hora,
          duracion: input.duracion || 60,
          notas: input.notas,
        },
      };
    }
  }

  const bloque = respuesta.content[0];
  if (bloque.type === "text") {
    return { respuesta: bloque.text };
  }

  return { respuesta: "Gracias por tu mensaje, en breve te atendemos." };
}
