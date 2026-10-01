@echo off
title Kill Port 5678
color 0E
echo.
echo  ================================================
echo    Kill Process Using Port 5678
echo  ================================================
echo.

set PORT=%1
if "%PORT%"=="" set PORT=5678
if "%PORT%"=="--no-pause" set PORT=5678& set NOPAUSE=1
if "%2"=="--no-pause" set NOPAUSE=1

echo  Checking if port %PORT% is in use...
echo.

powershell -NoProfile -Command "$pids = (Get-NetTCPConnection -LocalPort %PORT% -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique); if ($pids) { foreach ($id in $pids) { $p = Get-Process -Id $id -ErrorAction SilentlyContinue; Write-Host ('  Found process PID {0} ({1}) on port %PORT%' -f $id, $p.ProcessName) -ForegroundColor Yellow; Stop-Process -Id $id -Force -ErrorAction SilentlyContinue; Write-Host ('  [SUCCESS] Killed process PID {0}' -f $id) -ForegroundColor Green; } Write-Host ''; Write-Host ('  Port %PORT% is now FREE!') -ForegroundColor Green; } else { Write-Host ('  Port %PORT% is already free! No process to kill.') -ForegroundColor Cyan; }"

echo.
echo  ================================================
echo.
if not "%NOPAUSE%"=="1" pause
