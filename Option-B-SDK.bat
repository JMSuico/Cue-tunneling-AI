@echo off
title CUE Tunnel API - Option B (SDK Mode)
color 0B
cd /d "%~dp0"

echo.
echo  ========================================================
echo    CUE TUNNEL API -- OPTION B (SDK MODE)
echo  ========================================================
echo.

REM --- 1. Check Node.js ---
echo  [1/6] Checking Node.js installation...
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

REM --- 2. Check and Install Node Dependencies ---
echo  [2/6] Checking Node dependencies: express...
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
    echo        Node dependencies installed successfully.
) else (
    echo        Node dependencies are ready.
)

REM --- 3. Check Python ---
echo  [3/6] Checking Python installation...
where python >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo  ========================================================
    echo    ERROR: Python is not installed or not in PATH!
    echo.
    echo    Please install Python 3.10+ from:
    echo      https://www.python.org/
    echo    Be sure to check Add Python to PATH during setup.
    echo  ========================================================
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('python --version 2^>nul') do echo        Found %%v

REM --- 4. Check Antigravity Python SDK ---
echo  [4/6] Checking Antigravity Python SDK...
python -c "import google.antigravity" 2>nul
if %errorlevel% neq 0 (
    echo        Antigravity SDK not found. Installing via pip...
    pip install google-antigravity
    if %errorlevel% neq 0 (
        color 0C
        echo.
        echo  ========================================================
        echo    ERROR: pip install google-antigravity failed!
        echo  ========================================================
        echo.
        pause
        exit /b 1
    )
    echo        Antigravity SDK installed successfully.
) else (
    echo        Antigravity SDK is installed.
)

REM --- 5. Check GEMINI_API_KEY ---
echo  [5/6] Checking Gemini API Key...
if "%GEMINI_API_KEY%"=="" (
    echo        [NOTE] GEMINI_API_KEY is not set in environment.
    echo               SDK mode requires a Gemini API key.
    echo               The server will automatically fall back to Option A
    echo               using your Antigravity subscription so CUE still works!
) else (
    echo        GEMINI_API_KEY is configured.
)

REM --- 6. Clean / Free Port 5678 ---
echo  [6/6] Checking Port 5678 availability...
powershell -NoProfile -Command "$p=(Get-NetTCPConnection -LocalPort 5678 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique); if ($p) { $p | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }; Write-Host '       [AUTO-CLEAN] Freed Port 5678 (stopped previous process).' -ForegroundColor Yellow; } else { Write-Host '       Port 5678 is free.' -ForegroundColor Green; }"

REM --- Ready Banner ---
echo.
echo  ========================================================
echo    READY TO SERVE CUE
echo  ========================================================
echo    * Mode:       Option B [Python SDK Mode]
echo    * Bridge:     sdk_bridge.py
echo    * Local URL:  http://localhost:5678/v1
echo    * CUE Model:  antigravity
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

node server.js --mode=sdk

echo.
echo  ========================================================
echo    Server has stopped.
echo  ========================================================
echo.
pause
