/**
 * TOOLS (Function Declarations) para el Agente IA
 *
 * Estas son las "herramientas" que Gemini puede usar para interactuar
 * con nuestra API REST. Gemini decide cuándo y cómo usarlas basándose
 * en la conversación con el usuario.
 */

export const tools = [
  {
    functionDeclarations: [
      // TOOL 1: Buscar productos
      {
        name: 'searchProducts',
        description: `Busca productos en el catálogo por nombre, color, talla, categoría o tipo.

CUÁNDO USAR:
✅ Usuario menciona tipo de prenda específico ("pantalones", "camisetas")
✅ Usuario menciona color + tipo ("pantalones verdes", "camiseta roja")
✅ Usuario menciona talle específico ("talle L", "XL")
✅ Usuario pregunta por categoría ("ropa casual", "formal")

CUÁNDO NO USAR:
❌ Preguntas genéricas ("qué tenés", "productos", "catálogo") → Pedir especificaciones
❌ Ya sabes el ID del producto → Usar getProductDetail
❌ Usuario solo confirma algo ("sí", "dale", "ok") → No buscar

EJEMPLOS CORRECTOS:
- "pantalones verdes" → query: "pantalon verde"
- "camisetas rojas talle L" → query: "camiseta roja L"
- "ropa deportiva" → query: "deportivo"
- "el primero" (si hay contexto previo) → NO usar, tomar del contexto

FORMATO DEL QUERY:
- Normalizar a singular ("pantalones" → "pantalon")
- Sin artículos ("los pantalones" → "pantalon")
- Combinar términos relevantes ("pantalon verde L")`,
        parameters: {
          type: 'OBJECT' as const,
          properties: {
            query: {
              type: 'STRING' as const,
              description:
                'Término de búsqueda normalizado. Ejemplos: "pantalon verde", "camiseta roja L", "deportivo"',
            },
          },
          required: ['query'],
        },
      },

      // TOOL 2: Obtener detalle de producto
      {
        name: 'getProductDetail',
        description: `Obtiene información COMPLETA de un producto específico: precios por volumen, stock disponible, categoría, etc.

CUÁNDO USAR:
✅ Usuario pregunta "cuánto cuesta" o "precio de" un producto ya mencionado
✅ Usuario pregunta por stock disponible ("hay stock?", "cuántas hay?")
✅ Usuario dice "contame más" o "detalles" sobre un producto
✅ Necesitas verificar stock antes de crear carrito

CUÁNDO NO USAR:
❌ Para buscar productos → Usar searchProducts
❌ Ya tienes toda la info necesaria en memoria del contexto
❌ Usuario pregunta genéricamente por precios sin producto específico

INFORMACIÓN QUE RETORNA:
- Los 3 niveles de precio (50u, 100u, 200u)
- Stock exacto disponible
- Descripción completa
- Color, talle, categoría, tipo

IMPORTANTE: Usar este tool ANTES de crear carrito para validar stock.`,
        parameters: {
          type: 'OBJECT' as const,
          properties: {
            productId: {
              type: 'NUMBER' as const,
              description:
                'ID numérico del producto. Se obtiene de searchProducts o del contexto de conversación.',
            },
          },
          required: ['productId'],
        },
      },

      // TOOL 3: Crear carrito de compra
      {
        name: 'createCart',
        description: `Crea un nuevo carrito de compra. ACCIÓN CRÍTICA - Requiere confirmación previa del usuario.

FLUJO OBLIGATORIO:
1. Usuario expresa intención de compra ("quiero", "me llevo", "agregar al carrito")
2. TÚ calculas el total y CONFIRMAS: "Confirmas XXu de [Producto] por $TOTAL?"
3. Usuario confirma explícitamente ("sí", "dale", "ok", "confirmo")
4. RECIÉN AHÍ llamas a createCart

CUÁNDO USAR:
✅ Usuario confirmó explícitamente la compra después de tu pregunta
✅ Tienes product_id y cantidad específica
✅ Ya verificaste que hay stock suficiente

CUÁNDO NO USAR:
❌ Usuario solo pregunta o explora ("me interesa", "cuánto cuesta")
❌ NO hubo confirmación explícita
❌ No sabes el product_id exacto
❌ La cantidad supera el stock disponible

VALIDACIONES PREVIAS OBLIGATORIAS:
- Verificar stock suficiente (llamar getProductDetail si hace falta)
- Validar que qty >= 50 (mínimo mayorista)
- Confirmar con el usuario mostrando el total calculado

EJEMPLO CORRECTO:
Usuario: "Quiero 100 del primero"
Tú: "Confirmas 100u de *Pantalón Verde L* por $101,700?"
Usuario: "Sí"
Tú: [AHORA SÍ llamar createCart con product_id y qty:100]

EJEMPLO INCORRECTO:
Usuario: "Me interesa ese"
Tú: [NO llamar createCart todavía, falta cantidad y confirmación]`,
        parameters: {
          type: 'OBJECT' as const,
          properties: {
            items: {
              type: 'ARRAY' as const,
              description: 'Array de items a agregar. Puede ser uno o varios productos.',
              items: {
                type: 'OBJECT' as const,
                properties: {
                  product_id: {
                    type: 'NUMBER' as const,
                    description: 'ID numérico del producto (obtenido de searchProducts)',
                  },
                  qty: {
                    type: 'NUMBER' as const,
                    description:
                      'Cantidad de unidades (mínimo 50). Los precios varían: 50-99u, 100-199u, 200+u',
                  },
                },
                required: ['product_id', 'qty'],
              },
            },
          },
          required: ['items'],
        },
      },

      // TOOL 4: Actualizar carrito
      {
        name: 'updateCart',
        description: `Modifica un carrito existente: cambiar cantidades o eliminar productos. REQUIERE confirmación previa.

FLUJO OBLIGATORIO:
1. Usuario pide modificar ("cambiar a 150", "mejor 200", "eliminar el pantalón")
2. TÚ calculas nuevo total y CONFIRMAS: "Confirmas cambiar a XXu por $NUEVO_TOTAL?"
3. Usuario confirma ("sí", "dale", "ok")
4. RECIÉN AHÍ llamas a updateCart

CUÁNDO USAR:
✅ Ya existe un carrito activo (tienes el cartId del contexto)
✅ Usuario quiere cambiar cantidad de un producto en el carrito
✅ Usuario quiere eliminar un producto del carrito
✅ Usuario confirmó la modificación

CUÁNDO NO USAR:
❌ No hay carrito creado todavía → Usar createCart
❌ Usuario solo pregunta sin confirmar
❌ No tienes el cartId del contexto

OPERACIONES SOPORTADAS:
- Cambiar cantidad: {product_id: X, qty: nueva_cantidad}
- Eliminar producto: {product_id: X, qty: 0}
- Múltiples cambios en una sola llamada

VALIDACIONES PREVIAS:
- Verificar stock disponible para la nueva cantidad
- Mostrar diferencia de precio al usuario
- Confirmar antes de ejecutar

EJEMPLOS:
Usuario: "Mejor hacé 150 en vez de 100"
Tú: "Confirmas cambiar a 150u por $152,550? (antes: $101,700)"
Usuario: "Sí"
Tú: [updateCart con cartId del contexto, qty: 150]

Usuario: "Sacá el pantalón"
Tú: "Confirmas eliminar *Pantalón Verde L* del carrito?"
Usuario: "Dale"
Tú: [updateCart con qty: 0]`,
        parameters: {
          type: 'OBJECT' as const,
          properties: {
            cartId: {
              type: 'NUMBER' as const,
              description: 'ID del carrito a modificar (obtenido del contexto de la conversación)',
            },
            items: {
              type: 'ARRAY' as const,
              description:
                'Array de modificaciones. qty: 0 elimina el producto, qty > 0 actualiza cantidad.',
              items: {
                type: 'OBJECT' as const,
                properties: {
                  product_id: {
                    type: 'NUMBER' as const,
                    description: 'ID del producto a modificar',
                  },
                  qty: {
                    type: 'NUMBER' as const,
                    description:
                      'Nueva cantidad (0 = eliminar, >0 = nueva cantidad). Mínimo 50 para mantener en carrito.',
                  },
                },
                required: ['product_id', 'qty'],
              },
            },
          },
          required: ['cartId', 'items'],
        },
      },
    ],
  },
];
