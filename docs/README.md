# Sistem Evaluasi Kinerja Tenaga Pastoral — Developer Documentation

> Dokumentasi lengkap untuk developer yang ingin memahami, menjalankan, dan melanjutkan pengembangan project ini.

_Last Updated: 21 Februari 2026_

---

## 📋 Deskripsi Project

Sistem evaluasi kinerja 360° untuk tenaga pastoral (pendeta, staf gereja), dibangun dengan Next.js 15.

### Fitur Utama

| Fitur                          | Deskripsi                                                     |
| ------------------------------ | ------------------------------------------------------------- |
| **Multi-role Evaluation**      | Self-assessment, peer review, supervisor evaluation           |
| **Goal Approval Flow**         | Staff propose target → Admin review → Approve/Revise/Reject   |
| **Dynamic Evaluation Periods** | Admin buat periode, tentukan pertanyaan, kelola siklus        |
| **Composite Scoring**          | Bobot kustom: Activity, Pillar, Task, Consistency, Evaluation |
| **Dashboard Analytics**        | Visualisasi hasil, tren, ranking, heatmap                     |
| **Multi-language**             | Indonesia & English (next-intl) + DB wording override         |
| **Calendar & Tasks**           | Kanban board, deadline tracking, kalender kegiatan            |
| **In-App Notifications**       | Notifikasi otomatis untuk tugas, evaluasi, dan goal approval  |

---

## 🛠️ Tech Stack

| Layer     | Technology                         |
| --------- | ---------------------------------- |
| Framework | Next.js 15.5 (App Router)          |
| Language  | TypeScript 5                       |
| Styling   | Tailwind CSS 3.4                   |
| Database  | PostgreSQL (local/Docker)          |
| ORM       | Prisma 5.22                        |
| Auth      | NextAuth.js v5 (beta.30)           |
| Icons     | Material Symbols Outlined (Google) |
| Font      | Inter (Google Fonts)               |
| Theme     | next-themes (dark/light)           |
| i18n      | next-intl (ID/EN)                  |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+
- **npm** 9+
- **Docker & Docker Compose** (untuk database/deployment)

### Setup Development

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env: isi DATABASE_URL dan AUTH_SECRET

# 3. Generate Prisma Client
npx prisma generate

# 4. Push schema ke database
npx prisma db push

# 5. Seed data (admin + staff user)
npx prisma db seed

