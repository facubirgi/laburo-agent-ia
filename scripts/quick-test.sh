#!/bin/bash

# ========================================
# QUICK TEST SCRIPT - Agente de Ventas IA
# ========================================
# Este script ejecuta tests rápidos para validar que todo funciona

echo "🧪 INICIANDO TESTS RÁPIDOS DEL AGENTE DE VENTAS IA"
echo "=================================================="
echo ""

# Configuración
API_URL=${API_URL:-"http://localhost:3000"}
TEST_USER_ID="test-script-$(date +%s)"

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir resultados
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC}: $2"
    else
        echo -e "${RED}❌ FAIL${NC}: $2"
        exit 1
    fi
}

print_info() {
    echo -e "${YELLOW}ℹ️  INFO${NC}: $1"
}

echo "🔍 Testeando contra: $API_URL"
echo ""

# ========================================
# TEST 1: API DE PRODUCTOS
# ========================================
echo "📦 TEST 1: API de Productos"
echo "----------------------------"

# 1.1 Listar productos
print_info "Listando productos..."
RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/products")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    PRODUCT_COUNT=$(echo "$BODY" | grep -o '"id":' | wc -l)
    print_result 0 "GET /products retorna $PRODUCT_COUNT productos"

    # Guardar ID de primer producto para tests siguientes
    PRODUCT_ID=$(echo "$BODY" | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
    print_info "Usando producto ID: $PRODUCT_ID para tests"
else
    print_result 1 "GET /products (código: $HTTP_CODE)"
fi

# 1.2 Buscar productos
print_info "Buscando productos con query..."
RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/products?q=pantalon")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
[ "$HTTP_CODE" = "200" ] && print_result 0 "GET /products?q=pantalon" || print_result 1 "GET /products?q=pantalon"

# 1.3 Detalle de producto
print_info "Obteniendo detalle del producto..."
RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/products/$PRODUCT_ID")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
[ "$HTTP_CODE" = "200" ] && print_result 0 "GET /products/$PRODUCT_ID" || print_result 1 "GET /products/$PRODUCT_ID"

echo ""

# ========================================
# TEST 2: API DE CARRITOS
# ========================================
echo "🛒 TEST 2: API de Carritos"
echo "--------------------------"

# 2.1 Crear carrito
print_info "Creando carrito con productos..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/carts" \
  -H "Content-Type: application/json" \
  -d "{\"items\": [{\"product_id\": $PRODUCT_ID, \"qty\": 50}]}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "201" ]; then
    CART_ID=$(echo "$BODY" | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
    print_result 0 "POST /carts (Carrito ID: $CART_ID)"
else
    print_result 1 "POST /carts (código: $HTTP_CODE)"
fi

# 2.2 Actualizar carrito
print_info "Actualizando carrito..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X PATCH "$API_URL/carts/$CART_ID" \
  -H "Content-Type: application/json" \
  -d "{\"items\": [{\"product_id\": $PRODUCT_ID, \"qty\": 100}]}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
[ "$HTTP_CODE" = "200" ] && print_result 0 "PATCH /carts/$CART_ID" || print_result 1 "PATCH /carts/$CART_ID"

echo ""

# ========================================
# TEST 3: AI AGENT
# ========================================
echo "🤖 TEST 3: AI Agent"
echo "-------------------"

# 3.1 Saludo
print_info "Enviando saludo al agente..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/ai-agent/chat" \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"$TEST_USER_ID\", \"message\": \"Hola\"}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    HAS_RESPONSE=$(echo "$BODY" | grep -o '"agentResponse"' | wc -l)
    if [ "$HAS_RESPONSE" -gt 0 ]; then
        print_result 0 "POST /ai-agent/chat (Saludo)"
    else
        print_result 1 "POST /ai-agent/chat (Sin respuesta del agente)"
    fi
else
    print_result 1 "POST /ai-agent/chat (código: $HTTP_CODE)"
fi

# 3.2 Buscar productos con AI
print_info "Pidiendo al agente buscar productos..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/ai-agent/chat" \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"$TEST_USER_ID\", \"message\": \"Busco pantalones\"}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
[ "$HTTP_CODE" = "200" ] && print_result 0 "POST /ai-agent/chat (Búsqueda)" || print_result 1 "POST /ai-agent/chat (Búsqueda)"

# 3.3 Limpiar historial
print_info "Limpiando historial del agente..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "$API_URL/ai-agent/history/$TEST_USER_ID")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
[ "$HTTP_CODE" = "200" ] && print_result 0 "DELETE /ai-agent/history" || print_result 1 "DELETE /ai-agent/history"

echo ""

# ========================================
# TEST 4: WHATSAPP STATUS
# ========================================
echo "💬 TEST 4: WhatsApp Service"
echo "---------------------------"

print_info "Verificando estado del servicio de WhatsApp..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/whatsapp/status")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    IS_CONFIGURED=$(echo "$BODY" | grep -o '"configured":true' | wc -l)
    if [ "$IS_CONFIGURED" -gt 0 ]; then
        print_result 0 "POST /whatsapp/status (WhatsApp configurado)"
    else
        print_info "WhatsApp NO configurado (normal si no tienes Twilio)"
        print_result 0 "POST /whatsapp/status (Endpoint funciona)"
    fi
else
    print_result 1 "POST /whatsapp/status (código: $HTTP_CODE)"
fi

echo ""
echo "=================================================="
echo -e "${GREEN}✅ TODOS LOS TESTS PASARON${NC}"
echo "=================================================="
echo ""
echo "🎉 El agente de ventas está funcionando correctamente!"
echo ""
echo "Próximos pasos:"
echo "  1. Configurar Twilio WhatsApp (si aún no lo hiciste)"
echo "  2. Deployar a un servidor público"
echo "  3. Configurar webhook en Twilio Console"
echo "  4. Probar el agente en WhatsApp real"
echo ""
