import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * SERVICIO DE WHATSAPP (Twilio)
 *
 * Este servicio maneja:
 * 1. Envío de mensajes a WhatsApp mediante Twilio API
 * 2. Formateo de números telefónicos
 * 3. Logging de conversaciones
 */

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly twilioAccountSid: string;
  private readonly twilioAuthToken: string;
  private readonly twilioWhatsAppNumber: string;

  constructor(private configService: ConfigService) {
    // Cargar configuración de Twilio desde .env
    this.twilioAccountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID') || '';
    this.twilioAuthToken = this.configService.get<string>('TWILIO_AUTH_TOKEN') || '';
    this.twilioWhatsAppNumber = this.configService.get<string>('TWILIO_WHATSAPP_NUMBER') || '';

    // Validar que existan las credenciales
    if (!this.twilioAccountSid || !this.twilioAuthToken || !this.twilioWhatsAppNumber) {
      this.logger.warn('⚠️  Credenciales de Twilio no configuradas. WhatsApp no funcionará.');
      this.logger.warn('   Configura TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN y TWILIO_WHATSAPP_NUMBER en .env');
    } else {
      this.logger.log('✅ Servicio de WhatsApp inicializado con Twilio');
    }
  }

  /**
   * Envía un mensaje de WhatsApp a un usuario
   *
   * @param to - Número de destino (puede ser con o sin 'whatsapp:' prefix)
   * @param message - Contenido del mensaje
   * @returns Promise con el resultado del envío
   */
  async sendMessage(to: string, message: string): Promise<boolean> {
    try {
      // Formatear número (asegurar formato whatsapp:+...)
      const formattedTo = this.formatWhatsAppNumber(to);

      this.logger.log(`📤 Enviando mensaje a ${formattedTo}`);
      this.logger.debug(`   Contenido: ${message.substring(0, 100)}...`);

      // Construir URL de Twilio API
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.twilioAccountSid}/Messages.json`;

      // Preparar body para Twilio
      const params = new URLSearchParams({
        From: this.twilioWhatsAppNumber,
        To: formattedTo,
        Body: message,
      });

      // Hacer request a Twilio API con Basic Auth
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${this.twilioAccountSid}:${this.twilioAuthToken}`).toString('base64')}`,
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        this.logger.error(`❌ Error de Twilio API: ${JSON.stringify(errorData)}`);
        return false;
      }

      const data = await response.json();
      this.logger.log(`✅ Mensaje enviado exitosamente. SID: ${data.sid}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Error enviando mensaje de WhatsApp: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Formatea un número telefónico al formato de WhatsApp que Twilio espera
   *
   * Ejemplos:
   * - "+5491123456789" -> "whatsapp:+5491123456789"
   * - "whatsapp:+5491123456789" -> "whatsapp:+5491123456789" (sin cambios)
   * - "5491123456789" -> "whatsapp:+5491123456789"
   *
   * @param phoneNumber - Número a formatear
   * @returns Número en formato whatsapp:+...
   */
  formatWhatsAppNumber(phoneNumber: string): string {
    // Si ya tiene el prefijo whatsapp:, retornarlo tal cual
    if (phoneNumber.startsWith('whatsapp:')) {
      return phoneNumber;
    }

    // Si no tiene +, agregarlo
    const numberWithPlus = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

    return `whatsapp:${numberWithPlus}`;
  }

  /**
   * Extrae el número telefónico puro (sin el prefijo whatsapp:)
   *
   * @param whatsappNumber - Número en formato whatsapp:+...
   * @returns Número sin prefijo (ej: +5491123456789)
   */
  extractPhoneNumber(whatsappNumber: string): string {
    return whatsappNumber.replace('whatsapp:', '');
  }

  /**
   * Valida que las credenciales de Twilio estén configuradas
   */
  isConfigured(): boolean {
    return !!(this.twilioAccountSid && this.twilioAuthToken && this.twilioWhatsAppNumber);
  }
}
