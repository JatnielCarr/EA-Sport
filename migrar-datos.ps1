Write-Host "📦 Iniciando migración de datos XAMPP -> Docker..." -ForegroundColor Cyan

# Recuperar mysqldump
$mysqldumpPath = "C:\xampp\mysql\bin\mysqldump.exe"
if (-not (Test-Path $mysqldumpPath)) {
    Write-Host "❌ No encontré mysqldump.exe en $mysqldumpPath" -ForegroundColor Red
    Write-Host "Por favor, edita este script y pon la ruta correcta de tu mysqldump."
    Exit
}

# 1. Verificar Bases de Datos
Write-Host "1. Verificando conexiones..." -ForegroundColor Yellow
# XAMPP (Fuente)
$tcpXampp = Test-NetConnection -ComputerName localhost -Port 3306 -WarningAction SilentlyContinue
if (-not $tcpXampp.TcpTestSucceeded) {
    Write-Host "❌ XAMPP MySQL (Puerto 3306) parece APAGADO." -ForegroundColor Red
    Write-Host "👉 Por favor, abre XAMPP Control Panel e INICIA MySQL para poder copiar los datos."
    Exit
}
# Docker (Destino)
$tcpDocker = Test-NetConnection -ComputerName localhost -Port 3307 -WarningAction SilentlyContinue
if (-not $tcpDocker.TcpTestSucceeded) {
    Write-Host "❌ Docker MySQL (Puerto 3307) parece APAGADO." -ForegroundColor Red
    Write-Host "👉 Ejecuta .\configura-todo.ps1 primero para encenderlo."
    Exit
}

# 2. Exportar
Write-Host "2. Exportando datos de XAMPP..." -ForegroundColor Yellow
$backupFile = "backup_xampp_migration.sql"

& $mysqldumpPath --host=127.0.0.1 --port=3306 --user=root --add-drop-database --databases esports_tournament_db --result-file=$backupFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backup creado: $backupFile" -ForegroundColor Green
}
else {
    Write-Host "❌ Falló la exportación. Verifica usuario/pass de XAMPP." -ForegroundColor Red
    Exit
}

# 3. Importar a Docker
Write-Host "3. Importando a Docker MySQL..." -ForegroundColor Yellow
# Usamos docker exec para inyectar el SQL directamente
Get-Content $backupFile | docker exec -i apex-mysql mysql -u root

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ ¡Datos importados exitosamente en Docker!" -ForegroundColor Green
    Write-Host "---------------------------------------------------------"
    Write-Host "⚠️  AHORA PUEDES APAGAR XAMPP MySQL PARA SIEMPRE."
    Write-Host "   Tu nueva base de datos principal es la de Docker (Puerto 3307)."
    Write-Host "---------------------------------------------------------"
}
else {
    Write-Host "❌ Falló la importación a Docker." -ForegroundColor Red
}

Remove-Item $backupFile -ErrorAction SilentlyContinue
