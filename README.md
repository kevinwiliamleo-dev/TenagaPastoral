# Sistem KPI Tenaga Pastoral 📊

Sistem manajemen kinerja dan evaluasi untuk tenaga pastoral, dirancang untuk memantau aktivitas, mengelola tugas, dan memfasilitasi proses evaluasi kinerja secara transparan dan terstruktur.

## 🚀 Fitur Utama

### 1. 📱 Dashboard & Monitoring

- **Unified Command Center**: Ringkasan statistik, status evaluasi, dan grafik kinerja (Merged from Performance Page).
- **Activity Heatmap**: Visualisasi intensitas aktivitas harian.
- **Timeline & Calendar**: Tampilan jadwal evaluasi, deadline tugas, dan target pribadi.

### 2. 📝 Evaluasi Kinerja (360 Degree)

- **Multi-Period Evaluation**: Manajemen periode evaluasi (Draft, Active, Closed).
- **Customizable Templates**: Template pertanyaan fleksibel (Skala, Teks, Boolean).
- **Self & Peer Assessment**: Evaluasi diri sendiri dan oleh atasan/admin.
- **Report Generation**: Eksport laporan hasil evaluasi ke PDF.

### 3. 🎯 Panca Tugas (Activity Logging)

- Pencatatan aktivitas berdasarkan 5 pilar (Liturgia, Diakonia, Kerygma, Koinonia, Martyria).
- Tracking durasi dan detail kegiatan.

### 4. ✅ Task Management

- Penugasan tugas dari Admin ke Staff.
- Status tracking (Todo, In Progress, Completed).
- Prioritas dan Deadline.

### 5. 🗣️ Feedback & Development

- **Development Plans**: Rencana pengembangan karir (Strengths, Improvements).
- **Interactive Feedback**: Komentar dan diskusi pada hasil evaluasi.

### 6. 🌍 Multi-language Support

- Dukungan Bahasa Indonesia (Default) dan Inggris.
- Switcher bahasa instan tanpa reload.

### 7. 🏆 Composite Score & Leaderboard

- Scoring komposit otomatis dengan 5 komponen berbobot (Activity, Pillar, Task, Consistency, Evaluation).
- Admin dapat konfigurasi bobot di halaman **Scoring Config**.
- Peringkat staf dengan visualisasi skor animasi (SVG circle + progress bar).

### 8. 🔤 Manajemen Teks (Wording Editor)

- Admin dapat **mengubah teks/label** pada aplikasi tanpa coding.
- Fitur pencarian, filter (Custom/Default), dan edit inline.
- Mendukung kedua bahasa (ID & EN) secara terpisah.
- Override tersimpan di database, dengan fallback ke teks bawaan.

## 🛠️ Teknologi

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (via Prisma ORM)
- **Auth**: NextAuth.js (v5)
- **Styling**: Tailwind CSS
- **Components**: Shadcn/UI
- **Internationalization**: next-intl

## 📦 Instalasi & Menjalankan

1. **Clone Repository**

   ```bash
   git clone <repository-url>
   cd kpi-tenaga-pastoral
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Setup Environment Variables**
   Buat file `.env` dan sesuaikan dengan `.env.example` (Database URL, NextAuth Secret, dll).

4. **Database Setup**

   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Jalankan Development Server**
   ```bash
   npm run dev
   ```
   Buka [http://localhost:3000](http://localhost:3000) di browser.

## 🧪 Testing & Build

- **Type Check**: `npx tsc --noEmit`
- **Lint**: `npm run lint`
- **Build Production**: `npm run build`

---

_Dikembangkan untuk PUSPAS Tengah - 2026_
