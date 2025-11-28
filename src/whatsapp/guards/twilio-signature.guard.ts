import { Injectable, CanActivate, ExecutionContext, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * GUARD DE VALIDACIÓN DE WEBHOOK TWILIO
 *
 * Este guard valida que los webhooks realmente vengan de Twilio
 * verificando la firma X-Twilio-Signature
 *
 * Docs: https://www.twilio.com/docs/usage/webhooks/webhooks-security
 *
 * IMPORTANTE: Para desarrollo/testing, puedes desactivar esta validación
 * seteando TWILIO_VALIDATE_WEBHOOK=false en .env
 */

@Injectable()
export class TwilioSignatureGuard implements CanActivate {
  private readonly logger = new Logger(TwilioSignatureGuard.name);
  private readonly authToken: string;
  private readonly validateWebhook: boolean;

  constructor(private configService: ConfigService) {
    this.authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN') || '';
    this.validateWebhook = this.configService.get<string>('TWILIO_VALIDATE_WEBHOOK') !== 'false';

    if (!this.validateWebhook) {
      this.logger.warn('⚠️  Validación de webhook de Twilio DESACTIVADA (para desarrollo)');
    } else if (!this.authToken) {
      this.logger.error('❌ TWILIO_AUTH_TOKEN no está configurado en .env');
      throw new Error('TWILIO_AUTH_TOKEN es requerido cuando la validación está activada');
    }
  }

  canActivate(context: ExecutionContext): boolean {
    // Si la validación está desactivada (modo desarrollo), permitir todos los requests
    if (!this.validateWebhook) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const twilioSignature = request.headers['x-twilio-signature'];

    if (!twilioSignature) {
      this.logger.warn('⚠️  Webhook sin firma de Twilio detectado');
      throw new UnauthorizedException('Missing Twilio signature');
    }

    // Construir URL completa del webhook
    const url = `${request.protocol}://${request.get('host')}${request.originalUrl}`;

    // Validar firma
    const isValid = this.validateTwilioSignature(url, request.body, twilioSignature);

    if (!isValid) {
      this.logger.error('❌ Firma de Twilio inválida - posible intento de ataque');
      throw new UnauthorizedException('Invalid Twilio signature');
    }

    this.logger.debug('✅ Firma de Twilio validada correctamente');
    return true;
  }

  /**
   * Valida la firma de Twilio usando el algoritmo HMAC-SHA1
   *
   * @param url - URL completa del webhook
   * @param params - Parámetros del POST body
   * @param signature - Firma enviada por Twilio
   * @returns true si la firma es válida
   */
  private validateTwilioSignature(url: string, params: any, signature: string): boolean {
    // Construir data string ordenando parámetros alfabéticamente
    const data = Object.keys(params)
      .sort()
      .reduce((acc, key) => acc + key + params[key], url);

    // Calcular HMAC-SHA1
    const expectedSignature = crypto
      .createHmac('sha1', this.authToken)
      .update(Buffer.from(data, 'utf-8'))
      .digest('base64');

    // Comparar firmas de forma segura (timing-safe)
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  }
}
