# KI_DRW_V1 Start Script for PowerShell
Write-Host "========================================"
Write-Host "  KI_DRW_V1 - CATIA V5 CATPart Manager"
Write-Host "========================================"
Write-Host ""
Write-Host "Starting Backend and Frontend servers..."
Write-Host ""

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path

# Start Backend in a new PowerShell window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$scriptPath\backend'; node server.js" -WindowStyle Normal

# Wait a moment for backend to start
Start-Sleep -Seconds 2

# Start Frontend in a new PowerShell window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$scriptPath\frontend'; npm start" -WindowStyle Normal

Write-Host ""
Write-Host "Servers are starting..."
Write-Host ""
Write-Host "Backend:  http://localhost:3001"
Write-Host "Frontend: http://localhost:3000"
Write-Host ""
Write-Host "Press any key to close this launcher..."
Write-Host "(The servers will continue running in their own windows)"
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
