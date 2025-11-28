@echo off
REM ========================================
REM Script de inicio para desarrollo local
REM ========================================

echo.
echo ========================================
echo   AGENTE DE VENTAS IA - DEV MODE
echo ========================================
echo.

REM Verificar que node_modules existe
if not exist "node_modules" (
    echo [INFO] Instalando dependencias...
    call npm install
    echo.
)

REM Verificar que .env existe
if not exist ".env" (
    echo [ERROR] Archivo .env no encontrado!
    echo [INFO] Copiando .env.example a .env...
    copy .env.example .env
    echo.
    echo [IMPORTANTE] Edita .env con tus credenciales antes de continuar.
    pause
    exit /b 1
)

REM Verificar si las credenciales de Twilio están configuradas
findstr /C:"pendiente_configurar" .env >nul
if %errorlevel% equ 0 (
    echo [WARNING] Twilio aun no esta configurado en .env
    echo [INFO] Edita .env y configura TWILIO_ACCOUNT_SID y TWILIO_AUTH_TOKEN
    echo.
    echo Presiona cualquier tecla para continuar de todas formas...
    pause >nul
)

echo [1/3] Verificando base de datos...
echo.

REM Intentar cargar productos (si falla, continuar igual)
echo [2/3] Cargando productos en la base de datos...
call npm run seed
echo.

echo [3/3] Iniciando servidor...
echo.
echo ========================================
echo   SERVIDOR CORRIENDO EN http://localhost:3000
echo ========================================
echo.
echo Endpoints disponibles:
echo   - GET  http://localhost:3000/products
echo   - POST http://localhost:3000/ai-agent/chat
echo   - POST http://localhost:3000/whatsapp/webhook
echo   - POST http://localhost:3000/whatsapp/status
echo.
echo Para probar WhatsApp necesitas:
echo   1. Configurar Twilio en .env
echo   2. Ejecutar ngrok en otra terminal: ngrok http 3000
echo   3. Configurar webhook en Twilio Console
echo.
echo Presiona Ctrl+C para detener el servidor
echo ========================================
echo.

call npm run start:dev
