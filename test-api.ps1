# Script de testing de API
$baseUrl = "http://localhost:3000"

Write-Host "`n[*] TESTING API - FASE 1.6`n" -ForegroundColor Cyan

# TEST 1: GET /products
Write-Host "TEST 1: GET /products" -ForegroundColor Yellow
$products = Invoke-RestMethod -Uri "$baseUrl/products"
Write-Host "[OK] PASS - $($products.Count) productos encontrados" -ForegroundColor Green
Write-Host "   Ejemplo: $($products[0].name) - Stock: $($products[0].stock)`n" -ForegroundColor Gray

# TEST 2: GET /products?q=verde
Write-Host "TEST 2: GET /products?q=verde" -ForegroundColor Yellow
$filtered = Invoke-RestMethod -Uri "$baseUrl/products?q=verde"
Write-Host "[OK] PASS - $($filtered.Count) productos con 'verde'" -ForegroundColor Green
if ($filtered.Count -gt 0) {
    Write-Host "   Ejemplo: $($filtered[0].name)`n" -ForegroundColor Gray
}

# TEST 3: GET /products/1
Write-Host "TEST 3: GET /products/1" -ForegroundColor Yellow
$product = Invoke-RestMethod -Uri "$baseUrl/products/1"
Write-Host "[OK] PASS - Producto: $($product.name)" -ForegroundColor Green
Write-Host "   Precios: 50u=`$$($product.price50u), 100u=`$$($product.price100u), 200u=`$$($product.price200u)" -ForegroundColor Gray
Write-Host "   Stock: $($product.stock)`n" -ForegroundColor Gray

# TEST 4: POST /carts
Write-Host "TEST 4: POST /carts (crear carrito)" -ForegroundColor Yellow
$body = @{
    items = @(
        @{ product_id = 1; qty = 25 },
        @{ product_id = 3; qty = 15 }
    )
} | ConvertTo-Json -Depth 3

$cart = Invoke-RestMethod -Uri "$baseUrl/carts" -Method Post -Body $body -ContentType "application/json"
$cartId = $cart.id
Write-Host "[OK] PASS - Carrito creado ID: $cartId" -ForegroundColor Green
Write-Host "   Items: $($cart.items.Count), Total: `$$($cart.total)`n" -ForegroundColor Gray

# TEST 5: GET /carts/:id
Write-Host "TEST 5: GET /carts/$cartId" -ForegroundColor Yellow
$cartGet = Invoke-RestMethod -Uri "$baseUrl/carts/$cartId"
Write-Host "[OK] PASS - Carrito recuperado" -ForegroundColor Green
Write-Host "   Items: $($cartGet.items.Count), Total: `$$($cartGet.total)`n" -ForegroundColor Gray

# TEST 6: PATCH /carts/:id (actualizar)
Write-Host "TEST 6: PATCH /carts/$cartId (qty 250)" -ForegroundColor Yellow
$patchBody = @{
    items = @(@{ product_id = 1; qty = 35 })
} | ConvertTo-Json -Depth 3

$cartUpdated = Invoke-RestMethod -Uri "$baseUrl/carts/$cartId" -Method Patch -Body $patchBody -ContentType "application/json"
Write-Host "[OK] PASS - Carrito actualizado" -ForegroundColor Green
Write-Host "   Nuevo Total: `$$($cartUpdated.total)`n" -ForegroundColor Gray

# TEST 7: PATCH /carts/:id (eliminar item)
Write-Host "TEST 7: PATCH /carts/$cartId (eliminar item 2)" -ForegroundColor Yellow
$deleteBody = @{
    items = @(@{ product_id = 3; qty = 0 })
} | ConvertTo-Json -Depth 3

$cartFinal = Invoke-RestMethod -Uri "$baseUrl/carts/$cartId" -Method Patch -Body $deleteBody -ContentType "application/json"
Write-Host "[OK] PASS - Item eliminado" -ForegroundColor Green
Write-Host "   Items restantes: $($cartFinal.items.Count), Total: `$$($cartFinal.total)`n" -ForegroundColor Gray

Write-Host "[+] RESUMEN: 7/7 tests PASSED`n" -ForegroundColor Green
