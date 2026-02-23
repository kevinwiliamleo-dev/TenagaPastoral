# Deployment Guide - Server Lokal

Panduan lengkap untuk menjalankan KPI Tenaga Pastoral di komputer server lokal.

---

## 🎯 Persyaratan

### Hardware Minimum

| Komponen | Minimum | Rekomendasi |
| -------- | ------- | ----------- |
| RAM      | 4 GB    | 8 GB        |
| CPU      | 2 cores | 4 cores     |
| Storage  | 10 GB   | 20 GB       |
| Network  | LAN     | LAN         |

### Software yang Diperlukan

| Software       | Versi  | Download                                        |
| -------------- | ------ | ----------------------------------------------- |
| Docker Desktop | Latest | https://www.docker.com/products/docker-desktop/ |
| Git (opsional) | Latest | https://git-scm.com/download/win                |

> **Catatan**: Docker Desktop sudah termasuk Docker Engine dan Docker Compose. Tidak perlu install terpisah.

---

## 🚀 Cara Setup (Pertama Kali)

### Langkah 1: Install Docker Desktop

1. Download Docker Desktop dari link di atas
2. Install dan restart komputer jika diminta
3. Buka Docker Desktop, tunggu sampai status **"Running"**

### Langkah 2: Copy Project ke Server

Copy seluruh folder project ke komputer server, misalnya:

```
D:\KPI-Pastoral\
```

### Langkah 3: Jalankan Server

**Windows**: Double-click file `scripts\start-server.bat`

**Atau via terminal**:

```powershell
cd D:\KPI-Pastoral
docker compose up -d --build
```

### Langkah 4: Setup Database (Pertama Kali Saja)

Setelah container berjalan, setup database:

```powershell
# Create tables
docker compose exec app npx prisma db push --skip-generate

# Seed data awal (admin + staff)
docker compose exec app npx tsx prisma/seed.ts
```

### Langkah 5: Akses Aplikasi

Buka browser dan akses: **http://localhost:3000**

Login credentials:

| Role  | Email          | Password |
| ----- | -------------- | -------- |
| Admin | admin@kpi.com  | admin123 |
| Staff | pastor@kpi.com | staff123 |

---

## 📋 Perintah Sehari-hari

### Menjalankan Server

```powershell
# Via script (Windows)
scripts\start-server.bat

# Via terminal
docker compose up -d
```

### Mematikan Server

```powershell
# Via script (Windows)
scripts\stop-server.bat

# Via terminal
docker compose down
```

### Melihat Logs

```powershell
# Semua logs
docker compose logs -f

# Hanya logs aplikasi
docker compose logs -f app

# Hanya logs database
docker compose logs -f postgres
```

### Cek Status

```powershell
# Status containers
docker compose ps

# Health check
curl http://localhost:3000/api/health
```

### Backup Database

```powershell
# Via script (Windows) — simpan ke folder backups/
scripts\backup-db.bat

# Manual
docker compose exec -T postgres pg_dump -U postgres kpi_pastoral > backup.sql
```

### Restore Database

```powershell
# Dari file backup
docker compose exec -T postgres psql -U postgres kpi_pastoral < backup.sql
```

---

## 🌐 Akses dari Komputer Lain (LAN)

### 1. Cari IP Address Server

```powershell
ipconfig
```

Catat **IPv4 Address** (contoh: `192.168.1.100`)

### 2. Buka Firewall Port 3000

```powershell
# Jalankan sebagai Administrator
netsh advfirewall firewall add rule name="KPI Pastoral" dir=in action=allow protocol=TCP localport=3000
```

### 3. Update AUTH_URL

Edit `docker-compose.yml`, ganti:

```yaml
AUTH_URL: http://192.168.1.100:3000
```

Lalu restart:

```powershell
docker compose down
docker compose up -d
```

### 4. Akses dari Komputer Lain

Buka browser: **http://192.168.1.100:3000**

---

## ⚙️ Konfigurasi

### Environment Variables

| Variable            | Default                 | Keterangan                      |
| ------------------- | ----------------------- | ------------------------------- |
| `POSTGRES_PASSWORD` | `KpiPastoral2026!`      | Password database               |
| `AUTH_SECRET`       | `SuperSecret...`        | Secret key untuk authentication |
| `AUTH_URL`          | `http://localhost:3000` | URL server (ganti jika via IP)  |

Untuk mengubah, edit file `docker-compose.yml` bagian `environment`.

### Port

Default port aplikasi: **3000**. Untuk mengubah, edit di `docker-compose.yml`:

```yaml
ports:
  - "8080:3000" # Akses via port 8080
```

---

## 🔧 Troubleshooting

### Server tidak bisa diakses

1. Cek Docker running: `docker compose ps`
2. Cek logs: `docker compose logs -f app`
3. Cek port tidak dipakai: `netstat -an | findstr 3000`

### Database error

1. Cek PostgreSQL: `docker compose logs postgres`
2. Restart database: `docker compose restart postgres`
3. Re-push schema: `docker compose exec app npx prisma db push --skip-generate`

### Build error

1. Clear Docker cache: `docker compose build --no-cache`
2. Hapus volumes: `docker compose down -v` (⚠️ **ini menghapus data!**)
3. Build ulang: `docker compose up -d --build`

### Login error / redirect loop

1. Pastikan `AUTH_URL` sesuai dengan URL yang diakses
2. Pastikan `AUTH_TRUST_HOST=true`
3. Restart: `docker compose restart app`

---

## 🔒 Keamanan

1. **Ganti password default**: Ubah `POSTGRES_PASSWORD` dan `AUTH_SECRET` di `docker-compose.yml`
2. **Ganti password admin**: Login sebagai admin, buka Profile, ganti password
3. **Firewall**: Hanya buka port 3000 untuk jaringan lokal
4. **Backup rutin**: Jalankan `scripts\backup-db.bat` secara berkala

---

## 📊 Monitoring

### Health Check Endpoint

```
GET http://localhost:3000/api/health
```

Response:

```json
{
  "status": "ok",
  "timestamp": "2026-02-16T12:00:00.000Z",
  "uptime": 3600,
  "database": "connected",
  "version": "2.0.0"
}
```

### Docker Resource Usage

```powershell
docker stats
```

---

## 🔄 Update Aplikasi

```powershell
# 1. Copy file project baru ke server
# 2. Rebuild dan restart
docker compose down
docker compose up -d --build

# 3. Update schema jika ada perubahan
docker compose exec app npx prisma db push --skip-generate
```

---

_Last updated: February 16, 2026_
