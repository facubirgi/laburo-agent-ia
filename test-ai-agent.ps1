# Script de testing del Agente IA
$baseUrl = "http://localhost:3000"
$userId = "test-user-$(Get-Random -Maximum 9999)"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TESTING AI AGENT - FASE 3" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
Write-Host "User ID: $userId`n" -ForegroundColor Gray

function Send-Message {
    param (
        [string]$Message,
        [string]$TestName
    )

    Write-Host "`n--- TEST: $TestName ---" -ForegroundColor Yellow
    Write-Host "Usuario: $Message" -ForegroundColor White

    $body = @{
        userId = $userId
        message = $Message
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/ai-agent/chat" -Method Post -Body $body -ContentType "application/json"
        Write-Host "Agente: " -ForegroundColor Green -NoNewline
        Write-Host $response.agentResponse -ForegroundColor White
        return $response
    } catch {
        Write-Host "ERROR: $_" -ForegroundColor Red
        return $null
    }
}

# TEST 1: Saludo inicial
Send-Message -Message "Hola" -TestName "Saludo inicial"
Start-Sleep -Seconds 2

# TEST 2: Búsqueda de productos
Send-Message -Message "Busco pantalones verdes" -TestName "Buscar productos por color"
Start-Sleep -Seconds 3

# TEST 3: Consulta de precios
Send-Message -Message "Cuánto cuesta el primero?" -TestName "Consulta de precios (mantiene contexto)"
Start-Sleep -Seconds 3

# TEST 4: Ver productos por talla
Send-Message -Message "Tienes camisetas en talla L?" -TestName "Búsqueda por talla"
Start-Sleep -Seconds 3

# TEST 5: Crear carrito
Send-Message -Message "Quiero comprar 50 unidades del primer pantalón verde que me mostraste" -TestName "Crear carrito (function call)"
Start-Sleep -Seconds 3

# TEST 6: Modificar carrito (requiere recordar el cartId)
Send-Message -Message "Mejor cambio la cantidad a 100 unidades" -TestName "Modificar carrito"
Start-Sleep -Seconds 3

# TEST 7: Consulta sobre descuentos
Send-Message -Message "Qué descuento tengo si compro 200 unidades?" -TestName "Consulta sobre descuentos"
Start-Sleep -Seconds 2

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TESTS COMPLETADOS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
Write-Host "Para limpiar el historial ejecuta:" -ForegroundColor Gray
Write-Host "Invoke-RestMethod -Uri '$baseUrl/ai-agent/history/$userId' -Method Delete`n" -ForegroundColor Gray
