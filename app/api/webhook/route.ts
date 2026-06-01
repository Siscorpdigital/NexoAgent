import { prisma } from "@/lib/prisma";
import { generarRespuesta } from "@/lib/claude";
import { buscarRelevantes } from "@/lib/chunker";
import { evaluarAutomatizaciones } from "@/lib/automatizaciones";
import { setCredentials, createEvent } from "@/lib/google-calendar";
import { verificarDisponibilidad, sugerirHorarios } from "@/lib/disponibilidad";

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
      include: {
        documentos: true,
        memoria: true,
        automatizaciones: { where: { activa: true } },
      },
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

    // Evalúa si alguna automatización se activa
    const totalMensajes = await prisma.mensaje.count({
      where: { conversacionId: conversacion.id },
    });
    const esPrimerMensaje = totalMensajes === 1; // solo el que acabamos de guardar

    const autoActivada = evaluarAutomatizaciones(
      empresa.automatizaciones,
      body,
      esPrimerMensaje
    );

    if (autoActivada) {
      await prisma.automatizacion.update({
        where: { id: autoActivada.id },
        data: { ejecuciones: { increment: 1 } },
      });
      await prisma.mensaje.create({
        data: {
          conversacionId: conversacion.id,
          contenido: autoActivada.mensaje,
          rol: "ASISTENTE",
        },
      });
      return twiml(autoActivada.mensaje);
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

    const resultado = await generarRespuesta(
      empresa.nombre,
      historial,
      empresa.promptSistema,
      chunksRelevantes.length > 0
        ? [{ nombre: "Base de conocimiento", contenido: chunksRelevantes.join("\n\n---\n\n") }]
        : empresa.documentos,
      empresa.memoria
    );

    // Si el agente quiere verificar disponibilidad
    if (resultado.tool?.tipo === "verificar_disponibilidad") {
      const { fecha, hora, duracion, preferencia } = resultado.tool;

      if (hora) {
        // Verificar hora específica
        const { disponible } = await verificarDisponibilidad(
          empresa.id,
          fecha,
          hora,
          duracion
        );

        let respuestaDisponibilidad: string;
        if (disponible) {
          respuestaDisponibilidad = `Perfecto, el ${fecha} a las ${hora} sí está disponible 😊 ¿Me confirmas tu nombre para apartar el horario?`;
        } else {
          respuestaDisponibilidad = `Ay, justo a las ${hora} ya tengo ocupado ese día 😅 ¿Te vendría bien en otro horario?`;
        }

        await prisma.mensaje.create({
          data: {
            conversacionId: conversacion.id,
            contenido: respuestaDisponibilidad,
            rol: "ASISTENTE",
          },
        });

        return twiml(respuestaDisponibilidad);
      } else {
        // Sugerir horarios disponibles
        const sugerencias = await sugerirHorarios(empresa.id, fecha, duracion, preferencia);

        let respuestaSugerencias: string;
        if (sugerencias.length > 0) {
          const horariosFormateados = sugerencias.map(h => {
            const [hora] = h.split(':');
            const horaNum = parseInt(hora);
            if (horaNum < 12) return `${h} (mañana)`;
            if (horaNum < 18) return `${h} (tarde)`;
            return `${h} (noche)`;
          });
          respuestaSugerencias = `Mira, tengo libre el ${fecha} a las ${horariosFormateados.join(', o a las ')}. ¿Cuál te acomoda mejor?`;
        } else {
          respuestaSugerencias = `Uy, ese día está full 😅 ¿Te sirve otro día?`;
        }

        await prisma.mensaje.create({
          data: {
            conversacionId: conversacion.id,
            contenido: respuestaSugerencias,
            rol: "ASISTENTE",
          },
        });

        return twiml(respuestaSugerencias);
      }
    }

    // Si el agente creó una cita, verificar disponibilidad primero
    if (resultado.tool?.tipo === "crear_cita") {
      const { nombreCliente, telefono, fecha, hora, duracion, notas } = resultado.tool;

      // Verificar disponibilidad antes de crear
      const { disponible } = await verificarDisponibilidad(
        empresa.id,
        fecha,
        hora,
        duracion
      );

      if (!disponible) {
        // Rechazar la cita y sugerir alternativas
        const sugerencias = await sugerirHorarios(empresa.id, fecha, duracion);
        let respuestaConflicto = `${nombreCliente}, justo a esa hora ya tengo ocupado 😅`;

        if (sugerencias.length > 0) {
          respuestaConflicto += ` Pero tengo libre a las ${sugerencias.join(" o a las ")}. ¿Te sirve alguno?`;
        } else {
          respuestaConflicto += ` ¿Qué tal otro día? Dime cuándo y lo revisamos.`;
        }

        await prisma.mensaje.create({
          data: {
            conversacionId: conversacion.id,
            contenido: respuestaConflicto,
            rol: "ASISTENTE",
          },
        });

        console.log(`⚠️ Cita rechazada por conflicto: ${fecha} ${hora}`);
        return twiml(respuestaConflicto);
      }

      // Combinar fecha y hora
      const fechaHora = new Date(`${fecha}T${hora}:00`);
      const fin = new Date(fechaHora.getTime() + duracion * 60 * 1000);

      // Buscar o crear contacto
      let contacto = await prisma.contacto.findUnique({
        where: { empresaId_telefono: { empresaId: empresa.id, telefono } },
      });

      if (!contacto) {
        contacto = await prisma.contacto.create({
          data: {
            empresaId: empresa.id,
            telefono,
            nombre: nombreCliente,
          },
        });
      }

      // Crear evento en Google Calendar si está conectado
      let googleEventId: string | null = null;
      let googleCalendarLink: string | null = null;

      if (empresa.googleAccessToken && empresa.googleCalendarId) {
        try {
          const auth = setCredentials(empresa.googleAccessToken, empresa.googleRefreshToken || undefined);
          const event = await createEvent(auth, empresa.googleCalendarId, {
            summary: `Cita/Tarea: ${nombreCliente}`,
            description: `Tel: ${telefono}\n${notas || "Agendado por WhatsApp"}`,
            start: fechaHora,
            end: fin,
          });
          googleEventId = event.id;
          googleCalendarLink = event.link;
          console.log(`✅ Evento creado en Google Calendar: ${event.link}`);
        } catch (error) {
          console.error("Error creando evento en Google Calendar:", error);
        }
      }

      // Crear la cita
      await prisma.cita.create({
        data: {
          empresaId: empresa.id,
          contactoId: contacto.id,
          nombreCliente,
          telefono,
          inicio: fechaHora,
          fin,
          notas: notas || `Agendado por WhatsApp`,
          googleEventId,
          googleCalendarLink,
        },
      });

      console.log(`📅 Cita creada automáticamente: ${nombreCliente} - ${fecha} ${hora}`);
    }

    await prisma.mensaje.create({
      data: {
        conversacionId: conversacion.id,
        contenido: resultado.respuesta,
        rol: "ASISTENTE",
      },
    });

    console.log(`🤖 Respuesta IA: ${resultado.respuesta}`);

    return twiml(resultado.respuesta);
  } catch (error) {
    console.error("Error en webhook:", error);
    return twiml("Lo siento, ocurrió un error. Intenta de nuevo.");
  }
}
