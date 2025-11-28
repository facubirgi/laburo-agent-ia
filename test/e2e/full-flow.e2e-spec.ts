import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

/**
 * TESTS END-TO-END - FLUJO COMPLETO DEL AGENTE DE VENTAS
 *
 * Este test valida el flujo completo del challenge:
 * 1. Buscar productos en la API
 * 2. Obtener detalle de un producto
 * 3. Crear un carrito con productos
 * 4. Actualizar el carrito (modificar cantidades, eliminar items)
 * 5. Interactuar con el AI Agent
 *
 * IMPORTANTE: Estos tests asumen que tienes:
 * - Base de datos PostgreSQL configurada en .env
 * - Productos cargados en la DB (ejecutar npm run seed)
 * - Gemini API key configurada en .env
 */

describe('Agente de Ventas - Flujo End-to-End (e2e)', () => {
  let app: INestApplication;
  let productId: number;
  let cartId: number;

  // Setup: Inicializar app antes de todos los tests
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  // Cleanup: Cerrar app después de todos los tests
  afterAll(async () => {
    await app.close();
  });

  // ==========================================
  // TESTS DE API REST - PRODUCTOS
  // ==========================================

  describe('📦 Módulo de Productos', () => {
    it('GET /products - Debe retornar lista de productos', () => {
      return request(app.getHttpServer())
        .get('/products')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);

          // Guardar ID de un producto para tests siguientes
          productId = res.body[0].id;

          // Validar estructura de producto
          const product = res.body[0];
          expect(product).toHaveProperty('id');
          expect(product).toHaveProperty('name');
          expect(product).toHaveProperty('price50u');
          expect(product).toHaveProperty('price100u');
          expect(product).toHaveProperty('price200u');
          expect(product).toHaveProperty('stock');
        });
    });

    it('GET /products?q=pantalon - Debe buscar productos por query', () => {
      return request(app.getHttpServer())
        .get('/products?q=pantalon')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          // Validar que los resultados contengan "pantalon" en algún campo
          if (res.body.length > 0) {
            const product = res.body[0];
            const searchText = `${product.name} ${product.description} ${product.type}`.toLowerCase();
            expect(searchText).toContain('pantalon');
          }
        });
    });

    it('GET /products/:id - Debe retornar detalle de un producto', () => {
      return request(app.getHttpServer())
        .get(`/products/${productId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(productId);
          expect(res.body).toHaveProperty('name');
          expect(res.body).toHaveProperty('description');
          expect(res.body).toHaveProperty('stock');
        });
    });

    it('GET /products/99999 - Debe retornar 404 para producto inexistente', () => {
      return request(app.getHttpServer())
        .get('/products/99999')
        .expect(404);
    });
  });

  // ==========================================
  // TESTS DE API REST - CARRITOS
  // ==========================================

  describe('🛒 Módulo de Carritos', () => {
    it('POST /carts - Debe crear un carrito con items', () => {
      return request(app.getHttpServer())
        .post('/carts')
        .send({
          items: [
            { product_id: productId, qty: 50 },
          ],
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('items');
          expect(res.body).toHaveProperty('total');
          expect(res.body.items.length).toBe(1);
          expect(res.body.items[0].qty).toBe(50);

          // Guardar cartId para tests siguientes
          cartId = res.body.id;
        });
    });

    it('POST /carts - Debe fallar si no hay items', () => {
      return request(app.getHttpServer())
        .post('/carts')
        .send({ items: [] })
        .expect(400);
    });

    it('POST /carts - Debe fallar si el producto no existe', () => {
      return request(app.getHttpServer())
        .post('/carts')
        .send({
          items: [{ product_id: 99999, qty: 10 }],
        })
        .expect(404);
    });

    it('PATCH /carts/:id - Debe actualizar cantidades en el carrito', () => {
      return request(app.getHttpServer())
        .patch(`/carts/${cartId}`)
        .send({
          items: [
            { product_id: productId, qty: 100 }, // Cambiar cantidad a 100
          ],
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(cartId);
          const item = res.body.items.find((i) => i.productId === productId);
          expect(item.qty).toBe(100);
        });
    });

    it('PATCH /carts/:id - Debe eliminar item si qty = 0', () => {
      return request(app.getHttpServer())
        .patch(`/carts/${cartId}`)
        .send({
          items: [
            { product_id: productId, qty: 0 }, // Eliminar item
          ],
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.items.length).toBe(0);
        });
    });

    it('PATCH /carts/99999 - Debe retornar 404 para carrito inexistente', () => {
      return request(app.getHttpServer())
        .patch('/carts/99999')
        .send({
          items: [{ product_id: productId, qty: 10 }],
        })
        .expect(404);
    });
  });

  // ==========================================
  // TESTS DE AI AGENT
  // ==========================================

  describe('🤖 Módulo de AI Agent', () => {
    const testUserId = 'test-user-e2e';

    // Limpiar historial antes de empezar
    beforeAll(async () => {
      await request(app.getHttpServer())
        .delete(`/ai-agent/history/${testUserId}`)
        .expect(200);
    });

    it('POST /ai-agent/chat - Debe responder a un saludo', () => {
      return request(app.getHttpServer())
        .post('/ai-agent/chat')
        .send({
          userId: testUserId,
          message: 'Hola',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('userId', testUserId);
          expect(res.body).toHaveProperty('userMessage', 'Hola');
          expect(res.body).toHaveProperty('agentResponse');
          expect(res.body.agentResponse.length).toBeGreaterThan(0);
        });
    }, 30000); // Timeout de 30s para dar tiempo a Gemini

    it('POST /ai-agent/chat - Debe buscar productos cuando se le pide', () => {
      return request(app.getHttpServer())
        .post('/ai-agent/chat')
        .send({
          userId: testUserId,
          message: 'Busco pantalones',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.agentResponse).toBeTruthy();
          // El agente debería mencionar productos en su respuesta
          expect(res.body.agentResponse.toLowerCase()).toMatch(/pantalon|producto|precio/);
        });
    }, 30000);

    it('POST /ai-agent/chat - Debe crear carrito cuando el usuario quiere comprar', () => {
      return request(app.getHttpServer())
        .post('/ai-agent/chat')
        .send({
          userId: testUserId,
          message: 'Quiero comprar 50 unidades del primer producto',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.agentResponse).toBeTruthy();
          // El agente debería confirmar la creación del carrito
          expect(res.body.agentResponse.toLowerCase()).toMatch(/carrito|agregué|añadí|compra/);
        });
    }, 30000);

    it('DELETE /ai-agent/history/:userId - Debe limpiar historial', () => {
      return request(app.getHttpServer())
        .delete(`/ai-agent/history/${testUserId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toContain(testUserId);
        });
    });
  });

  // ==========================================
  // TEST DE FLUJO COMPLETO (SIMULACIÓN REAL)
  // ==========================================

  describe('🎯 Flujo Completo del Cliente', () => {
    it('Debe completar flujo: Buscar → Ver detalle → Agregar al carrito', async () => {
      // 1. Buscar productos
      const searchResponse = await request(app.getHttpServer())
        .get('/products?q=camiseta')
        .expect(200);

      expect(searchResponse.body.length).toBeGreaterThan(0);
      const selectedProduct = searchResponse.body[0];

      // 2. Ver detalle del producto
      const detailResponse = await request(app.getHttpServer())
        .get(`/products/${selectedProduct.id}`)
        .expect(200);

      expect(detailResponse.body.id).toBe(selectedProduct.id);
      expect(detailResponse.body.stock).toBeGreaterThan(0);

      // 3. Crear carrito con el producto
      const cartResponse = await request(app.getHttpServer())
        .post('/carts')
        .send({
          items: [{ product_id: selectedProduct.id, qty: 50 }],
        })
        .expect(201);

      expect(cartResponse.body.items[0].productId).toBe(selectedProduct.id);
      expect(cartResponse.body.total).toBeGreaterThan(0);

      // 4. Modificar cantidad en el carrito
      const updateResponse = await request(app.getHttpServer())
        .patch(`/carts/${cartResponse.body.id}`)
        .send({
          items: [{ product_id: selectedProduct.id, qty: 100 }],
        })
        .expect(200);

      expect(updateResponse.body.items[0].qty).toBe(100);
      // El precio unitario debería cambiar (price100u vs price50u)
      expect(updateResponse.body.total).not.toBe(cartResponse.body.total);
    });
  });

  // ==========================================
  // TEST DE WEBHOOK WHATSAPP (MOCK)
  // ==========================================

  describe('💬 Webhook de WhatsApp', () => {
    it('POST /whatsapp/webhook - Debe procesar mensaje entrante', () => {
      return request(app.getHttpServer())
        .post('/whatsapp/webhook')
        .send({
          From: 'whatsapp:+5491123456789',
          To: 'whatsapp:+14155238886',
          Body: 'Hola, busco productos',
          ProfileName: 'Test User',
          MessageSid: 'SM123456',
        })
        .expect(200);
    }, 30000);

    it('POST /whatsapp/webhook - Debe ignorar mensajes vacíos', () => {
      return request(app.getHttpServer())
        .post('/whatsapp/webhook')
        .send({
          From: 'whatsapp:+5491123456789',
          To: 'whatsapp:+14155238886',
          Body: '',
        })
        .expect(200);
    });

    it('POST /whatsapp/status - Debe retornar estado del servicio', () => {
      return request(app.getHttpServer())
        .post('/whatsapp/status')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('service', 'WhatsApp (Twilio)');
          expect(res.body).toHaveProperty('status');
          expect(res.body).toHaveProperty('webhookUrl', '/whatsapp/webhook');
        });
    });
  });
});
