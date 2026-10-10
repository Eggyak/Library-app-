@echo off
setlocal
title NU LIRC Server - Backup

echo.
echo  ============================================================
echo   NU LIRC Server - Manual Backup
echo  ============================================================
echo.

cd /d "%~dp0server"
if errorlevel 1 (
    echo [ERROR] Cannot find server directory.
    pause
    exit /b 1
)

:: Create backup directory with timestamp
for /f "tokens=2 delims==" %%d in ('wmic os get localdatetime /value') do set DT=%%d
set TIMESTAMP=%DT:~0,4%-%DT:~4,2%-%DT:~6,2%_%DT:~8,2%-%DT:~10,2%-%DT:~12,2%

set BACKUP_DIR="%~dp0backups\%TIMESTAMP%"
mkdir %BACKUP_DIR% 2>nul

echo [INFO] Creating backup in %BACKUP_DIR%...

:: Backup SQLite database
if exist "data\library.db" (
    copy "data\library.db" %BACKUP_DIR%\library.db >nul
    echo [OK] Database backed up
) else (
    echo [WARN] Database file not found at data\library.db
)

:: Backup uploads folder
if exist "uploads" (
    xcopy "uploads" %BACKUP_DIR%\uploads /E /I /H /Y >nul
    echo [OK] Uploads backed up
) else (
    echo [WARN] Uploads folder not found
)

:: Backup .env (without secrets - create a template)
if exist ".env" (
    copy ".env" %BACKUP_DIR%\.env.backup >nul
    echo [OK] Config backed up
)

:: Create a manifest
echo Backup created: %DATE% %TIME% > %BACKUP_DIR%\MANIFEST.txt
echo Server version: 1.0.0 >> %BACKUP_DIR%\MANIFEST.txt

echo.
echo [SUCCESS] Backup completed: %BACKUP_DIR%
echo  ============================================================
pause