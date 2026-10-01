@echo off
title CUE Tunnel API - Option A (CLI Mode)
color 0A
cd /d "%~dp0"

echo.
echo  ========================================================
echo    CUE TUNNEL API -- OPTION A (CLI MODE)
echo  ========================================================
echo.

REM --- 1. Check Node.js ---
echo  [1/5] Checking Node.js installation...
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo  ========================================================
    echo    ERROR: Node.js is not installed or not in PATH!
    echo.
    echo    Please install Node.js v18 or newer from:
    echo      https://nodejs.org/
    echo    Then double-click this file again.
    echo  ========================================================
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node -v 2^>nul') do echo        Found Node.js %%v

REM --- 2. Check and Install Dependencies ---
echo  [2/5] Checking dependencies: express...
if not exist "node_modules\express" (
    echo        Dependencies missing. Running npm install...
    call npm install --no-audit --no-fund
    if %errorlevel% neq 0 (
        color 0C
        echo.
        echo  ========================================================
        echo    ERROR: npm install failed!
        echo  ========================================================
        echo.
        pause
        exit /b 1
    )
    echo        Dependencies installed successfully.
) else (
    echo        Dependencies are ready.
)

REM --- 3. Check Scratch Directory ---
echo  [3/5] Checking workspace environment...
if not exist "scratch" mkdir "scratch"
echo        Scratch workspace directory ready.

REM --- 4. Check Antigravity CLI (agy) ---
echo  [4/5] Checking Antigravity CLI: agy...
where agy >nul 2>nul
if %errorlevel% neq 0 (
    if exist "%LOCALAPPDATA%\agy\bin\agy.exe" (
        set "PATH=%LOCALAPPDATA%\agy\bin;%PATH%"
        echo        Located agy at %LOCALAPPDATA%\agy\bin
    ) else (
        echo        WARNING: agy was not found in PATH or standard location.
        echo        If agy fails, ensure Antigravity CLI is installed.
    )
) else (
    echo        Antigravity CLI [agy] found in PATH.
)

REM --- 5. Clean / Free Port 5678 ---
echo  [5/5] Checking Port 5678 availability...
powershell -NoProfile -Command "$p=(Get-NetTCPConnection -LocalPort 5678 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique); if ($p) { $p | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }; Write-Host '       [AUTO-CLEAN] Freed Port 5678 (stopped previous process).' -ForegroundColor Yellow; } else { Write-Host '       Port 5678 is free.' -ForegroundColor Green; }"

REM --- Ready Banner ---
echo.
echo  ========================================================
echo    READY TO SERVE CUE
echo  ========================================================
echo    * Mode:       Option A [Antigravity CLI Subscription]
echo    * Auth:       Uses your active Antigravity login
echo    * Local URL:  http://localhost:5678/v1
echo    * CUE Model:  antigravity
echo    * Keep-Alive: Active [heartbeat prevents CUE 25s timeout]
echo  ========================================================
echo.
echo    In CUE Settings:
echo      - Provider:     Custom
echo      - Base URL:     http://localhost:5678/v1
echo      - Fast / Smart: antigravity
echo.
echo  ========================================================
echo    Starting server... Press Ctrl+C to stop.
echo  ========================================================
echo.

node server.js --mode=cli

echo.
echo  ========================================================
echo    Server has stopped.
echo  ========================================================
echo.
pause
