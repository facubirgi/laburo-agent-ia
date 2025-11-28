# 🧪 Manual de Testing End-to-End

Este documento guía el testing manual completo del Agente de Ventas IA.

## Prerrequisitos

1. ✅ Base de datos PostgreSQL configurada y running
2. ✅ Variables de entorno configuradas en `.env`
3. ✅ Productos cargados en la base de datos (`npm run seed`)
4. ✅ Servidor corriendo (`npm run start:dev`)

---

## Test 1: API REST - Productos

### 1.1 Listar todos los productos

```bash
curl http://localhost:3000/products
```

**Resultado esperado:**
- Status: 200 OK
- Body: Array de productos con estructura:
  ```json
  [
    {
      "id": 1,
      "name": "Producto ejemplo",
      "description": "Descripción",
      "price50u": 100.00,
      "price100u": 90.00,
      "price200u": 80.00,
      "stock": 1000,
      "available": true,
      "category": "Categoría",
      "color": "Rojo",
      "size": "L",
      "type": "Pantalón"
    }
  ]
  ```

### 1.2 Buscar productos por query

```bash
# Buscar pantalones
curl "http://localhost:3000/products?q=pantalon"

# Buscar por color
curl "http://localhost:3000/products?q=rojo"

# Buscar por talla
curl "http://localhost:3000/products?q=L"
```

**Resultado esperado:**
- Status: 200 OK
- Body: Array filtrado de productos que matchean el query

### 1.3 Obtener detalle de producto

```bash
curl http://localhost:3000/products/1
```

**Resultado esperado:**
- Status: 200 OK
- Body: Objeto con información detallada del producto

### 1.4 Producto inexistente (caso de error)

```bash
curl http://localhost:3000/products/99999
```

**Resultado esperado:**
- Status: 404 Not Found
- Body: `{ "message": "Producto #99999 no encontrado" }`

---

## Test 2: API REST - Carritos

### 2.1 Crear carrito con productos

```bash
curl -X POST http://localhost:3000/carts \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      { "product_id": 1, "qty": 50 },
      { "product_id": 2, "qty": 100 }
    ]
  }'
```

**Resultado esperado:**
- Status: 201 Created
- Body: Carrito creado con items y total calculado
  ```json
  {
    "id": 1,
    "items": [
      {
        "id": 1,
        "productId": 1,
        "qty": 50,
        "unitPrice": 100.00,
        "product": { ... }
      }
    ],
    "total": 5000.00,
    "created_at": "2024-01-15T10:00:00.000Z",
    "updated_at": "2024-01-15T10:00:00.000Z"
  }
  ```

### 2.2 Actualizar carrito - Modificar cantidad

```bash
curl -X PATCH http://localhost:3000/carts/1 \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      { "product_id": 1, "qty": 200 }
    ]
  }'
```

**Resultado esperado:**
- Status: 200 OK
- Body: Carrito actualizado con nueva cantidad
- Total debe cambiar (precio200u es diferente a precio50u)

### 2.3 Actualizar carrito - Eliminar producto

```bash
curl -X PATCH http://localhost:3000/carts/1 \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      { "product_id": 1, "qty": 0 }
    ]
  }'
```

**Resultado esperado:**
- Status: 200 OK
- Body: Carrito sin el producto eliminado

### 2.4 Validación de stock

```bash
curl -X POST http://localhost:3000/carts \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      { "product_id": 1, "qty": 999999 }
    ]
  }'
```

**Resultado esperado:**
- Status: 400 Bad Request
- Body: `{ "message": "Stock insuficiente para ..." }`

---

## Test 3: AI Agent - Conversación

### 3.1 Saludo inicial

```bash
curl -X POST http://localhost:3000/ai-agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-1",
    "message": "Hola"
  }'
```

**Resultado esperado:**
- Status: 200 OK
- Body: Respuesta amigable del agente
  ```json
  {
    "userId": "test-user-1",
    "userMessage": "Hola",
    "agentResponse": "¡Hola! Soy tu asistente de ventas...",
    "timestamp": "2024-01-15T10:00:00.000Z"
  }
  ```

### 3.2 Buscar productos

```bash
curl -X POST http://localhost:3000/ai-agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-1",
    "message": "Busco pantalones verdes"
  }'
```

**Resultado esperado:**
- El agente llama a `searchProducts({ query: "pantalones verdes" })`
- Respuesta incluye productos encontrados con precios y stock

### 3.3 Preguntar por precios

```bash
curl -X POST http://localhost:3000/ai-agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-1",
    "message": "Cuánto cuestan?"
  }'
```

**Resultado esperado:**
- El agente menciona los 3 niveles de precio (50u, 100u, 200u)
- Explica los descuentos por volumen

### 3.4 Crear carrito

```bash
curl -X POST http://localhost:3000/ai-agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-1",
    "message": "Quiero comprar 100 unidades del producto 1"
  }'
```

**Resultado esperado:**
- El agente llama a `createCart({ items: [{ product_id: 1, qty: 100 }] })`
- Respuesta confirma la creación del carrito con el total

### 3.5 Modificar carrito

```bash
curl -X POST http://localhost:3000/ai-agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-1",
    "message": "Mejor quiero 200 unidades"
  }'
```

**Resultado esperado:**
- El agente llama a `updateCart({ cartId: X, items: [...] })`
- Respuesta confirma la actualización y nuevo total

### 3.6 Limpiar historial

```bash
curl -X DELETE http://localhost:3000/ai-agent/history/test-user-1
```

**Resultado esperado:**
- Status: 200 OK
- Body: `{ "message": "Historial limpiado para usuario test-user-1" }`

---

## Test 4: WhatsApp Webhook (Mock)

