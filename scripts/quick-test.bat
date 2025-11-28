@echo off
REM ========================================
REM QUICK TEST SCRIPT - Agente de Ventas IA (Windows)
REM ========================================

echo.
echo ============================================
echo QUICK TESTS - Agente de Ventas IA
echo ============================================
echo.

set API_URL=http://localhost:3000

echo Testeando contra: %API_URL%
echo.

REM Test 1: Productos
echo [TEST 1] Listando productos...
curl -s %API_URL%/products >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] GET /products
) else (
    echo [FAIL] GET /products
)

echo.

REM Test 2: Buscar productos
echo [TEST 2] Buscando productos...
curl -s "%API_URL%/products?q=pantalon" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] GET /products?q=pantalon
) else (
    echo [FAIL] GET /products?q=pantalon
)

echo.

REM Test 3: AI Agent - Chat
echo [TEST 3] Probando AI Agent...
curl -s -X POST %API_URL%/ai-agent/chat -H "Content-Type: application/json" -d "{\"userId\":\"test\",\"message\":\"Hola\"}" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] POST /ai-agent/chat
) else (
    echo [FAIL] POST /ai-agent/chat
)

echo.

REM Test 4: WhatsApp Status
echo [TEST 4] Verificando WhatsApp service...
curl -s -X POST %API_URL%/whatsapp/status >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] POST /whatsapp/status
) else (
    echo [FAIL] POST /whatsapp/status
)

echo.
echo ============================================
echo Tests completados!
echo ============================================
echo.
echo Para tests mas detallados, usar: npm run test:e2e
echo.
pause
