# 🤖 Agente de Ventas IA - Laburo.com Challenge

Solución completa del desafío de laburo.com: Un agente de IA conversacional capaz de vender productos mediante una API REST, base de datos PostgreSQL e integración con WhatsApp.

## 📋 Índice

- [Características](#-características)
- [Arquitectura](#-arquitectura)
- [Stack Tecnológico](#-stack-tecnológico)
- [Requisitos](#-requisitos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [Endpoints API](#-endpoints-api)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Documentación Adicional](#-documentación-adicional)

---

## ✨ Características

### Funcionalidades Core

✅ **API REST completa** para gestión de productos y carritos
✅ **Agente de IA conversacional** con Gemini (Google AI)
✅ **Function Calling** para interacción determinística con la base de datos
✅ **Integración con WhatsApp** vía Twilio
✅ **Sistema de precios por volumen** (50u, 100u, 200u)
✅ **Validación de stock** en tiempo real
✅ **Historial de conversación** por usuario
✅ **Base de datos PostgreSQL** con TypeORM

### Extras Implementados

🎁 **Búsqueda avanzada** por nombre, color, talla, categoría
🎁 **Actualización de carritos** (modificar cantidades, eliminar items)
🎁 **Tests end-to-end** completos
🎁 **Validación de webhooks de Twilio** (seguridad)
🎁 **Documentación exhaustiva**

### Mejoras de UX del AI Agent

🚀 **Conversaciones optimizadas para WhatsApp**
- Respuestas concisas (máx 4-5 líneas)
- Formato con *negrita* y bullets •
- Límite de 5 productos por listado

🚀 **Confirmaciones inteligentes**
- Pide confirmación antes de crear/editar carritos
- Muestra totales calculados antes de acciones
- Valida stock disponible proactivamente

🚀 **Contexto conversacional**
- Entiende referencias: "el primero", "ese", "el mismo"
- Mantiene tracking del último producto consultado
- Historial robusto con auto-limpieza

🚀 **Validaciones proactivas**
- Sugiere mejor precio por volumen
- Alerta cuando stock es insuficiente
- Recomienda productos similares si no hay stock

---

## 🏗️ Arquitectura

```
┌─────────────────┐
│   WhatsApp      │  Usuario envía mensaje
│   (Cliente)     │
└────────┬────────┘
         │
         │ Webhook
         ▼
┌─────────────────┐
│  Twilio API     │  Recibe mensaje y llama webhook
└────────┬────────┘
         │
         │ POST /whatsapp/webhook
         ▼
┌─────────────────────────────────────────────┐
│           NestJS Backend                    │
│  ┌─────────────────────────────────────┐   │
│  │  WhatsApp Controller                │   │
│  │  - Recibe webhooks                  │   │
│  │  - Extrae mensaje del usuario       │   │
│  └──────────────┬──────────────────────┘   │
│                 │                           │
│                 ▼                           │
│  ┌─────────────────────────────────────┐   │
│  │  AI Agent Service                   │   │
│  │  - Mantiene historial               │   │
│  │  - Procesa con Gemini               │   │
│  │  - Ejecuta function calls           │   │
│  └──────────────┬──────────────────────┘   │
│                 │                           │
│        ┌────────┴────────┐                 │
│        ▼                 ▼                 │
│  ┌─────────┐      ┌─────────┐             │
│  │Products │      │ Carts   │             │
│  │Service  │      │Service  │             │
│  └────┬────┘      └────┬────┘             │
│       │                │                   │
│       └────────┬───────┘                   │
│                ▼                           │
│  ┌─────────────────────────────────────┐   │
│  │      PostgreSQL Database            │   │
│  │  - products                         │   │
│  │  - carts                            │   │
│  │  - cart_items                       │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
         │
         │ Response
         ▼
┌─────────────────┐
│  Twilio API     │  Envía respuesta al usuario
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   WhatsApp      │  Usuario recibe respuesta
│   (Cliente)     │
└─────────────────┘
```

### Flujo de Interacción

1. **Usuario envía mensaje** por WhatsApp
2. **Twilio recibe** el mensaje y llama al webhook de nuestro backend
3. **Backend procesa** el mensaje con el AI Agent
4. **Gemini analiza** la intención del usuario
5. **Function Calling** ejecuta llamadas a la API REST según la necesidad:
   - `searchProducts` → Buscar productos
   - `getProductDetail` → Ver detalle de producto
   - `createCart` → Crear carrito
   - `updateCart` → Modificar carrito
6. **AI Agent genera** respuesta natural con los resultados
7. **Backend envía** respuesta a Twilio
8. **Usuario recibe** mensaje en WhatsApp

---

## 🛠️ Stack Tecnológico

### Backend
- **Node.js** v18+
- **NestJS** 11.x - Framework backend
- **TypeScript** 5.x
- **TypeORM** 0.3.x - ORM para PostgreSQL

### Base de Datos
- **PostgreSQL** 14+ (Supabase en producción)

### AI & LLM
- **Google Gemini** 2.5 Flash - Modelo de IA
- **Function Calling** - Para ejecución determinística

### Mensajería
- **Twilio API** - Integración con WhatsApp
- **WhatsApp Business API** (via Twilio Sandbox)

### Testing
- **Jest** 30.x - Framework de testing
- **Supertest** 7.x - Tests e2e de API

---

## 📦 Requisitos

### Software necesario

1. **Node.js** >= 18.0.0
2. **npm** >= 9.0.0
3. **PostgreSQL** >= 14.0 (local o Supabase)
4. **Git**

### Cuentas y API Keys

1. **Gemini API Key** (gratis)
   - Obtener en: https://ai.google.dev/

2. **Twilio Account** (cuenta trial gratuita)
   - Registrarse en: https://www.twilio.com/try-twilio
   - Necesitas: Account SID, Auth Token, WhatsApp Sandbox Number

3. **Base de datos PostgreSQL**
   - Opción recomendada: https://supabase.com (gratis)
   - Alternativa: PostgreSQL local

---

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone <tu-repositorio>
cd desafio
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copiar el archivo de ejemplo y editarlo:

```bash
cp .env.example .env
```

Editar `.env` con tus credenciales:

```env
# Database (Supabase o local)
DB_HOST=db.xxxxx.supabase.co
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=tu_password
DB_NAME=postgres

# Gemini AI
GEMINI_API_KEY=tu_api_key_de_gemini

# Twilio WhatsApp
TWILIO_ACCOUNT_SID=tu_account_sid
TWILIO_AUTH_TOKEN=tu_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Server
PORT=3000
NODE_ENV=development

# Opcional: Desactivar validación de webhook para testing local
TWILIO_VALIDATE_WEBHOOK=false
```

### 4. Cargar productos en la base de datos

```bash
npm run seed
```

Este comando:
- Conecta a la base de datos
- Crea las tablas si no existen (gracias a `synchronize: true`)
- Carga productos desde `products.xlsx` o datos de ejemplo

### 5. Iniciar servidor

```bash
# Modo desarrollo (con hot-reload)
npm run start:dev

# Modo producción
npm run build
npm run start:prod
```

El servidor iniciará en `http://localhost:3000`

---

## ⚙️ Configuración

### Configurar base de datos (Supabase)

1. Crear cuenta en https://supabase.com
2. Crear nuevo proyecto
3. Ir a "Settings" → "Database"
4. Copiar "Connection string" (URI mode)
5. Extraer: host, port, user, password, database
6. Configurar en `.env`

### Configurar Gemini AI

1. Ir a https://ai.google.dev/
2. Click en "Get API Key"
3. Crear proyecto en Google AI Studio
4. Copiar API Key
5. Pegar en `.env` como `GEMINI_API_KEY`

### Configurar Twilio WhatsApp

1. Registrarse en https://www.twilio.com/try-twilio
2. Ir a "Messaging" → "Try it out" → "Send a WhatsApp message"
3. Copiar:
   - Account SID
   - Auth Token
   - WhatsApp Sandbox Number (ej: whatsapp:+14155238886)
4. Configurar en `.env`

### Configurar Webhook de Twilio

Para que WhatsApp funcione, necesitas un endpoint público. Opciones:

#### Opción A: Desarrollo local con ngrok

```bash
# Instalar ngrok
npm install -g ngrok

# Exponer puerto local
ngrok http 3000
```

Copiar URL pública (ej: `https://abc123.ngrok.io`)

#### Opción B: Deployment en producción

Deployar en Railway, Render, Heroku, etc. (ver sección Deployment)

#### Configurar en Twilio Console

1. Ir a: https://console.twilio.com/us1/develop/sms/settings/whatsapp-sandbox
2. En "WHEN A MESSAGE COMES IN":
   - URL: `https://tu-url-publica.com/whatsapp/webhook`
   - Method: **POST**
3. Guardar

#### Conectar tu WhatsApp al Sandbox

1. En Twilio Console, ver el código de conexión (ej: `join abc-def`)
2. Enviar ese código al número de sandbox de Twilio
3. Recibirás confirmación
4. Ya puedes chatear con el agente

---

## 💬 Uso

### Interactuar vía WhatsApp

Una vez configurado, envía mensajes al número de Twilio:

```
Usuario: Hola
Bot: Hola! ¿Qué tipo de prenda buscás?
     Tengo pantalones, camisetas, chaquetas, sudaderas, camisas y faldas.

Usuario: Busco pantalones verdes
Bot: Encontré pantalones verdes:
     *Pantalón Verde XXL* - desde $1058 (50u)
     *Pantalón Verde L* - desde $1017 (50u)
     *Pantalón Verde M* - desde $1338 (50u)
     ¿Te interesa alguno?

Usuario: Cuánto cuesta el primero?
Bot: *Pantalón Verde XXL*
     • 50-99u: $1058 c/u
     • 100-199u: $987 c/u
     • 200+u: $915 c/u
     Stock: 150 unidades

Usuario: Quiero 100 unidades
Bot: Confirmas 100u de *Pantalón Verde XXL* por $98,700?

Usuario: Sí
Bot: ✅ *Carrito #42 creado*
     • 100u de Pantalón Verde XXL: $98,700
     *Total: $98,700*
```

### Interactuar vía API REST

Puedes interactuar directamente con la API sin WhatsApp:

```bash
# Chat con el agente
curl -X POST http://localhost:3000/ai-agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "message": "Busco camisetas rojas"
  }'
```

---

## 🔌 Endpoints API

### Productos

| Método | Endpoint | Descripción | Ejemplo |
|--------|----------|-------------|---------|
| GET | `/products` | Listar productos | `/products` |
| GET | `/products?q=query` | Buscar productos | `/products?q=pantalon` |
| GET | `/products/:id` | Detalle de producto | `/products/1` |

### Carritos

| Método | Endpoint | Descripción | Body |
|--------|----------|-------------|------|
| POST | `/carts` | Crear carrito | `{ items: [{ product_id, qty }] }` |
| PATCH | `/carts/:id` | Actualizar carrito | `{ items: [{ product_id, qty }] }` |

**Nota:** Para eliminar un producto del carrito, enviar `qty: 0`

### AI Agent

| Método | Endpoint | Descripción | Body |
|--------|----------|-------------|------|
| POST | `/ai-agent/chat` | Chat con el agente | `{ userId, message }` |
| DELETE | `/ai-agent/history/:userId` | Limpiar historial | - |

### WhatsApp

| Método | Endpoint | Descripción | Uso |
|--------|----------|-------------|-----|
| POST | `/whatsapp/webhook` | Webhook de Twilio | Configurado en Twilio |
| POST | `/whatsapp/status` | Estado del servicio | Health check |

---

## 🧪 Testing

### Tests End-to-End

```bash
# Ejecutar todos los tests e2e
npm run test:e2e

# Ejecutar tests en modo watch
npm run test:watch

# Generar coverage
npm run test:cov
```

### Tests Manuales

Ver guía completa en: [`test/manual-test.md`](./test/manual-test.md)

**Quick test:**

```bash
# 1. Verificar que el servidor esté corriendo
curl http://localhost:3000/products

# 2. Probar el agente
curl -X POST http://localhost:3000/ai-agent/chat \
  -H "Content-Type: application/json" \
  -d '{"userId": "test", "message": "Hola"}'

# 3. Crear carrito
curl -X POST http://localhost:3000/carts \
  -H "Content-Type: application/json" \
  -d '{"items": [{"product_id": 1, "qty": 50}]}'
```

### Validar integración completa

1. ✅ API REST funciona
2. ✅ AI Agent responde
3. ✅ Function calling ejecuta correctamente
4. ✅ Webhook de WhatsApp recibe mensajes
5. ✅ Mensajes se envían a WhatsApp

---

## 🚢 Deployment

### Opción 1: Railway (Recomendado)

1. Crear cuenta en https://railway.app
2. Crear nuevo proyecto
3. Conectar repositorio de GitHub
4. Agregar PostgreSQL database (Railway lo provee)
5. Configurar variables de entorno
6. Deploy automático

### Opción 2: Render

1. Crear cuenta en https://render.com
2. Nuevo Web Service → Conectar repo
3. Build command: `npm install && npm run build`
4. Start command: `npm run start:prod`
5. Agregar PostgreSQL database
6. Configurar variables de entorno

### Opción 3: Heroku

```bash
# Instalar Heroku CLI
heroku login

# Crear app
heroku create mi-agente-ventas

# Agregar PostgreSQL
heroku addons:create heroku-postgresql:mini

# Configurar variables de entorno
heroku config:set GEMINI_API_KEY=tu_key
heroku config:set TWILIO_ACCOUNT_SID=tu_sid
# ... etc

# Deploy
git push heroku main

# Ejecutar seed
heroku run npm run seed
```

### Checklist post-deployment

- [ ] App corriendo en URL pública
- [ ] Base de datos conectada
- [ ] Productos cargados (`npm run seed`)
- [ ] Webhook de Twilio configurado con URL pública
- [ ] WhatsApp Sandbox conectado
- [ ] Test end-to-end en WhatsApp funciona

---

## 📚 Documentación Adicional

### Archivos importantes

- [`/docs/DISEÑO_CONCEPTUAL.md`](./docs/DISEÑO_CONCEPTUAL.md) - Arquitectura y diseño
- [`/test/manual-test.md`](./test/manual-test.md) - Guía de testing manual
- [`/.env.example`](./.env.example) - Configuración de ejemplo

### Estructura del proyecto

```
desafio/
├── src/
│   ├── ai-agent/          # Módulo del agente IA
│   │   ├── ai-agent.service.ts    # Lógica del agente
│   │   ├── ai-agent.controller.ts # Endpoints de chat
│   │   └── tools.ts              # Definición de function calls
│   ├── whatsapp/          # Módulo de WhatsApp
│   │   ├── whatsapp.service.ts    # Envío de mensajes
│   │   ├── whatsapp.controller.ts # Webhook de Twilio
│   │   └── guards/               # Validación de webhooks
│   ├── products/          # Módulo de productos
│   │   ├── products.service.ts    # Lógica de productos
│   │   ├── products.controller.ts # Endpoints REST
│   │   └── entities/             # Entidad Product
│   ├── carts/             # Módulo de carritos
│   │   ├── carts.service.ts       # Lógica de carritos
│   │   ├── carts.controller.ts    # Endpoints REST
│   │   └── entities/             # Entidades Cart y CartItem
│   ├── app.module.ts      # Módulo principal
│   ├── main.ts           # Entry point
│   └── seed.ts           # Script de carga de datos
├── test/
│   ├── e2e/              # Tests end-to-end
│   └── manual-test.md    # Guía de testing manual
├── docs/                 # Documentación
├── .env.example          # Variables de entorno ejemplo
├── package.json
└── README.md            # Este archivo
```

---

## 🤝 Soporte

### Problemas comunes

**Error: Cannot connect to database**
- Verificar credenciales en `.env`
- Verificar que PostgreSQL esté corriendo
- Verificar reglas de firewall (Supabase permite todas las IPs por defecto)

**Error: GEMINI_API_KEY not configured**
- Agregar key en `.env`
- Reiniciar servidor

**WhatsApp no responde**
- Verificar logs del servidor
- Verificar configuración del webhook en Twilio
- Verificar que URL sea pública y accesible
- Revisar que WhatsApp esté conectado al sandbox

**AI Agent no entiende contexto**
- Limpiar historial: `DELETE /ai-agent/history/:userId`
- Verificar que los tools estén bien definidos

### Contacto

Para más información sobre el challenge: https://laburo.com

---

## 📄 Licencia

Este proyecto fue desarrollado como parte del challenge de laburo.com.

---

## 🎯 Cumplimiento del Challenge

### Requisitos Obligatorios

| Requisito | Estado | Notas |
|-----------|--------|-------|
| API REST con endpoints mínimos | ✅ | GET /products, GET /products/:id, POST /carts, PATCH /carts/:id |
| Base de datos PostgreSQL | ✅ | Usando TypeORM + Supabase |
| Esquema con products, carts, cart_items | ✅ | Entidades definidas con relaciones |
| Agente de IA con LLM | ✅ | Gemini 2.5 Flash con Function Calling |
| Búsqueda de productos | ✅ | Por nombre, descripción, color, talla, tipo |
| Creación de carritos | ✅ | Con validación de stock |
| Variables en .env | ✅ | .env.example incluido |
| Documentación conceptual | ✅ | /docs/DISEÑO_CONCEPTUAL.md |
| Diagrama de flujo | ✅ | Mermaid diagram en documentación |
| Integración WhatsApp | ✅ | Twilio con webhook funcional |

### Extras Implementados

| Extra | Estado | Descripción |
|-------|--------|-------------|
| Actualizar carritos (PATCH) | ✅ | Modificar cantidades, eliminar items |
| Tests end-to-end | ✅ | Suite completa con Jest |
| Validación de webhooks Twilio | ✅ | Security guard implementado |
| Búsqueda avanzada | ✅ | Multi-campo con ILike |
| Sistema de precios por volumen | ✅ | 3 niveles: 50u, 100u, 200u |
| Historial de conversación | ✅ | Con auto-limpieza y validación robusta |
| Documentación exhaustiva | ✅ | README + manual testing + diseño conceptual |
| **Confirmaciones inteligentes** | ✅ | Antes de crear/editar carritos con totales |
| **Formato optimizado WhatsApp** | ✅ | Negrita, bullets, máx 5 productos |
| **Contexto conversacional** | ✅ | Entiende "el primero", "ese", referencias |
| **Validaciones proactivas** | ✅ | Stock, sugerencias de volumen, productos similares |

---

**Desarrollado con ❤️ para el Laburo.com Challenge** 🚀
