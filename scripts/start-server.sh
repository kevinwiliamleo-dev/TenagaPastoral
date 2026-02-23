#!/bin/bash
set -e

echo "=========================================="
echo "  KPI Tenaga Pastoral - Local Server"
echo "=========================================="
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "[ERROR] Docker tidak ditemukan!"
    echo "Install: https://docs.docker.com/engine/install/"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "[ERROR] Docker daemon belum berjalan!"
    echo "Jalankan: sudo systemctl start docker"
    exit 1
fi

echo "[OK] Docker ditemukan"
echo ""

# Build and start
echo "[1/3] Building application..."
docker compose build --no-cache

echo ""
echo "[2/3] Starting database + application..."
docker compose up -d

echo ""
echo "[3/3] Waiting for PostgreSQL to be ready..."
sleep 10

# Run database migration and seed
echo ""
echo "[INFO] Setting up database schema..."
docker compose exec app npx prisma db push --skip-generate || {
    echo "[WARN] Retrying in 5s..."
    sleep 5
    docker compose exec app npx prisma db push --skip-generate
}

echo ""
echo "[INFO] Seeding initial data..."
docker compose exec app npx tsx prisma/seed.ts 2>/dev/null || true

echo ""
echo "=========================================="
echo "  ✅ Server berhasil dijalankan!"
echo "=========================================="
echo ""
echo "  Buka browser dan akses:"
echo "  http://localhost:3000"
echo ""
echo "  Login:"
echo "    Admin: admin@kpi.com / admin123"
echo "    Staff: pastor@kpi.com / staff123"
echo ""
echo "  Untuk mematikan: docker compose down"
echo "  Untuk melihat logs: docker compose logs -f app"
echo "=========================================="
