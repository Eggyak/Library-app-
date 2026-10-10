@echo off
setlocal
title NU LIRC Server - Reset Demo Data

echo.
echo  ============================================================
echo   NU LIRC Server - Reset Demo Data
echo  ============================================================
echo.
echo  WARNING: This will DELETE all library data and reset to demo state!
echo  - All books, clippings, rooms, e-resources, requests, and audit logs
echo  - Super Admin and roles will be preserved
echo  - Uploaded files will be deleted
echo.
echo  Type "RESET" (all caps) to confirm, or press Ctrl+C to cancel.
echo.

set /p CONFIRM="Confirmation: "
if "%CONFIRM%" NEQ "RESET" (
    echo.
    echo [CANCELLED] Reset aborted.
    pause
    exit /b 1
)

echo.
echo [INFO] Resetting demo data...

cd /d "%~dp0server"
if errorlevel 1 (
    echo [ERROR] Cannot find server directory.
    pause
    exit /b 1
)

:: Run the reset script
call npm.cmd run db:reset-demo
if errorlevel 1 (
    echo [ERROR] Demo data reset failed
    pause
    exit /b 1
)

echo.
echo [SUCCESS] Demo data has been reset.
echo  ============================================================
pause