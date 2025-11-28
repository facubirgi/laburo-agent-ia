import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { tools } from './tools';
import { ConfigService } from '@nestjs/config';

/**
 * SERVICIO DEL AGENTE IA
 *
 * Este servicio maneja toda la lógica del agente:
 * 1. Inicializa Gemini con los tools disponibles
 * 2. Mantiene historial de conversación por usuario
 * 3. Procesa mensajes y ejecuta function calls
 * 4. Llama a la API REST cuando Gemini lo solicita
 */

@Injectable()
export class AiAgentService {
  private readonly logger = new Logger(AiAgentService.name);
  private genAI: GoogleGenerativeAI;
  private model: any;

  // Historial de conversación por usuario (en memoria)
  // En producción, esto debería estar en Redis o base de datos
  private conversationHistory: Map<string, any[]> = new Map();

  // URL base de nuestra API
  private readonly apiBaseUrl = 'http://localhost:3000';

  constructor(private configService: ConfigService) {
    // Inicializar Gemini con la API Key del .env
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY no configurada en .env');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);

    // Configurar el modelo Gemini con function calling
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      tools: tools as any, // Nuestras herramientas
      systemInstruction: `Eres un asistente de ventas experto en ropa y productos textiles.

Tu trabajo es ayudar a los clientes a:
1. Explorar el catálogo de productos (pantalones, camisetas, etc.)
2. Buscar productos por color, talla, tipo o categoría
3. Ver información detallada de productos incluyendo precios según cantidad
4. Crear carritos de compra
5. Modificar carritos (cambiar cantidades, eliminar productos)

CATÁLOGO DISPONIBLE:
Tenemos: Pantalones, Camisetas, Chaquetas, Sudaderas, Camisas y Faldas
Colores: Negro, Blanco, Azul, Rojo, Verde, Gris, Amarillo
Talles: S, M, L, XL, XXL
Categorías: Casual, Formal, Deportivo

INFORMACIÓN IMPORTANTE SOBRE PRECIOS:
- Tenemos 3 niveles de precio según cantidad:
  * 50-99 unidades: precio50u
  * 100-199 unidades: precio100u
  * 200+ unidades: precio200u
- Siempre menciona estos descuentos por volumen al usuario
- Los precios están en pesos argentinos

REGLAS DE COMPORTAMIENTO:
- Sé amigable, claro y conciso
- IMPORTANTE: Por WhatsApp hay límite de 1600 caracteres, sé BREVE
- Si el usuario pregunta de forma genérica ("productos", "qué tenés"), NO busques productos. En su lugar, preguntale qué tipo de prenda busca, color o talle preferido
- Cuando muestres productos, lista máximo 5-6 con formato compacto
- Si hay más de 6, muestra solo 5-6 y dice "encontré X más, ¿querés filtrar por color/talle?"
- Formato compacto: "Nombre - desde $X (50u)"
- Guía al usuario a ser específico para ayudarlo mejor

EJEMPLOS DE INTERACCIÓN:
Usuario: "Hola, qué productos tenés?"
Tú: "¡Hola! Tengo pantalones, camisetas, chaquetas, sudaderas, camisas y faldas en varios colores y talles. ¿Qué tipo de prenda te interesa?"

Usuario: "Busco pantalones verdes"
Tú: [USAR searchProducts con "pantalon verde"]
"Encontré pantalones verdes:
- Pantalón Verde XXL - desde $1058 (50u)
- Pantalón Verde L - desde $1017 (50u)
- Pantalón Verde M - desde $1338 (50u)
¿Te interesa alguno? ¿Qué cantidad necesitás?"

Usuario: "Pantalones"
Tú: [USAR searchProducts con "pantalon"]
"Tengo varios pantalones. ¿Preferís algún color o talle en particular?"

NO uses emojis a menos que el usuario los use primero.
NO describas cada producto en detalle, solo listá opciones de forma compacta.
SÉ CONSULTIVO: ayudá al usuario a encontrar exactamente lo que busca.`,
    });

    this.logger.log('✅ Agente IA inicializado con Gemini 1.5 Flash');
  }

  /**
   * Procesa un mensaje del usuario
   * Este es el método principal que maneja toda la conversación
   */
  async processMessage(userId: string, message: string): Promise<string> {
    this.logger.log(`📩 Mensaje de ${userId}: ${message}`);

    try {
      // 1. Obtener o crear historial del usuario
      if (!this.conversationHistory.has(userId)) {
        this.conversationHistory.set(userId, []);
      }

      const userHistory = this.conversationHistory.get(userId)!;

      // 2. Crear sesión de chat con historial
      const chat = this.model.startChat({
        history: userHistory,
      });

      // 3. Enviar mensaje del usuario a Gemini
      let result = await chat.sendMessage(message);
      let response = result.response;

      // 4. Manejar function calls (si Gemini decide usar herramientas)
      // Este loop se ejecuta mientras Gemini quiera llamar funciones
      while (response.candidates[0].content.parts.some((part) => part.functionCall)) {
        const functionCall = response.candidates[0].content.parts.find(
          (part) => part.functionCall,
        ).functionCall;

        this.logger.log(`🔧 Gemini llamó a: ${functionCall.name}`);
        this.logger.debug(`   Argumentos: ${JSON.stringify(functionCall.args)}`);

        // 5. Ejecutar la función solicitada
        const functionResponse = await this.executeFunction(
          functionCall.name,
          functionCall.args,
        );

        this.logger.debug(`   Resultado: ${JSON.stringify(functionResponse).substring(0, 200)}...`);

        // 6. Enviar el resultado de la función de vuelta a Gemini
        result = await chat.sendMessage([
          {
            functionResponse: {
              name: functionCall.name,
              response: functionResponse,
            },
          },
        ]);

        response = result.response;
      }

      // 7. Obtener la respuesta final de texto
      const finalText = response.text();

      // 8. Guardar historial (últimos 20 mensajes para no exceder contexto)
      userHistory.push(
        { role: 'user', parts: [{ text: message }] },
        { role: 'model', parts: [{ text: finalText }] },
      );

      // Mantener solo últimos 20 mensajes
      if (userHistory.length > 20) {
        userHistory.splice(0, userHistory.length - 20);
      }

      this.logger.log(`💬 Respuesta generada: ${finalText.substring(0, 100)}...`);

      return finalText;
    } catch (error) {
      this.logger.error(`❌ Error procesando mensaje: ${error.message}`, error.stack);
      return 'Lo siento, tuve un problema procesando tu mensaje. ¿Podrías intentar de nuevo?';
    }
  }

  /**
   * Ejecuta una función (tool) solicitada por Gemini
   * Aquí es donde llamamos a nuestra API REST
   */
  private async executeFunction(
    functionName: string,
    args: any,
  ): Promise<any> {
    try {
      switch (functionName) {
        case 'searchProducts':
          return await this.searchProducts(args.query);

        case 'getProductDetail':
          return await this.getProductDetail(args.productId);

        case 'createCart':
          return await this.createCart(args.items);

        case 'updateCart':
          return await this.updateCart(args.cartId, args.items);

        default:
          throw new Error(`Función desconocida: ${functionName}`);
      }
    } catch (error) {
      this.logger.error(`Error ejecutando ${functionName}: ${error.message}`);
      return {
        error: true,
        message: error.message,
      };
    }
  }

  /**
   * TOOL IMPLEMENTATIONS
   * Estas funciones llaman a nuestra API REST
   */

  // Buscar productos
  private async searchProducts(query: string) {
    const url = `${this.apiBaseUrl}/products?q=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    const products = await response.json();

    return {
      success: true,
      count: products.length,
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price50u: p.price50u,
        price100u: p.price100u,
        price200u: p.price200u,
        stock: p.stock,
        available: p.available,
        color: p.color,
        size: p.size,
        category: p.category,
      })),
    };
  }

  // Obtener detalle de producto
  private async getProductDetail(productId: number) {
    const url = `${this.apiBaseUrl}/products/${productId}`;
    const response = await fetch(url);

    if (!response.ok) {
      return {
        error: true,
        message: `Producto #${productId} no encontrado`,
      };
    }

    const product = await response.json();

    return {
      success: true,
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        price50u: product.price50u,
        price100u: product.price100u,
        price200u: product.price200u,
        stock: product.stock,
        available: product.available,
        color: product.color,
        size: product.size,
        type: product.type,
        category: product.category,
      },
    };
  }

  // Crear carrito
  private async createCart(items: Array<{ product_id: number; qty: number }>) {
    const url = `${this.apiBaseUrl}/carts`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        error: true,
        message: error.message || 'Error creando carrito',
      };
    }

    const cart = await response.json();

    return {
      success: true,
      cart: {
        id: cart.id,
        items: cart.items,
        total: cart.total,
        created_at: cart.created_at,
      },
    };
  }

  // Actualizar carrito
  private async updateCart(
    cartId: number,
    items: Array<{ product_id: number; qty: number }>,
  ) {
    const url = `${this.apiBaseUrl}/carts/${cartId}`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        error: true,
        message: error.message || 'Error actualizando carrito',
      };
    }

    const cart = await response.json();

    return {
      success: true,
      cart: {
        id: cart.id,
        items: cart.items,
        total: cart.total,
        updated_at: cart.updated_at,
      },
    };
  }

  /**
   * Limpiar historial de un usuario (útil para testing)
   */
  clearHistory(userId: string) {
    this.conversationHistory.delete(userId);
    this.logger.log(`🗑️  Historial limpiado para usuario ${userId}`);
  }
}
