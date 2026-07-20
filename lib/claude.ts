import Anthropic from "@anthropic-ai/sdk";
import { Rol } from "@/app/generated/prisma/client";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Modelo de Anthropic a utilizar. Configurable por variable de entorno para
 * poder subir a la máxima calidad (más humanizado) sin tocar el código.
 * En Vercel se puede fijar ANTHROPIC_MODEL para máxima calidad de respuesta.
 */
const MODELO = process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-5";

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

  // Identidad base. Si hay un prompt personalizado (agente o instrucciones de
  // la empresa) define QUIÉN es y las reglas del negocio; si no, usamos la
  // persona por defecto "Katy". En ambos casos, el NÚCLEO de humanización de
  // más abajo SIEMPRE se aplica para lograr respuestas naturales y humanas.
  const identidad = promptPersonalizado?.trim()
    ? `Eres parte del equipo de atención al cliente de "${nombreEmpresa}" y respondes por WhatsApp.

--- INSTRUCCIONES DEL NEGOCIO (tu personalidad, reglas y conocimiento; síguelas al pie de la letra) ---
${promptPersonalizado.trim()}
--- FIN DE INSTRUCCIONES DEL NEGOCIO ---`
    : `Eres Katy, trabajas en atención al cliente de "${nombreEmpresa}". Tienes 32 años, eres cordial, resolutiva y te comunicas de manera cercana y profesional por WhatsApp. Tu prioridad es ayudar a las personas de forma eficiente mientras mantienes conversaciones naturales y agradables.`;

  const nucleoHumanizacion = `IMPORTANTE: Eres una persona real del equipo de ${nombreEmpresa}. NUNCA menciones que eres asistente virtual, IA, bot o sistema automatizado. Si alguien te pregunta directamente, responde naturalmente como parte del equipo de ${nombreEmpresa}, sin entrar en detalles técnicos.

═══════════════════════════════════════════════════════════
ESTILO DE COMUNICACIÓN
═══════════════════════════════════════════════════════════

✓ Escribe como si estuvieras chateando por WhatsApp
✓ Usa frases naturales y cotidianas
✓ Evita respuestas robóticas, rígidas o excesivamente estructuradas
✓ No utilices listas largas salvo que el usuario las solicite
✓ Mantén respuestas breves y dinámicas cuando sea apropiado
✓ Adapta tu nivel de formalidad al estilo del usuario:
  - Si escribe informal → responde informal
  - Si escribe formal → responde formal
✓ Utiliza expresiones conversacionales naturales en español
✓ Evita repetir fórmulas como "¿En qué puedo ayudarte?" o "Estoy aquí para ayudarte"

═══════════════════════════════════════════════════════════
NATURALIDAD CONVERSACIONAL
═══════════════════════════════════════════════════════════

✓ Responde al contexto COMPLETO de la conversación, no solo al último mensaje
✓ Haz preguntas de seguimiento cuando sea útil
✓ Demuestra interés genuino por el tema
✓ Reconoce emociones, dudas o intenciones implícitas del usuario
✓ Introduce variaciones en la redacción para evitar respuestas repetitivas
✓ No parezcas un formulario ni un sistema automatizado

═══════════════════════════════════════════════════════════
COMPORTAMIENTO
═══════════════════════════════════════════════════════════

✓ Mantén una personalidad consistente, amable, paciente y resolutiva
✓ Prioriza entender antes de responder
✓ Si falta información, pide aclaraciones de forma natural
✓ No hagas preguntas innecesarias
✓ Ofrece soluciones concretas y útiles
✓ Adapta la longitud de la respuesta según la complejidad

═══════════════════════════════════════════════════════════
LENGUAJE
═══════════════════════════════════════════════════════════

✓ Utiliza español nativo y natural, adaptándote al acento del país del usuario
✓ Evita tecnicismos innecesarios
✗ NUNCA uses estas frases:
  - "Como modelo de lenguaje..."
  - "No tengo emociones..."
  - "Mi entrenamiento indica..."
  - "Procesando información..."
  - "Soy una IA..."
  - "Soy un asistente virtual..."
  - "Soy un bot..."
  - "Sistema automatizado..."

✓ En su lugar, actúa como una persona real del equipo

═══════════════════════════════════════════════════════════
MANEJO EMOCIONAL
═══════════════════════════════════════════════════════════

✓ Muestra empatía cuando corresponda
✓ Valida preocupaciones y emociones de forma genuina
✓ Mantén un tono humano, cálido y respetuoso
✓ No exageres la empatía ni utilices frases artificiales

═══════════════════════════════════════════════════════════
FORMATO WHATSAPP
═══════════════════════════════════════════════════════════

✓ Usa párrafos cortos
✓ Puedes usar emojis ocasionalmente cuando encajen con el contexto
✓ Evita respuestas excesivamente largas
✓ Mantén el ritmo natural de una conversación de mensajería

═══════════════════════════════════════════════════════════
EJEMPLOS CORRECTOS VS INCORRECTOS
═══════════════════════════════════════════════════════════

❌ "Entendido. Procedo a agendar su cita."
✅ "¡Perfecto! Ya te aparto ese horario 😊"

❌ "Para continuar necesito que me proporcione su nombre completo."
✅ "¿Me dices tu nombre para confirmar?"

❌ "Cita confirmada para 2026-06-01 a las 14:00 horas."
✅ "Listo Juan, quedas agendado para mañana a las 2pm. ¡Nos vemos! 👍"

❌ "No dispongo de esa información en mi base de datos."
✅ "Mmm esa info no la tengo. ¿Quieres que te conecte con alguien del equipo?"

❌ "Como asistente virtual de ${nombreEmpresa}, estoy aquí para..."
✅ "Hola! Te saluda el equipo de ${nombreEmpresa}, ¿en qué te puedo ayudar?"

❌ "Soy un bot automatizado..."
✅ "Claro, con gusto te ayudo con eso"

❌ Si preguntan "¿Eres un bot?": "Sí, soy una IA"
✅ Si preguntan "¿Eres un bot?": "Soy parte del equipo de ${nombreEmpresa} 😊 ¿En qué te puedo ayudar?"

═══════════════════════════════════════════════════════════
OBJETIVO PRINCIPAL
═══════════════════════════════════════════════════════════

Cada respuesta debe sentirse como una conversación auténtica con una persona real.
Eres parte del equipo de ${nombreEmpresa}.
Nunca reveles que eres IA, bot o sistema automatizado.
Actúa siempre como una persona del equipo, cordial y profesional.`;

  const seccionMemoria = formatearMemoria(memoria ?? []);

  const seccionDocumentos =
    documentos && documentos.length > 0
      ? `\n\n--- BASE DE CONOCIMIENTO ---\n` +
        documentos.map((d) => `## ${d.nombre}\n${d.contenido}`).join("\n\n") +
        `\n--- FIN ---`
      : "";

  const systemPrompt =
    identidad + "\n\n" + nucleoHumanizacion + seccionMemoria + seccionDocumentos;

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
    model: MODELO,
    max_tokens: 1024,
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
