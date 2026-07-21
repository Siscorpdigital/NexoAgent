import { logger } from "@/lib/logger";

const GRAPH_VERSION = "v21.0";

/**
 * Envía un mensaje de texto por WhatsApp usando la Cloud API de Meta (Graph API).
 *
 * @param phoneNumberId  ID del número emisor (viene en el webhook de Meta como
 *                       metadata.phone_number_id). Si no se pasa, usa la variable
 *                       de entorno WHATSAPP_PHONE_NUMBER_ID (modo un solo número).
 * @param to             Número del destinatario (formato internacional sin +, ej. 58412...).
 * @param texto          Cuerpo del mensaje (admite emojis/UTF-8).
 * @returns true si Meta aceptó el envío.
 */
export async function enviarMensajeWhatsApp(
  phoneNumberId: string | undefined,
  to: string,
  texto: string,
): Promise<boolean> {
  const token = process.env.WHATSAPP_TOKEN?.trim();
  const pnid = (phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID || "").trim();

  if (!token || !pnid) {
    logger.error("[whatsapp-meta] Falta WHATSAPP_TOKEN o WHATSAPP_PHONE_NUMBER_ID");
    return false;
  }

  try {
    const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${pnid}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: { preview_url: false, body: texto },
      }),
    });

    if (!res.ok) {
      const detalle = await res.text();
      logger.error("[whatsapp-meta] Error al enviar mensaje:", detalle);
      return false;
    }
    return true;
  } catch (error) {
    logger.error("[whatsapp-meta] Excepción al enviar mensaje:", error);
    return false;
  }
}
