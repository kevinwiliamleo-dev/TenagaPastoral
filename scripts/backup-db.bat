@echo off
chcp 65001 >nul
title KPI Tenaga Pastoral - Backup Database

echo ==========================================
echo   KPI Tenaga Pastoral - Database Backup
echo ==========================================
echo.

:: Create backup folder
set BACKUP_DIR=%~dp0..\backups
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

:: Generate timestamp
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set TIMESTAMP=%datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2%_%datetime:~8,2%%datetime:~10,2%

set BACKUP_FILE=%BACKUP_DIR%\kpi_pastoral_%TIMESTAMP%.sql

echo [INFO] Creating backup: %BACKUP_FILE%
echo.

docker compose exec -T postgres pg_dump -U postgres kpi_pastoral > "%BACKUP_FILE%"

if %errorlevel% equ 0 (
    echo [OK] Backup berhasil disimpan!
    echo     File: %BACKUP_FILE%
) else (
    echo [ERROR] Backup gagal! Pastikan database berjalan.
)

echo.

:: Clean old backups (keep last 7)
echo [INFO] Cleaning old backups (keep last 7)...
for /f "skip=7 delims=" %%F in ('dir /b /o-d "%BACKUP_DIR%\kpi_pastoral_*.sql" 2^>nul') do (
    del "%BACKUP_DIR%\%%F"
    echo   Deleted: %%F
)

echo.
pause
