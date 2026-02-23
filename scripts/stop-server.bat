@echo off
chcp 65001 >nul
title KPI Tenaga Pastoral - Stop Server

echo ==========================================
echo   KPI Tenaga Pastoral - Stopping Server
echo ==========================================
echo.

docker compose down

echo.
echo [OK] Server berhasil dimatikan.
echo.
pause
