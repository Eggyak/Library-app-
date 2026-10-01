@echo off
setlocal enabledelayedexpansion
title NU Library App - DEBUG MODE
color 0E

echo.
echo ============================================================
echo  DEBUG MODE - Will pause at EVERY step
echo ============================================================
echo.

echo [1] Checking Node.js...
node --version
echo Exit code: %errorlevel%
pause

echo [2] Checking npm...
npm --version
echo Exit code: %errorlevel%
pause

echo [3] Changing to project directory...
cd /d "%~dp0\nu-library-app"
echo Current dir: %cd%
echo Exit code: %errorlevel%
pause

echo [4] Checking node_modules...
if exist "node_modules" (
    echo Found
) else (
    echo NOT found - will install
)
pause

echo [5] Starting Vite dev server...
echo Command: npm run dev -- --host 0.0.0.0 --port 5173
pause

npm run dev -- --host 0.0.0.0 --port 5173

echo.
echo Server process ended with exit code: %errorlevel%
pause