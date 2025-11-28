import { Controller, Post, Body, Logger, HttpCode, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';
import { WhatsAppService } from './whatsapp.service';
import { AiAgentService } from '../ai-agent/ai-agent.service';
import type { IncomingWhatsAppMessageDto } from './dto/whatsapp-message.dto';

/**
 * CONTROLADOR DE WEBHOOK WHATSAPP (Twilio)
 *
 * Este controlador maneja los webhooks de Twilio cuando:
 * 1. Un usuario envía un mensaje al número de WhatsApp
 * 2. Twilio recibe el mensaje y lo reenvía a este endpoint
 * 3. Procesamos el mensaje con el AI Agent
 * 4. Enviamos la respuesta de vuelta al usuario
 *
 * Configuración en Twilio:
 * 1. Ir a: https://console.twilio.com/us1/develop/sms/settings/whatsapp-sandbox
 * 2. En "WHEN A MESSAGE COMES IN", configurar:
 *    - URL: https://tu-dominio.com/whatsapp/webhook
 *    - Method: POST
 */

@Controller('whatsapp')
export class WhatsAppController {
  private readonly logger = new Logger(WhatsAppController.name);

  constructor(
    private readonly whatsappService: WhatsAppService,
    private readonly aiAgentService: AiAgentService,
  ) {
    this.logger.log('🔗 Webhook de WhatsApp configurado en /whatsapp/webhook');
  }

  /**
   * POST /whatsapp/webhook
   *
   * Endpoint que Twilio llama cuando recibe un mensaje de WhatsApp
   *
   * Flujo:
   * 1. Twilio recibe mensaje del usuario
   * 2. Twilio hace POST a este endpoint con los datos del mensaje
   * 3. Extraemos el número del usuario y el mensaje
   * 4. Procesamos el mensaje con el AI Agent
   * 5. Enviamos la respuesta de vuelta al usuario vía Twilio API
   * 6. Respondemos 200 OK a Twilio para confirmar recepción
   *
   * IMPORTANTE: Este endpoint debe responder en menos de 15 segundos
   * o Twilio marcará el webhook como fallido.
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleIncomingMessage(
    @Body() incomingMessage: IncomingWhatsAppMessageDto,
    @Res() response: Response,
  ) {
    try {
      this.logger.log('📨 Mensaje recibido de WhatsApp (Twilio webhook)');
      this.logger.debug(`   From: ${incomingMessage.From}`);
      this.logger.debug(`   Body: ${incomingMessage.Body}`);
      this.logger.debug(`   Profile: ${incomingMessage.ProfileName || 'N/A'}`);

      // Validar que el mensaje tenga contenido
      if (!incomingMessage.Body || incomingMessage.Body.trim() === '') {
        this.logger.warn('⚠️  Mensaje vacío recibido, ignorando');
        return response.status(HttpStatus.OK).send('OK');
      }

      // Extraer datos del mensaje
      const userPhoneNumber = incomingMessage.From; // Formato: whatsapp:+5491123456789
      const userMessage = incomingMessage.Body.trim();
      const userName = incomingMessage.ProfileName || 'Usuario';

      // Usar el número de teléfono como userId (sin el prefijo 'whatsapp:')
      const userId = this.whatsappService.extractPhoneNumber(userPhoneNumber);

      this.logger.log(`👤 Usuario: ${userName} (${userId})`);
      this.logger.log(`💬 Mensaje: "${userMessage}"`);

      // Responder inmediatamente a Twilio para evitar timeout
      // Procesaremos el mensaje en background
      response.status(HttpStatus.OK).send('OK');

      // Procesar mensaje con el AI Agent (en background)
      this.processMessageAsync(userId, userMessage, userPhoneNumber).catch((error) => {
        this.logger.error(`Error procesando mensaje async: ${error.message}`, error.stack);
      });
    } catch (error) {
      this.logger.error(`❌ Error en webhook de WhatsApp: ${error.message}`, error.stack);

      // Siempre responder 200 OK a Twilio, incluso si hay error interno
      // Esto evita que Twilio reintente el webhook múltiples veces
      if (!response.headersSent) {
        response.status(HttpStatus.OK).send('OK');
      }
    }
  }

  /**
   * Procesa el mensaje de forma asíncrona con el AI Agent
   * y envía la respuesta al usuario
   */
  private async processMessageAsync(
    userId: string,
    userMessage: string,
    whatsappNumber: string,
  ): Promise<void> {
    try {
      this.logger.log(`🤖 Procesando mensaje con AI Agent...`);

      // 1. Enviar mensaje al AI Agent
      const agentResponse = await this.aiAgentService.processMessage(userId, userMessage);

      this.logger.log(`✅ AI Agent respondió: "${agentResponse.substring(0, 100)}..."`);

      // 2. Enviar respuesta del agente al usuario vía WhatsApp
      const sent = await this.whatsappService.sendMessage(whatsappNumber, agentResponse);

      if (sent) {
        this.logger.log(`✅ Respuesta enviada exitosamente a ${userId}`);
      } else {
        this.logger.error(`❌ Error enviando respuesta a ${userId}`);
      }
    } catch (error) {
      this.logger.error(`❌ Error en processMessageAsync: ${error.message}`, error.stack);

      // En caso de error, intentar enviar mensaje de error al usuario
      try {
        await this.whatsappService.sendMessage(
          whatsappNumber,
          'Lo siento, tuve un problema procesando tu mensaje. Por favor, intenta nuevamente.',
        );
      } catch (sendError) {
        this.logger.error(`❌ No se pudo enviar mensaje de error: ${sendError.message}`);
      }
    }
  }

  /**
   * POST /whatsapp/status
   *
   * Endpoint para verificar que el servicio de WhatsApp esté configurado
   * Útil para debugging y health checks
   */
  @Post('status')
  @HttpCode(HttpStatus.OK)
  getStatus() {
    const isConfigured = this.whatsappService.isConfigured();

    return {
      service: 'WhatsApp (Twilio)',
      status: isConfigured ? 'configured' : 'not_configured',
      configured: isConfigured,
      message: isConfigured
        ? 'Servicio de WhatsApp listo para recibir mensajes'
        : 'Faltan configurar credenciales de Twilio en .env',
      webhookUrl: '/whatsapp/webhook',
      timestamp: new Date().toISOString(),
    };
  }
}