# 6. Jalankan dev server
npm run dev
```

### Login Credentials

| Role  | Email          | Password |
| ----- | -------------- | -------- |
| Admin | admin@kpi.com  | admin123 |
| Staff | pastor@kpi.com | staff123 |

### Common Commands

```bash
npm run dev              # Development server
npx tsc --noEmit         # TypeScript check
npx prisma generate      # Regenerate Prisma client
npx prisma db push       # Sync schema ke database
npx prisma studio        # Open database GUI (localhost:5555)
npx prisma db seed       # Seed initial data
npm run build            # Production build
```

> **⚠️ Penting**: Jika `prisma generate` gagal dengan `EPERM`, stop dev server terlebih dahulu (Ctrl+C).

---

## 📁 Struktur Project

```
KPI Tenaga Pastoral/
├── docs/                        # Dokumentasi (file ini)
├── prisma/
│   ├── schema.prisma            # Database schema (SUMBER KEBENARAN)
│   ├── seed.ts                  # Database seeder
│   └── reset-password.ts        # Script reset password admin
├── messages/
│   ├── id.json                  # Terjemahan Indonesia (default)
│   └── en.json                  # Terjemahan English
├── src/
│   ├── app/[locale]/
│   │   ├── (authenticated)/     # Protected routes
│   │   │   ├── admin/           # Admin-only pages
│   │   │   │   ├── activities/
│   │   │   │   ├── analytics/
│   │   │   │   ├── goal-review/ # Goal approval flow
│   │   │   │   ├── master-data/
│   │   │   │   ├── periods/
│   │   │   │   ├── scoring-config/
│   │   │   │   ├── tasks/
│   │   │   │   ├── users/
│   │   │   │   └── wording/
│   │   │   ├── calendar/
│   │   │   ├── dashboard/
│   │   │   ├── evaluations/
│   │   │   ├── goals/           # Staff goals (with approval)
│   │   │   ├── leaderboard/
│   │   │   ├── notifications/
│   │   │   ├── panca-tugas/
│   │   │   ├── profile/
│   │   │   ├── reports/
│   │   │   ├── results/
│   │   │   └── tasks/
│   │   ├── login/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── layout/              # Sidebar, Header, AppLayout
│   │   ├── ui/                  # Reusable UI components
│   │   ├── scoring/             # Composite score components
│   │   └── theme-provider.tsx
│   ├── lib/
│   │   ├── actions/             # 24 server action files
│   │   ├── prisma.ts            # Prisma client singleton
│   │   └── utils.ts
│   ├── i18n/                    # Internationalization config
│   ├── auth.ts                  # NextAuth configuration
│   └── middleware.ts            # Auth + i18n middleware
├── template/                    # 41 HTML design templates (referensi UI)
├── docker-compose.yml
├── Dockerfile
└── scripts/                     # start-server.bat, backup-db.bat, etc.
```

---

## 📄 Routes

> Semua route menggunakan prefix locale (`/id` atau `/en`).

### Staff Routes

| Route             | Deskripsi                           |
| ----------------- | ----------------------------------- |
| `/id/dashboard`   | Dashboard utama                     |
| `/id/panca-tugas` | Log aktivitas pastoral              |
| `/id/tasks`       | Tugas (Kanban board)                |
| `/id/goals`       | Target kerja (dengan approval flow) |
| `/id/evaluations` | Form evaluasi                       |
| `/id/results`     | Hasil evaluasi                      |
| `/id/calendar`    | Kalender kegiatan                   |
| `/id/leaderboard` | Ranking staff                       |
| `/id/profile`     | Profil pengguna                     |

### Admin Routes

| Route                              | Deskripsi                     |
| ---------------------------------- | ----------------------------- |
| `/id/admin/users`                  | Manajemen pengguna            |
| `/id/admin/master-data`            | Master data (pilar, tipe)     |
| `/id/admin/periods`                | Periode evaluasi              |
| `/id/admin/periods/[id]/questions` | Pertanyaan evaluasi           |
| `/id/admin/activities`             | Monitor aktivitas staff       |
| `/id/admin/tasks`                  | Manajemen tugas staff         |
| `/id/admin/goal-review`            | Review & approve target staff |
| `/id/admin/analytics`              | Analytics & dashboard         |
| `/id/admin/scoring-config`         | Konfigurasi bobot scoring     |
| `/id/admin/wording`                | Manajemen teks aplikasi       |
| `/id/reports`                      | Laporan & export              |

---

## 🗄️ Database Schema

> **Sumber kebenaran**: `prisma/schema.prisma`. Jangan lupa `prisma db push` setelah perubahan.

### Model Utama

| Model                  | Table                  | Deskripsi                                |
| ---------------------- | ---------------------- | ---------------------------------------- |
| `User`                 | users                  | Akun pengguna (Admin/Staff)              |
| `EvaluationPeriod`     | evaluation_periods     | Periode evaluasi (DRAFT→ACTIVE→CLOSED)   |
| `Question`             | questions              | Pertanyaan evaluasi (SCALE/TEXT/BOOLEAN) |
| `EvaluationSubmission` | evaluation_submissions | Jawaban evaluasi                         |
| `PastoralActivity`     | pastoral_activities    | Log aktivitas pastoral harian            |
| `PastoralTask`         | pastoral_tasks         | Tugas dari admin ke staff                |
| `StaffGoal`            | staff_goals            | Target kerja (PENDING→ACTIVE→COMPLETED)  |
| `ScoringConfig`        | scoring_configs        | Konfigurasi bobot composite score        |
| `Notification`         | notifications          | In-app notifications                     |
| `SystemWording`        | system_wordings        | Override teks UI dari database           |
| `DevelopmentPlan`      | development_plans      | Rencana pengembangan staff               |

### Enum Penting

```prisma
enum GoalStatus   { PENDING_APPROVAL  ACTIVE  COMPLETED  CANCELLED  REJECTED }
enum PeriodStatus { DRAFT  ACTIVE  CLOSED }
enum TaskStatus   { PENDING  IN_PROGRESS  COMPLETED  CANCELLED }
enum Role         { ADMIN  PASTORAL_STAFF }
```

---

## 🔧 Server Actions

Semua business logic ada di `src/lib/actions/`:

| File                 | Fungsi Utama                                                  |
| -------------------- | ------------------------------------------------------------- |
| `user.ts`            | CRUD user, stats                                              |
| `period.ts`          | CRUD periode, status transitions                              |
| `questions.ts`       | CRUD pertanyaan, bulk create, templates                       |
| `evaluation.ts`      | Submission, scoring                                           |
| `goals.ts`           | CRUD goals, approval flow (approve/revise/reject), auto-score |
| `tasks.ts`           | CRUD tasks, assignment, Kanban                                |
| `activities.ts`      | Log aktivitas pastoral                                        |
| `scoring.ts`         | Composite score calculation, leaderboard                      |
| `notifications.ts`   | CRUD notifications, reminder helpers                          |
| `calendar.ts`        | Event aggregation                                             |
| `reports.ts`         | Report generation, charts                                     |
| `analytics.ts`       | Staff analytics aggregation                                   |
| `admin-analytics.ts` | Admin-only analytics                                          |
| `dashboard-stats.ts` | Dashboard statistics                                          |
| `wording.ts`         | System text management (cached)                               |
| `profile.ts`         | Profile update, password change                               |
| `feedback.ts`        | Comment threads on dev plans                                  |
| `master-data.ts`     | Master data CRUD                                              |

---

## 🎨 UI Development Guide

### Design Tokens

Warna didefinisikan sebagai CSS Variables di `globals.css`:

| Variable       | Light            | Dark        | Penggunaan          |
| -------------- | ---------------- | ----------- | ------------------- |
| `--primary`    | Sky blue #0ea5e9 | Sama        | Tombol utama, aksen |
| `--background` | White            | Near black  | Latar belakang      |
| `--foreground` | Near black       | White       | Teks utama          |
| `--muted`      | Light gray       | Dark gray   | Teks sekunder       |
| `--card`       | White            | Near black  | Background kartu    |
| `--border`     | Border gray      | Dark border | Garis pembatas      |

### Typography & Icons

- **Font**: Inter (via `next/font/google`)
- **Icons**: Material Symbols Outlined — `<span class="material-symbols-outlined">icon_name</span>`
- **Filled variant**: Tambah class `fill-1` untuk active state
- **Reference**: https://fonts.google.com/icons

### Component Patterns

```jsx
// Card
<div className="rounded-xl border border-border bg-card p-6 shadow-sm">...</div>

