@echo off
setlocal
title NU LIRC Server - Stop

echo.
echo  ============================================================
echo   Stopping NU LIRC Server and Tunnels
echo  ============================================================
echo.

:: Kill ngrok
taskkill /F /IM ngrok.exe >nul 2>nul
if not errorlevel 1 echo [OK] Stopped ngrok

:: Kill cloudflared
taskkill /F /IM cloudflared.exe >nul 2>nul
if not errorlevel 1 echo [OK] Stopped cloudflared

:: Kill tailscale funnel (tailscale itself stays running)
tailscale funnel stop >nul 2>nul
if not errorlevel 1 echo [OK] Stopped Tailscale Funnel

:: Kill node server (the one running on port 3000)
:: We need to be careful to only kill the NU LIRC server
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%p >nul 2>nul
    if not errorlevel 1 echo [OK] Stopped server (PID %%p)
)

:: Also kill any npm/node processes started from the server directory
wmic process where "commandline like '%%server%%' and name='node.exe'" get ProcessId /format:csv 2>nul | findstr /V "Node" | findstr /V "ProcessId" | for /f "tokens=2 delims=," %%p in ('more') do (
    taskkill /F /PID %%p >nul 2>nul
    if not errorlevel 1 echo [OK] Stopped server process (PID %%p)
)

echo.
echo [INFO] All NU LIRC processes stopped.
echo  ============================================================
pause