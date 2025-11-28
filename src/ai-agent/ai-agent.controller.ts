import { Controller, Post, Body, HttpCode, HttpStatus, Delete, Param } from '@nestjs/common';
import { AiAgentService } from './ai-agent.service';

/**
 * CONTROLADOR DEL AGENTE IA
 *
 * Expone endpoints HTTP para interactuar con el agente:
 * - POST /ai-agent/chat - Enviar mensaje al agente
 * - DELETE /ai-agent/history/:userId - Limpiar historial (útil para testing)
 */

// DTO para el request
class ChatRequest {
  userId: string; // ID del usuario (puede ser número de teléfono)
  message: string; // Mensaje del usuario
}

// DTO para el response
class ChatResponse {
  userId: string;
  userMessage: string;
  agentResponse: string;
  timestamp: string;
}

@Controller('ai-agent')
export class AiAgentController {
  constructor(private readonly aiAgentService: AiAgentService) {}

  /**
   * POST /ai-agent/chat
   *
   * Endpoint principal para chatear con el agente
   *
   * Request body:
   * {
   *   "userId": "user123",
   *   "message": "Busco pantalones verdes"
   * }
   *
   * Response:
   * {
   *   "userId": "user123",
   *   "userMessage": "Busco pantalones verdes",
   *   "agentResponse": "¡Claro! Déjame buscar...",
   *   "timestamp": "2024-01-15T10:30:00.000Z"
   * }
   */
  @Post('chat')
  @HttpCode(HttpStatus.OK)
  async chat(@Body() request: ChatRequest): Promise<ChatResponse> {
    const { userId, message } = request;

    // Validación básica
    if (!userId || !message) {
      throw new Error('userId y message son requeridos');
    }

    // Procesar mensaje con el agente
    const agentResponse = await this.aiAgentService.processMessage(userId, message);

    return {
      userId,
      userMessage: message,
      agentResponse,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * DELETE /ai-agent/history/:userId
   *
   * Limpia el historial de conversación de un usuario
   * Útil para testing o para empezar una nueva conversación
   *
   * Ejemplo: DELETE /ai-agent/history/user123
   */
  @Delete('history/:userId')
  @HttpCode(HttpStatus.OK)
  clearHistory(@Param('userId') userId: string): { message: string } {
    this.aiAgentService.clearHistory(userId);
    return {
      message: `Historial limpiado para usuario ${userId}`,
    };
  }
}
