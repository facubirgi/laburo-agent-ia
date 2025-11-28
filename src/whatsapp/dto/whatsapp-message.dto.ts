/**
 * DTO para mensajes entrantes de WhatsApp (Twilio webhook)
 *
 * Estructura que Twilio envía cuando un usuario manda un mensaje
 * Docs: https://www.twilio.com/docs/whatsapp/api#receiving-messages
 */

export class IncomingWhatsAppMessageDto {
  // ID del mensaje
  MessageSid?: string;

  // Número del remitente (formato: whatsapp:+5491123456789)
  From: string;

  // Número del destinatario (tu número de Twilio)
  To: string;

  // Contenido del mensaje
  Body: string;

  // Nombre del perfil del usuario (si está disponible)
  ProfileName?: string;

  // ID de la cuenta de Twilio
  AccountSid?: string;

  // Cantidad de media adjunta
  NumMedia?: string;

  // Tipo de mensaje
  MessageType?: string;

  // Timestamp del mensaje
  Timestamp?: string;
}

/**
 * DTO para mensajes salientes de WhatsApp (enviar a Twilio API)
 */
export class OutgoingWhatsAppMessageDto {
  // Número de destino (formato: whatsapp:+5491123456789)
  to: string;

  // Contenido del mensaje
  body: string;

  // Número de origen (tu número de Twilio)
  from: string;
}
