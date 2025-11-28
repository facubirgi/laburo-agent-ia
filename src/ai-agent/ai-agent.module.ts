import { Module } from '@nestjs/common';
import { AiAgentController } from './ai-agent.controller';
import { AiAgentService } from './ai-agent.service';
import { ConfigModule } from '@nestjs/config';

/**
 * MÓDULO DEL AGENTE IA
 *
 * Agrupa el controlador y servicio del agente
 * Importa ConfigModule para acceder a variables de entorno (.env)
 */

@Module({
  imports: [ConfigModule],
  controllers: [AiAgentController],
  providers: [AiAgentService],
  exports: [AiAgentService], // Exportamos por si otros módulos lo necesitan
})
export class AiAgentModule {}
