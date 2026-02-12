# Script para iniciar el bot de Telegram
# Opción 1: Modo Polling (desarrollo local) - RECOMENDADO
# Opción 2: n8n con túnel HTTPS (producción)

param(
    [Parameter()]
    [ValidateSet("polling", "n8n")]
    [string]$Mode = "polling"
)

if ($Mode -eq "polling") {
    Write-Host ""
    Write-Host "🤖 Iniciando ApexTournament Telegram Bot (Modo Polling)..." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📋 Comandos disponibles en el bot:" -ForegroundColor Yellow
    Write-Host "   /start    - Iniciar el bot"
    Write-Host "   /torneos  - Ver torneos activos"
    Write-Host "   /ranking  - Ver top 10 jugadores"
    Write-Host "   /juegos   - Ver juegos disponibles"
    Write-Host "   /proximas - Ver próximas partidas"
    Write-Host "   /envivo   - Ver partidas en vivo"
    Write-Host "   /stats    - Ver tus estadísticas"
    Write-Host "   /reglas   - Ver reglas generales"
    Write-Host "   /ayuda    - Mostrar ayuda"
    Write-Host ""
    Write-Host "Presiona Ctrl+C para detener el bot" -ForegroundColor Gray
    Write-Host ""
    
    # Ejecutar el bot
    npx ts-node src/telegram-bot.ts
}
else {
    # Modo n8n original
    Write-Host "🚀 Iniciando n8n y túnel Cloudflare..." -ForegroundColor Cyan
    
    # Iniciar contenedores
    docker-compose up -d

    # Esperar a que el túnel genere la URL
    Write-Host "⏳ Esperando URL del túnel (10 segundos)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10

    # Obtener la URL del túnel
    $logs = docker logs cloudflare-tunnel 2>&1
    $urlMatch = $logs | Select-String -Pattern "https://[a-zA-Z0-9-]+\.trycloudflare\.com" | Select-Object -Last 1

    if ($urlMatch) {
        $url = $urlMatch.Matches[0].Value
        Write-Host ""
        Write-Host "============================================" -ForegroundColor Green
        Write-Host "✅ Tu URL HTTPS para n8n es:" -ForegroundColor Green
        Write-Host ""
        Write-Host "   $url" -ForegroundColor White -BackgroundColor DarkGreen
        Write-Host ""
        Write-Host "============================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 PASOS SIGUIENTES:" -ForegroundColor Cyan
        Write-Host "1. Abre n8n: http://localhost:5678"
        Write-Host "2. Ve a tu workflow de Telegram"
        Write-Host "3. Si ya publicaste antes, despublica y vuelve a publicar"
        Write-Host "4. Prueba enviando un mensaje a tu bot en Telegram"
        Write-Host ""
        
        # Copiar al portapapeles
        $url | Set-Clipboard
        Write-Host "📎 URL copiada al portapapeles!" -ForegroundColor Magenta
    } else {
        Write-Host "❌ No se pudo obtener la URL del túnel. Verifica con:" -ForegroundColor Red
        Write-Host "   docker logs cloudflare-tunnel"
    }
}