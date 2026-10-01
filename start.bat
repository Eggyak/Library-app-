@echo off
setlocal enabledelayedexpansion
title NU Library App - Local Development Server
color 0A

echo.
echo ============================================================
echo  NIIT UNIVERSITY LIRC - Student Library App
echo  Local Development Server with Network Access
echo ============================================================
echo.

REM Quick checks
node --version >nul 2>&1 || (echo ERROR: Node.js not found & pause & exit /b 1)
npm --version >nul 2>&1 || (echo ERROR: npm not found & pause & exit /b 1)

echo [INFO] Node: & node --version
echo [INFO] npm:  & npm --version
echo.

REM Change to project directory
cd /d "%~dp0\nu-library-app" || (echo ERROR: Folder not found & pause & exit /b 1)
echo [INFO] Dir: %cd%

REM Install deps if needed
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    npm install
    if errorlevel 1 (echo ERROR: npm install failed & pause & exit /b 1)
    echo [INFO] Done
)
echo.

REM Get local IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set "IP=%%a"
    set "IP=!IP: =!"
    if not defined LOCAL_IP set LOCAL_IP=!IP!
)
if not defined LOCAL_IP set LOCAL_IP=localhost

echo.
echo ============================================================
echo  STARTING VITE DEVELOPMENT SERVER
echo ============================================================
echo.
echo  LOCAL:      http://localhost:5173
echo  NETWORK:    http://%LOCAL_IP%:5173
echo.
echo  >>> Use NETWORK URL on phone (same WiFi) <<<
echo ============================================================
echo.

REM Start server
npm run dev -- --host 0.0.0.0 --port 5173

echo.
echo Server stopped.
pause