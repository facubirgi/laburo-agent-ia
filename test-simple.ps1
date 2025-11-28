Write-Host "Esperando compilacion..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

$body = @{
    userId = "test-gemini-15-pro"
    message = "Hola, tienes pantalones verdes?"
} | ConvertTo-Json

Write-Host "`nProbando con gemini-1.5-pro..." -ForegroundColor Cyan
Write-Host "Enviando mensaje al agente..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/ai-agent/chat" -Method Post -Body $body -ContentType "application/json"
    Write-Host "`n=== RESPUESTA DEL AGENTE ===" -ForegroundColor Green
    Write-Host $response.agentResponse -ForegroundColor White
    Write-Host "`n=== SUCCESS ===" -ForegroundColor Green
} catch {
    Write-Host "`n=== ERROR ===" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