// Primary Button
<button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">

// Status Badge
<span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
  Aktif
</span>

// Form Input with Icon
<div className="relative">
  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">mail</span>
  <input className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-muted focus:ring-2 focus:ring-primary/20" />
</div>
```

### Dark Mode

Gunakan CSS variables — otomatis switch. **Jangan** hardcode warna (`bg-white`, `text-gray-900`).

```jsx
// ✅ Benar
<div className="bg-background text-foreground">
// ❌ Salah
<div className="bg-white text-gray-900">
```

---

## 🌐 Internationalization (i18n)

### Arsitektur

1. `next-intl` dengan routing middleware (`/id/...`, `/en/...`)
2. Teks default: `messages/id.json` dan `messages/en.json`
3. **Override dari database**: Admin bisa ubah teks via `/admin/wording` tanpa edit file
4. Alur: `getMergedMessages()` → load file JSON → merge dengan override DB → return

### Usage

```tsx
import { useTranslations } from "next-intl";
const t = useTranslations("Dashboard");
return <h1>{t("welcome")}</h1>;

// Routing — gunakan Link dari i18n, BUKAN next/link
import { Link } from "@/i18n/navigation";
<Link href="/dashboard">Dashboard</Link>;
```

---

## 🔒 Authentication Flow

1. User submit form di `/login`
2. `signIn("credentials", ...)` dari NextAuth
3. `authorize()` di `auth.ts` → Prisma `findUnique()` → bcrypt compare
4. Session disimpan → redirect ke `/dashboard`
5. Middleware check session + locale routing

### Role-Based Access

- `session.user.role === "ADMIN"` → akses semua fitur admin
- `session.user.role === "PASTORAL_STAFF"` → akses fitur staff saja
- Sidebar otomatis filter menu berdasarkan role

---

## 🚢 Deployment (Docker)

> Lihat [DEPLOYMENT.md](./DEPLOYMENT.md) untuk panduan lengkap step-by-step.

### Quick Deploy

```powershell
# 1. Install Docker Desktop
# 2. Copy project ke server
# 3. Jalankan
docker compose up -d --build

