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
        description: `Busca productos en el catálogo. Busca por nombre, descripción, color, categoría, tipo de prenda o talla.
        Usa este tool cuando el usuario quiera ver productos, buscar algo específico, o explorar el catálogo.
        Ejemplos: "quiero pantalones", "busco camisetas rojas", "tienes algo en talla L"`,
        parameters: {
          type: 'OBJECT' as const,
          properties: {
            query: {
              type: 'STRING' as const,
              description:
                'Término de búsqueda. Puede ser color, tipo de prenda, talla, o combinación. Ejemplos: "pantalon verde", "camiseta", "rojo L"',
            },
          },
          required: ['query'],
        },
      },

      // TOOL 2: Obtener detalle de producto
      {
        name: 'getProductDetail',
        description: `Obtiene información detallada de un producto específico incluyendo precios por cantidad y stock.
        Usa este tool cuando el usuario quiera saber más sobre un producto específico, preguntar por precios detallados, o verificar stock.`,
        parameters: {
          type: 'OBJECT' as const,
          properties: {
            productId: {
              type: 'NUMBER' as const,
              description:
                'ID del producto a consultar. Este ID se obtiene de los resultados de searchProducts.',
            },
          },
          required: ['productId'],
        },
      },

      // TOOL 3: Crear carrito de compra
      {
        name: 'createCart',
        description: `Crea un nuevo carrito de compra con productos.
        Usa este tool cuando el usuario quiera comprar, agregar al carrito, hacer un pedido, o confirmar una selección.
        IMPORTANTE: Debes tener los product_id y cantidades específicas antes de llamar este tool.`,
        parameters: {
          type: 'OBJECT' as const,
          properties: {
            items: {
              type: 'ARRAY' as const,
              description: 'Lista de productos a agregar al carrito',
              items: {
                type: 'OBJECT' as const,
                properties: {
                  product_id: {
                    type: 'NUMBER' as const,
                    description: 'ID del producto',
                  },
                  qty: {
                    type: 'NUMBER' as const,
                    description:
                      'Cantidad a comprar. IMPORTANTE: Los precios varían según cantidad (50, 100, 200 unidades)',
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
        description: `Actualiza un carrito existente: modifica cantidades o elimina productos.
        Usa este tool cuando el usuario quiera cambiar cantidades, eliminar productos del carrito, o modificar su pedido.
        Para eliminar un producto, envía qty: 0`,
        parameters: {
          type: 'OBJECT' as const,
          properties: {
            cartId: {
              type: 'NUMBER' as const,
              description: 'ID del carrito a actualizar',
            },
            items: {
              type: 'ARRAY' as const,
              description:
                'Lista de productos a actualizar. Para eliminar un producto, usa qty: 0',
              items: {
                type: 'OBJECT' as const,
                properties: {
                  product_id: {
                    type: 'NUMBER' as const,
                    description: 'ID del producto',
                  },
                  qty: {
                    type: 'NUMBER' as const,
                    description:
                      'Nueva cantidad. Usa 0 para eliminar el producto del carrito',
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
