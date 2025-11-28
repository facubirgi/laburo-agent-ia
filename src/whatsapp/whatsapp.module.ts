import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppService } from './whatsapp.service';
import { AiAgentModule } from '../ai-agent/ai-agent.module';

/**
 * MÓDULO DE WHATSAPP
 *
 * Este módulo encapsula toda la funcionalidad relacionada con WhatsApp:
 * - Recepción de mensajes (webhook)
 * - Envío de mensajes (Twilio API)
 * - Integración con el AI Agent
 */

@Module({
  imports: [
    ConfigModule, // Para acceder a variables de entorno
    AiAgentModule, // Para poder usar el AiAgentService
  ],
  controllers: [WhatsAppController],
  providers: [WhatsAppService],
  exports: [WhatsAppService], // Exportar por si otros módulos necesitan enviar mensajes
})
export class WhatsAppModule {}