# 4. Setup database (pertama kali)
docker compose exec app npx prisma db push --skip-generate
docker compose exec app npx tsx prisma/seed.ts

# 5. Akses: http://localhost:3000
```

### Akses dari LAN

1. Cari IP server: `ipconfig`
2. Buka firewall port 3000
3. Update `AUTH_URL` di `docker-compose.yml` ke `http://IP_SERVER:3000`
4. Akses: `http://IP_SERVER:3000`

---

## ⚠️ Troubleshooting

| Masalah                                               | Solusi                                                            |
| ----------------------------------------------------- | ----------------------------------------------------------------- |
| `EPERM: operation not permitted` saat prisma generate | Stop dev server (Ctrl+C) dulu                                     |
| Login gagal / password lupa                           | `npx dotenv -e .env -- npx tsx prisma/reset-password.ts`          |
| Port 3000 sudah digunakan                             | Kill process: `taskkill /PID [PID] /F` atau auto-fallback ke 3001 |
| `Cannot find module '@prisma/client'`                 | Jalankan `npx prisma generate`                                    |
| `Column does not exist` error                         | `npx prisma db push` untuk sync schema                            |
| Redirect loop setelah login                           | Pastikan `AUTH_URL` match dengan URL yang diakses                 |

---

## 🗂️ Workflow Development

### Menambah Kolom Database

1. Edit `prisma/schema.prisma`
2. `npx prisma generate`
3. `npx prisma db push`
4. Update server actions yang relevan

### Membuat Halaman Baru

1. Buat `src/app/[locale]/(authenticated)/[route]/page.tsx` (server component)
2. Buat `*-client.tsx` untuk interaktif (client component)
3. Check session/role di server component
4. Tambahkan nav item di `sidebar.tsx` + translations di `messages/*.json`

### Menambah Server Action

1. Buat/edit file di `src/lib/actions/[name].ts`
2. Tambah `"use server"` di baris pertama
3. Gunakan Prisma Client (bukan raw SQL) untuk queries
4. Gunakan `revalidatePath()` untuk refresh data setelah mutasi

---

## 📎 Template & Design Reference

- **HTML Templates**: 41 file di `/template/` — buka di browser untuk preview UI
- **Design Handoff**: Lihat [UI_UX_DESIGN_HANDOFF.md](./UI_UX_DESIGN_HANDOFF.md) untuk spec per-halaman
- **Shadcn UI**: https://ui.shadcn.com (pattern reference)
- **Icons**: https://fonts.google.com/icons (Material Symbols)
