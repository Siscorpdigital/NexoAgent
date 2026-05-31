import { prisma } from "@/lib/prisma";
import { generarRespuesta } from "@/lib/claude";
import { buscarRelevantes } from "@/lib/chunker";

const FRASES_HUMANO = [
  "quiero hablar con una persona",
  "quiero hablar con un humano",
  "quiero hablar con un agente",
  "hablar con alguien",
  "atención humana",
  "operador",
  "agente humano",
  "persona real",
];

function solicitaHumano(mensaje: string): boolean {
  const lower = mensaje.toLowerCase();
  return FRASES_HUMANO.some((frase) => lower.includes(frase));
}

// Elimina caracteres Unicode fuera del rango Latin-1 (>255) que rompen TwiML
function limpiar(texto: string): string {
  let resultado = "";
  for (const char of texto) {
    if (char.charCodeAt(0) <= 255) {
      resultado += char;
    }
  }
  return resultado.trim();
}

function twiml(mensaje: string): Response {
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${limpiar(mensaje)}</Message></Response>`;
  const bytes = new TextEncoder().encode(xml);
  return new Response(bytes, {
    status: 200,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN ?? "nexoagent_token";

  if (mode === "subscribe" && token === verifyToken) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Verificación fallida", { status: 403 });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const body = formData.get("Body") as string;
    const from = formData.get("From") as string;
    const to = formData.get("To") as string;

    if (!body || !from) {
      return new Response("<Response/>", {
        status: 200,
        headers: { "Content-Type": "text/xml" },
      });
    }

    console.log(`📨 Mensaje de ${from}: ${body}`);

    const numeroCliente = from.replace("whatsapp:", "");
    const numeroEmpresa = to.replace("whatsapp:", "");

    const empresa = await prisma.empresa.findFirst({
      where: { telefonoWhatsapp: numeroEmpresa },
      include: { documentos: true, memoria: true },
    });

    if (!empresa) {
      console.log("⚠️ No se encontró empresa para el número:", numeroEmpresa);
      return twiml("Hola, este servicio no está configurado todavía.");
    }

    // Busca o crea el contacto en el CRM automáticamente
    let contacto = await prisma.contacto.findUnique({
      where: { empresaId_telefono: { empresaId: empresa.id, telefono: numeroCliente } },
    });
    if (!contacto) {
      contacto = await prisma.contacto.create({
        data: { empresaId: empresa.id, telefono: numeroCliente },
      });
    }

    let conversacion = await prisma.conversacion.findFirst({
      where: { empresaId: empresa.id, numeroCliente },
    });

    if (!conversacion) {
      conversacion = await prisma.conversacion.create({
        data: { empresaId: empresa.id, numeroCliente, contactoId: contacto.id },
      });
    }

    await prisma.mensaje.create({
      data: {
        conversacionId: conversacion.id,
        contenido: body,
        rol: "CLIENTE",
      },
    });

    if (solicitaHumano(body)) {
      await prisma.conversacion.update({
        where: { id: conversacion.id },
        data: { modoHumano: true },
      });
      return twiml(
        "Entendido, en breve un agente humano te atenderá. Por favor espera."
      );
    }

    if (conversacion.modoHumano) {
      return twiml("Un agente humano revisará tu mensaje pronto.");
    }

    // Obtiene los 10 mensajes MÁS RECIENTES y los ordena cronológicamente
    const historial = (
      await prisma.mensaje.findMany({
        where: { conversacionId: conversacion.id },
        orderBy: { creadoEn: "desc" },
        take: 10,
      })
    ).reverse();

    // Busca los chunks más relevantes para la pregunta del cliente
    const todosLosChunks = await prisma.documentoChunk.findMany({
      where: { empresaId: empresa.id },
      select: { id: true, contenido: true, indice: true },
    });

    const chunksRelevantes = buscarRelevantes(body, todosLosChunks);

    const respuestaIA = await generarRespuesta(
      empresa.nombre,
      historial,
      empresa.promptSistema,
      chunksRelevantes.length > 0
        ? [{ nombre: "Base de conocimiento", contenido: chunksRelevantes.join("\n\n---\n\n") }]
        : empresa.documentos,
      empresa.memoria
    );

    await prisma.mensaje.create({
      data: {
        conversacionId: conversacion.id,
        contenido: respuestaIA,
        rol: "ASISTENTE",
      },
    });

    console.log(`🤖 Respuesta IA: ${respuestaIA}`);

    return twiml(respuestaIA);
  } catch (error) {
    console.error("Error en webhook:", error);
    return twiml("Lo siento, ocurrió un error. Intenta de nuevo.");
  }
}
