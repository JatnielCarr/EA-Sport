# start-n8n.ps1 - Script para iniciar n8n con la URL de Cloudflare correcta
# Uso: .\start-n8n.ps1

Write-Host "🚀 Iniciando n8n + Cloudflare Tunnel..." -ForegroundColor Cyan

# 1. Bajar todo primero
docker compose down 2>$null

# 2. Levantar solo el tunel primero
Write-Host "🌐 Levantando túnel de Cloudflare..." -ForegroundColor Yellow
docker compose up -d tunnel
Start-Sleep -Seconds 12

# 3. Obtener la URL del tunel - guardar logs en archivo temporal
$tempFile = "$env:TEMP\cf_tunnel.log"
docker logs cloudflare-tunnel 2>$tempFile
$content = [System.IO.File]::ReadAllText($tempFile)

# Limpiar caracteres de control y espacios extra
$clean = $content -replace '\s+', ' '

$tunnelUrl = $null
if ($clean -match '(https://[\w-]+\.trycloudflare\.com)') {
    $tunnelUrl = $Matches[1]
}

if (-not $tunnelUrl) {
    Write-Host "❌ No se pudo obtener la URL del túnel automáticamente." -ForegroundColor Red
    Write-Host ""
    Write-Host "📋 Revisa manualmente: docker logs cloudflare-tunnel" -ForegroundColor Yellow
    Write-Host "   Busca la linea con 'trycloudflare.com'" -ForegroundColor Yellow
    Write-Host "   Luego edita docker-compose.yml y cambia WEBHOOK_URL" -ForegroundColor Yellow
    
    # Levantar n8n de todas formas
    docker compose up -d n8n
    exit 0
}

Write-Host "✅ URL del túnel: $tunnelUrl" -ForegroundColor Green

# 4. Actualizar docker-compose con la URL correcta
$compose = Get-Content "docker-compose.yml" -Raw
$compose = $compose -replace 'WEBHOOK_URL=https://[\w-]+\.trycloudflare\.com/', "WEBHOOK_URL=$tunnelUrl/"
Set-Content "docker-compose.yml" -Value $compose -NoNewline

# 5. Levantar n8n con la URL correcta
Write-Host "🤖 Levantando n8n..." -ForegroundColor Yellow
docker compose up -d n8n
Start-Sleep -Seconds 5

# 6. Verificar
$webhookEnv = docker exec n8n-apex-tournament printenv WEBHOOK_URL 2>&1 | Out-String
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  n8n:       http://localhost:5678" -ForegroundColor Green
Write-Host "  Webhook:   $tunnelUrl" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Ahora ve a n8n y REACTIVA tu workflow" -ForegroundColor Yellow
Write-Host "(desactiva y vuelve a activar el toggle)" -ForegroundColor Yellow
