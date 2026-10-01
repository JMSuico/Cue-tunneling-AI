@echo off
title CUE Tunnel API
color 0F
cd /d "%~dp0"

REM If user passed arguments on command line, bypass interactive menu
if not "%~1"=="" goto RUN_CUSTOM_ARGS

:MENU
cls
echo.
echo  ========================================================
echo    CUE TUNNEL API -- MASTER LAUNCHER
echo  ========================================================
echo.
echo    Choose how you want to start the tunnel:
echo.
echo    [1] Option A: CLI Mode (Antigravity Subscription) [RECOMMENDED]
echo        - Uses your active Antigravity account directly
echo        - No API key required
echo        - Includes heartbeat to prevent CUE 25s timeout
echo.
echo    [2] Option B: SDK Mode (Python SDK)
echo        - Python google-antigravity bridge
echo        - Requires GEMINI_API_KEY environment variable
echo.
echo    [3] Run Connection Test ^& Diagnostics (test.js)
echo.
echo    [4] Kill Process on Port 5678 (Free Port)
echo.
echo    [5] Exit
echo.
echo  ========================================================
echo    Auto-launching Option A in 5 seconds...
echo  ========================================================
choice /C 12345 /T 5 /D 1 /M "Select an option"

if errorlevel 5 goto EXIT_SCRIPT
if errorlevel 4 goto RUN_KILL_PORT
if errorlevel 3 goto RUN_TEST
if errorlevel 2 goto RUN_OPTION_B
if errorlevel 1 goto RUN_OPTION_A

:RUN_OPTION_A
echo.
echo  Starting Option A (CLI Mode)...
call "%~dp0Option-A-CLI.bat"
goto EXIT_SCRIPT

:RUN_OPTION_B
echo.
echo  Starting Option B (SDK Mode)...
call "%~dp0Option-B-SDK.bat"
goto EXIT_SCRIPT

:RUN_TEST
cls
echo.
echo  ========================================================
echo    CUE TUNNEL API -- CONNECTION TEST
echo  ========================================================
echo.
call node test.js
echo.
pause
goto MENU

:RUN_KILL_PORT
cls
call "%~dp0kill-port.bat"
goto MENU

:RUN_CUSTOM_ARGS
cls
echo.
echo  ========================================================
echo    CUE TUNNEL API -- STARTING WITH ARGUMENTS: %*
echo  ========================================================
echo.

REM Common preflight checks
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    pause
    exit /b 1
)

if not exist "node_modules\express" (
    echo [SETUP] Installing npm dependencies...
    call npm install --no-audit --no-fund
)

if not exist "scratch" mkdir "scratch"

where agy >nul 2>nul
if %errorlevel% neq 0 (
    if exist "%LOCALAPPDATA%\agy\bin\agy.exe" (
        set "PATH=%LOCALAPPDATA%\agy\bin;%PATH%"
    )
)

powershell -NoProfile -Command "$p=(Get-NetTCPConnection -LocalPort 5678 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique); if ($p) { $p | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }; Write-Host '  [AUTO-CLEAN] Port 5678 freed.' -ForegroundColor Yellow; }"

node server.js %*
pause

:EXIT_SCRIPT
