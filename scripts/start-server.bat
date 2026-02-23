@echo off
chcp 65001 >nul
title KPI Tenaga Pastoral - Server

echo ==========================================
echo   KPI Tenaga Pastoral - Local Server
echo ==========================================
echo.

:: Check Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker tidak ditemukan!
    echo.
    echo Silakan install Docker Desktop dari:
    echo   https://www.docker.com/products/docker-desktop/
    echo.
    pause
    exit /b 1
)

:: Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Desktop belum berjalan!
    echo Silakan buka Docker Desktop terlebih dahulu.
    echo.
    pause
    exit /b 1
)

echo [OK] Docker ditemukan
echo.

:: Build and start
echo [1/3] Building application...
docker compose build --no-cache
if %errorlevel% neq 0 (
    echo [ERROR] Build gagal!
    pause
    exit /b 1
)

echo.
echo [2/3] Starting database + application...
docker compose up -d
if %errorlevel% neq 0 (
    echo [ERROR] Gagal menjalankan services!
    pause
    exit /b 1
)

echo.
echo [3/3] Waiting for PostgreSQL to be ready...
timeout /t 10 /nobreak >nul

:: Run database migration and seed
echo.
echo [INFO] Setting up database schema...
docker compose exec app npx prisma db push --skip-generate 2>nul
if %errorlevel% neq 0 (
    echo [WARN] Prisma db push failed, retrying in 5s...
    timeout /t 5 /nobreak >nul
    docker compose exec app npx prisma db push --skip-generate
)

echo.
echo [INFO] Seeding initial data...
docker compose exec app npx tsx prisma/seed.ts 2>nul

echo.
echo ==========================================
echo   ✅ Server berhasil dijalankan!
echo ==========================================
echo.
echo   Buka browser dan akses:
echo   http://localhost:3000
echo.
echo   Login:
echo     Admin: admin@kpi.com / admin123
echo     Staff: pastor@kpi.com / staff123
echo.
echo   Untuk mematikan server:
echo     docker compose down
echo.
echo   Untuk melihat logs:
echo     docker compose logs -f app
echo ==========================================
echo.
pause
