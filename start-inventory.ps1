# D:\project\inventory\start-inventory.ps1

Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  MENJALANKAN SISTEM INVENTARIS IT" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Pindah ke folder project
Set-Location "D:\project\inventory"
Write-Host "Folder kerja sekarang: $((Get-Location).Path)"
Write-Host ""

# 1. Backend via PM2
Write-Host "[1] Menjalankan backend lewat PM2..." -ForegroundColor Yellow
pm2 resurrect
pm2 restart inventory-api
Write-Host ""

# 2. Frontend (Vite) di jendela PowerShell baru
Write-Host "[2] Menjalankan frontend (Vite dev server)..." -ForegroundColor Yellow
# -NoExit harus jadi argumen ke powershell, bukan parameter Start-Process
Start-Process powershell `
    -WorkingDirectory "D:\project\inventory" `
    -ArgumentList "-NoExit", "-Command", "npm run dev"

Write-Host "    -> Frontend akan berjalan di http://localhost:5173"
Write-Host ""

Write-Host "=======================================" -ForegroundColor Green
Write-Host "  SEMUA SISTEM SUDAH DIJALANKAN" -ForegroundColor Green
Write-Host "  - Backend: PM2 (inventory-api)" -ForegroundColor Green
Write-Host "  - Frontend: Vite port 5173" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green
Write-Host ""

Read-Host "Tekan ENTER untuk menutup jendela ini"