### 4.1 Simular mensaje entrante de WhatsApp

```bash
curl -X POST http://localhost:3000/whatsapp/webhook \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=whatsapp:+5491123456789" \
  -d "To=whatsapp:+14155238886" \
  -d "Body=Hola, busco pantalones" \
  -d "ProfileName=Test User" \
  -d "MessageSid=SM123456"
```

**Resultado esperado:**
- Status: 200 OK
- Body: "OK"
- En logs del servidor:
  - Mensaje recibido de WhatsApp
  - Procesado por AI Agent
  - Intento de envío de respuesta vía Twilio API

### 4.2 Verificar estado del servicio

```bash
curl -X POST http://localhost:3000/whatsapp/status
```

**Resultado esperado:**
- Status: 200 OK
- Body:
  ```json
  {
    "service": "WhatsApp (Twilio)",
    "status": "configured" | "not_configured",
    "configured": true | false,
    "message": "...",
    "webhookUrl": "/whatsapp/webhook",
    "timestamp": "2024-01-15T10:00:00.000Z"
  }
  ```

---

## Test 5: Flujo Completo End-to-End

### Escenario: Cliente busca, pregunta y compra

```bash
# 1. Saludo
curl -X POST http://localhost:3000/ai-agent/chat \
  -H "Content-Type: application/json" \
  -d '{"userId": "cliente-1", "message": "Hola"}'

# 2. Buscar productos
curl -X POST http://localhost:3000/ai-agent/chat \
  -H "Content-Type: application/json" \
  -d '{"userId": "cliente-1", "message": "Necesito camisetas rojas"}'

# 3. Preguntar por detalle
curl -X POST http://localhost:3000/ai-agent/chat \
  -H "Content-Type: application/json" \
  -d '{"userId": "cliente-1", "message": "Dame más info del primer producto"}'

# 4. Preguntar por precios
curl -X POST http://localhost:3000/ai-agent/chat \
  -H "Content-Type: application/json" \
  -d '{"userId": "cliente-1", "message": "Cuánto cuesta si compro 150 unidades?"}'

# 5. Comprar
curl -X POST http://localhost:3000/ai-agent/chat \
  -H "Content-Type: application/json" \
  -d '{"userId": "cliente-1", "message": "Ok, quiero 150 unidades"}'

# 6. Modificar cantidad
curl -X POST http://localhost:3000/ai-agent/chat \
  -H "Content-Type: application/json" \
  -d '{"userId": "cliente-1", "message": "Mejor quiero 200"}'

# 7. Confirmar
curl -X POST http://localhost:3000/ai-agent/chat \
  -H "Content-Type: application/json" \
  -d '{"userId": "cliente-1", "message": "Perfecto, confirmo la compra"}'
```

**Resultado esperado:**
- Conversación fluida y natural
- El agente entiende el contexto de mensajes anteriores
- Llama a las funciones correctas en cada paso
- Precios calculados correctamente según cantidad

---

## Test 6: Tests Automatizados (Jest)

### Ejecutar todos los tests e2e

```bash
npm run test:e2e
```

**Resultado esperado:**
- Todos los tests pasan ✅
- Coverage de todas las funcionalidades principales

---

## Checklist de Validación Final

Antes de entregar, verificar:

- [ ] ✅ Todos los endpoints REST funcionan correctamente
- [ ] ✅ Validaciones de stock funcionan
- [ ] ✅ Precios por volumen se calculan bien
- [ ] ✅ AI Agent entiende y responde correctamente
- [ ] ✅ Function calling funciona (searchProducts, getProductDetail, createCart, updateCart)
- [ ] ✅ Historial de conversación se mantiene
- [ ] ✅ Webhook de WhatsApp recibe mensajes
- [ ] ✅ Mensajes se envían a WhatsApp (si Twilio está configurado)
- [ ] ✅ Tests automatizados pasan
- [ ] ✅ Logs son claros y útiles
- [ ] ✅ Manejo de errores funciona
- [ ] ✅ Base de datos tiene productos de ejemplo

---

## Notas de Debugging

### Ver logs en tiempo real

```bash
npm run start:dev
```

Los logs mostrarán:
- 📩 Mensajes recibidos
- 🔧 Function calls de Gemini
- 💬 Respuestas generadas
- 📤 Mensajes enviados a WhatsApp
- ❌ Errores (si los hay)

### Problemas comunes

1. **Error: GEMINI_API_KEY no configurada**
   - Solución: Agregar `GEMINI_API_KEY=tu_key` en `.env`

2. **Error de conexión a base de datos**
   - Solución: Verificar credenciales en `.env`
   - Ejecutar: `npm run seed` para cargar productos

3. **WhatsApp no envía mensajes**
   - Solución: Verificar credenciales de Twilio en `.env`
   - Revisar logs para ver error específico

4. **AI Agent no entiende el contexto**
   - Solución: Limpiar historial con `DELETE /ai-agent/history/:userId`
   - Reiniciar conversación

---

## Testing en Producción (WhatsApp Real)

### Configurar webhook en Twilio

1. Ir a: https://console.twilio.com/us1/develop/sms/settings/whatsapp-sandbox
2. En "WHEN A MESSAGE COMES IN", configurar:
   - URL: `https://tu-dominio-publico.com/whatsapp/webhook`
   - Method: POST
3. Guardar

### Conectar con el sandbox de WhatsApp

1. Enviar mensaje al número de Twilio con el código que aparece en la consola
2. Ejemplo: `join <codigo>`
3. Empezar a chatear con el agente

### Mensajes de prueba reales

- "Hola"
- "Busco pantalones verdes"
- "Cuánto cuesta?"
- "Quiero 100 unidades"
- "Mejor quiero 150"

---

**Listo para testing!** 🚀
