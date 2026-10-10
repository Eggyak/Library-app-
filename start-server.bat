@echo off
setlocal enabledelayedexpansion
title NU LIRC Library Server

echo.
echo  ============================================================
echo   NU LIRC - Library Information and Resource Center
echo   Server Startup (Windows)
echo  ============================================================
echo.

:: ------------------------------------------------------------
:: 1. Verify prerequisites
:: ------------------------------------------------------------
where node.exe >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js 20+ is required.
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

where npm.cmd >nul 2>nul
if errorlevel 1 (
    echo [ERROR] npm not found.
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js found.

:: ------------------------------------------------------------
:: 2. Change to server directory
:: ------------------------------------------------------------
cd /d "%~dp0server"
if errorlevel 1 (
    echo [ERROR] Cannot find server directory.
    pause
    exit /b 1
)

:: ------------------------------------------------------------
:: 3. Create .env from .env.example if missing
:: ------------------------------------------------------------
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo [INFO] Created .env from .env.example
    )
)

:: ------------------------------------------------------------
:: 4. Install dependencies if needed
:: ------------------------------------------------------------
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    call npm.cmd install
    if errorlevel 1 (
        echo [ERROR] npm install failed
        pause
        exit /b 1
    )
    echo [INFO] Rebuilding better-sqlite3...
    call npm.cmd rebuild better-sqlite3
    if errorlevel 1 (
        echo [ERROR] better-sqlite3 rebuild failed
        pause
        exit /b 1
    )
)

:: ------------------------------------------------------------
:: 5. Run first-run configuration
:: ------------------------------------------------------------
echo [INFO] Running first-run configuration...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%CD%\scripts\configure-first-run.ps1"
if errorlevel 1 (
    echo [ERROR] First-run configuration failed
    pause
    exit /b 1
)

:: ------------------------------------------------------------
:: 6. Run database migrations
:: ------------------------------------------------------------
echo [INFO] Applying database migrations...
call npm.cmd run db:migrate
if errorlevel 1 (
    echo [ERROR] Database migration failed
    pause
    exit /b 1
)

:: ------------------------------------------------------------
:: 7. Read config from .env
:: ------------------------------------------------------------
set PORT=3000
set AUTH_DISABLED=false
set NGROK_AUTHTOKEN=
set NGROK_DOMAIN=

if exist ".env" (
    for /f "usebackq tokens=1,2 delims==" %%a in (`.env`) do (
        if "%%a"=="PORT" set PORT=%%b
        if "%%a"=="AUTH_DISABLED" set AUTH_DISABLED=%%b
        if "%%a"=="NGROK_AUTHTOKEN" set NGROK_AUTHTOKEN=%%b
        if "%%a"=="NGROK_DOMAIN" set NGROK_DOMAIN=%%b
    )
)

:: ------------------------------------------------------------
:: 8. Get LAN IP
:: ------------------------------------------------------------
set LAN_IP=localhost
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /R "IPv4"') do (
    set LAN_IP=%%a
)
set LAN_IP=%LAN_IP: =%

:: ------------------------------------------------------------
:: 9. Start tunnel (ngrok)
:: ------------------------------------------------------------
set TUNNEL_URL=
if /I "%AUTH_DISABLED%"=="true" (
    echo [WARN] Authentication is disabled. Skipping public tunnel to keep the API local-only.
) else if defined NGROK_AUTHTOKEN (
    where ngrok.exe >nul 2>nul
    if not errorlevel 1 (
        echo [INFO] Starting ngrok tunnel...
        if defined NGROK_DOMAIN (
            start "ngrok" /B ngrok http --domain=%NGROK_DOMAIN% %PORT%
        ) else (
            start "ngrok" /B ngrok http %PORT%
        )
        timeout /t 3 >nul
        for /f "tokens=*" %%u in ('curl -s http://127.0.0.1:4040/api/tunnels ^| powershell -NoProfile -Command "try { ($input | ConvertFrom-Json).tunnels[0].public_url } catch { '' }"') do set TUNNEL_URL=%%u
        if defined TUNNEL_URL (
            echo [OK] ngrok tunnel active: %TUNNEL_URL%
        ) else (
            echo [WARN] ngrok tunnel may still be starting
        )
    ) else (
        echo [WARN] ngrok not found. Install from https://ngrok.com/download
    )
) else (
    echo [INFO] No tunnel configured. LAN-only mode.
)

:: ------------------------------------------------------------
:: 10. Add Firewall rule
:: ------------------------------------------------------------
echo [INFO] Firewall rule check...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%CD%\scripts\check-firewall.ps1" -Port %PORT%

:: ------------------------------------------------------------
:: 11. Start server in background and wait for health
:: ------------------------------------------------------------
echo [INFO] Starting server on port %PORT%...
start "NULIRC-Server" /B cmd /c "npm.cmd start"

echo [INFO] Waiting for health check...
set HEALTH_OK=0
for /l %%i in (1,1,30) do (
    curl -s -f http://127.0.0.1:%PORT%/api/v1/health >nul 2>nul
    if not errorlevel 1 (
        set HEALTH_OK=1
        goto :health_ok
    )
    timeout /t 1 >nul
)
:health_ok

if "%HEALTH_OK%"=="0" goto :health_failed

echo [OK] Server is healthy!

:: ------------------------------------------------------------
:: 12. Print connection info
:: ------------------------------------------------------------
echo.
echo  ============================================================
echo   NU LIRC Server Running
echo  ============================================================
echo   Admin Portal (LAN):   http://%LAN_IP%:%PORT%
echo   API Base URL (LAN):   http://%LAN_IP%:%PORT%/api/v1
echo   Health Check:         http://%LAN_IP%:%PORT%/api/v1/health
if defined TUNNEL_URL echo   Public URL:        %TUNNEL_URL%
if defined TUNNEL_URL echo   Admin Portal (Public): %TUNNEL_URL%
echo.
echo   Press Ctrl+C then 'N' to stop server and tunnel.
echo  ============================================================
echo.

:: ------------------------------------------------------------
:: 13. Keep window open while server runs
:: ------------------------------------------------------------
echo [INFO] Server running...
:wait_loop
timeout /t 5 >nul
tasklist /FI "IMAGENAME eq node.exe" | findstr /C:"node.exe" >nul
if not errorlevel 1 goto :wait_loop

echo [WARN] Server process ended.
pause
exit /b 0

:health_failed
echo [ERROR] Server health check failed after 30s
echo Check server for errors.
pause
exit /b 1
