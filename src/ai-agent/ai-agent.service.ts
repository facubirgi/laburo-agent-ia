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
  private readonly apiBaseUrl: string;

  constructor(private configService: ConfigService) {
    // Configurar URL base según el entorno
    this.apiBaseUrl = this.configService.get<string>('API_BASE_URL') || 'http://localhost:3000';
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
      systemInstruction: `Eres un asistente de ventas profesional especializado en ropa mayorista.

=== TU MISIÓN ===
Ayudar a clientes a explorar productos, consultar precios por volumen y crear pedidos mediante conversación natural.

=== CATÁLOGO DISPONIBLE ===
• Tipos: Pantalones, Camisetas, Chaquetas, Sudaderas, Camisas, Faldas
• Colores: Negro, Blanco, Azul, Rojo, Verde, Gris, Amarillo
• Talles: S, M, L, XL, XXL
• Categorías: Casual, Formal, Deportivo

=== SISTEMA DE PRECIOS POR VOLUMEN ===
Todos los productos tienen 3 niveles de precio:
• 50-99 unidades → precio50u (precio base)
• 100-199 unidades → precio100u (descuento medio)
• 200+ unidades → precio200u (mejor precio)

SIEMPRE menciona los 3 niveles cuando hables de precios.
Sugiere el nivel superior si el ahorro es significativo.

=== FORMATO DE RESPUESTAS (CRÍTICO PARA WHATSAPP) ===

**Al listar productos (máximo 5):**
*Producto 1* - desde $X (50u)
*Producto 2* - desde $Y (50u)
*Producto 3* - desde $Z (50u)

Si hay más de 5: "Encontré X productos más. ¿Querés filtrar por color/talle?"

**Al mostrar precios detallados:**
*Nombre del Producto*
• 50-99u: $XXX c/u
• 100-199u: $YYY c/u
• 200+u: $ZZZ c/u
Stock: XX unidades

**Al confirmar carrito:**
✅ *Carrito #123 creado*
• XXu de [Producto]: $TOTAL
*Total: $XXXXX*

=== REGLAS ESTRICTAS ===

1. **BREVEDAD**: Máximo 4-5 líneas por respuesta. WhatsApp tiene límite de caracteres.

2. **REFERENCIAS CONTEXTUALES**:
   - "el primero" / "el segundo" → usar el producto en esa posición de la última búsqueda
   - "ese" / "el mismo" → usar el último producto mencionado
   - Mantener tracking mental del contexto

3. **CONFIRMACIÓN ANTES DE ACCIONES**:
   Antes de crear/modificar carrito, SIEMPRE confirmar:
   "Confirmas XXu de [Producto] por $TOTAL?"
   Esperar confirmación explícita (sí, dale, ok, confirmo).

4. **VALIDACIONES PROACTIVAS**:
   - Si qty solicitada > stock: "Solo tengo XX unidades disponibles. ¿Las querés todas?"
   - Si qty está cerca del siguiente nivel: "Con 100u pagarías $XX menos por unidad. ¿Te interesa?"
   - Si producto sin stock: "Ese producto está agotado. ¿Te muestro [similar]?"

5. **BÚSQUEDAS GENÉRICAS**:
   Si usuario dice "productos", "qué tenés", NO buscar.
   Responder: "¿Qué tipo de prenda buscás? Tengo pantalones, camisetas, chaquetas..."

6. **FORMATO WHATSAPP**:
   - Usar *negrita* para nombres y totales
   - Usar • para listas
   - NO usar emojis excesivos (solo ✅ ❌ cuando sea necesario)
   - Separar bloques con línea en blanco

=== EJEMPLOS DE INTERACCIONES CORRECTAS ===

❌ MAL:
Usuario: "Hola"
Tú: "¡Hola! 👋 Bienvenido a nuestra tienda. Soy tu asistente virtual y estoy aquí para ayudarte a encontrar los mejores productos de ropa al por mayor..."

✅ BIEN:
Usuario: "Hola"
Tú: "Hola! ¿Qué tipo de prenda buscás? Tengo pantalones, camisetas, chaquetas, sudaderas, camisas y faldas."

---

❌ MAL:
Usuario: "Pantalones"
Tú: [listar 20 pantalones]

✅ BIEN:
Usuario: "Pantalones"
Tú: "Tengo muchos pantalones. ¿Qué color o talle preferís?"

---

❌ MAL:
Usuario: "Quiero 100 del primero"
Tú: [crear carrito inmediatamente]

✅ BIEN:
Usuario: "Quiero 100 del primero"
Tú: "Confirmas 100u de *Pantalón Verde L* por $101,700?"

---

✅ EXCELENTE (con sugerencia):
Usuario: "Quiero 95 unidades"
Tú: "Confirmas 95u de *Pantalón Verde L* por $96,615?

💡 Con solo 5u más (100 total) pagarías $1,017 c/u en vez de $1,017. Ahorrarías $XXX."

=== MANEJO DE ERRORES ===
- Producto no encontrado: "No encontré [X]. ¿Querés que te muestre [sugerencia]?"
- Sin stock: "Ese producto está agotado. Productos similares: [lista]"
- Error técnico: "Tuve un problema consultando eso. ¿Probás de nuevo?"

=== TU PERSONALIDAD ===
- Profesional pero cercano
- Eficiente, directo, sin rodeos
- Consultivo: sugerís mejores opciones
- Experto que entiende el negocio mayorista

SÉ BREVE. SÉ PRECISO. SÉ ÚTIL.`,
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

      let userHistory = this.conversationHistory.get(userId)!;

      // 2. Validar y limpiar historial antes de usarlo
      userHistory = this.cleanHistory(userHistory);
      this.conversationHistory.set(userId, userHistory);

      // 3. Crear sesión de chat con historial limpio
      const chat = this.model.startChat({
        history: userHistory,
      });

      // 4. Enviar mensaje del usuario a Gemini
      let result = await chat.sendMessage(message);
      let response = result.response;

      // 5. Manejar function calls (si Gemini decide usar herramientas)
      // Este loop se ejecuta mientras Gemini quiera llamar funciones
      while (response.candidates[0].content.parts.some((part) => part.functionCall)) {
        const functionCall = response.candidates[0].content.parts.find(
          (part) => part.functionCall,
        ).functionCall;

        this.logger.log(`🔧 Gemini llamó a: ${functionCall.name}`);
        this.logger.debug(`   Argumentos: ${JSON.stringify(functionCall.args)}`);

        // 6. Ejecutar la función solicitada
        const functionResponse = await this.executeFunction(
          functionCall.name,
          functionCall.args,
        );

        this.logger.debug(`   Resultado: ${JSON.stringify(functionResponse).substring(0, 200)}...`);

        // 7. Enviar el resultado de la función de vuelta a Gemini
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

      // 8. Obtener la respuesta final de texto
      const finalText = response.text();

      // 9. Obtener el historial completo de Gemini (incluye function calls)
      // Esto es mejor que construirlo manualmente porque Gemini ya lo tiene en el formato correcto
      const fullHistory = await chat.getHistory();

      // Reemplazar el historial del usuario con el historial completo de Gemini
      this.conversationHistory.set(userId, fullHistory);

      // Mantener solo últimos 20 mensajes para no exceder límites
      const currentHistory = this.conversationHistory.get(userId)!;
      if (currentHistory.length > 20) {
        let slicedHistory = currentHistory.slice(currentHistory.length - 20);
        slicedHistory = this.cleanHistory(slicedHistory);
        this.conversationHistory.set(userId, slicedHistory);
        this.logger.debug(`📦 Historial reducido a ${slicedHistory.length} mensajes`);
      }

      this.logger.log(`💬 Respuesta generada: ${finalText.substring(0, 100)}...`);

      return finalText;
    } catch (error) {
      this.logger.error(`❌ Error procesando mensaje: ${error.message}`, error.stack);

      // Si es el error de historial corrupto, resetear el historial del usuario
      if (error.message?.includes('First content should be with role')) {
        this.logger.warn(`🔄 Reseteando historial corrupto para usuario ${userId}`);
        this.conversationHistory.delete(userId);
        return 'Disculpa, tuve que reiniciar nuestra conversación. ¿En qué puedo ayudarte?';
      }

      return 'Lo siento, tuve un problema procesando tu mensaje. ¿Podrías intentar de nuevo?';
    }
  }

  /**
   * Limpia el historial para asegurar que cumple con los requisitos de Gemini
   * El historial DEBE empezar con un mensaje de rol 'user'
   */
  private cleanHistory(history: any[]): any[] {
    if (history.length === 0) {
      return [];
    }

    // Si el primer mensaje no es de usuario, eliminar mensajes hasta encontrar uno
    let cleanedHistory = [...history];

    while (cleanedHistory.length > 0 && cleanedHistory[0].role !== 'user') {
      this.logger.debug(`🧹 Eliminando mensaje inicial con rol: ${cleanedHistory[0].role}`);
      cleanedHistory = cleanedHistory.slice(1);
    }

    // Si quedó vacío o no hay mensajes de usuario, retornar vacío
    if (cleanedHistory.length === 0) {
      this.logger.warn(`⚠️  Historial sin mensajes de usuario válidos, reseteado`);
      return [];
    }

    return cleanedHistory;
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
