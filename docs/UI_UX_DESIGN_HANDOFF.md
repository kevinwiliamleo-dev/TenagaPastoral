# UI/UX Design Handoff

## Sistem Evaluasi Kinerja Tenaga Pastoral v2.0

---

## 📋 Ringkasan Proyek

**Nama Aplikasi**: Sistem Evaluasi Kinerja Tenaga Pastoral  
**Versi**: 2.0  
**Platform**: Web Application (Desktop & Mobile Responsive)  
**Target User**: Administrator dan Tenaga Pastoral

### Tujuan Aplikasi

Sistem ini digunakan untuk mengelola dan melaksanakan evaluasi kinerja tenaga pastoral secara periodik. Sistem mendukung evaluasi diri (self-evaluation) dan evaluasi oleh atasan.

---

## 👥 User Personas

### 1. Administrator

- **Role**: Mengelola sistem secara keseluruhan
- **Tugas Utama**:
  - Manajemen akun pengguna
  - Membuat dan mengelola periode evaluasi
  - Menyusun pertanyaan evaluasi
  - Melihat dan mengekspor laporan
  - Melakukan review evaluasi

### 2. Tenaga Pastoral (Staff)

- **Role**: Mengisi formulir evaluasi
- **Tugas Utama**:
  - Mengisi evaluasi diri
  - Mengevaluasi rekan kerja (jika ditugaskan)
  - Melihat hasil evaluasi pribadi

---

## 🎨 Design System

### Color Palette

Aplikasi menggunakan sistem CSS Variables. Desainer dapat mereferensikan warna berikut:

| Nama        | CSS Variable    | Penggunaan                  |
| ----------- | --------------- | --------------------------- |
| Background  | `--background`  | Latar belakang halaman      |
| Foreground  | `--foreground`  | Teks utama                  |
| Primary     | `--primary`     | Tombol utama, aksen penting |
| Secondary   | `--secondary`   | Tombol sekunder, highlight  |
| Muted       | `--muted`       | Teks sekunder, placeholder  |
| Accent      | `--accent`      | Hover states, fokus         |
| Destructive | `--destructive` | Error, hapus, peringatan    |
| Card        | `--card`        | Background kartu/panel      |
| Border      | `--border`      | Garis pembatas              |

### Typography

- **Font Family**: Inter, system-ui, sans-serif
- **Heading 1**: 2xl (24px), font-bold
- **Heading 2**: xl (20px), font-semibold
- **Body**: base (16px), font-normal
- **Small/Caption**: sm (14px), text-muted-foreground

### Border Radius

| Size | Value | Usage           |
| ---- | ----- | --------------- |
| sm   | 4px   | Small elements  |
| md   | 6px   | Buttons, inputs |
| lg   | 8px   | Cards, modals   |

### Spacing

Menggunakan sistem 4px grid:

- `p-2` = 8px
- `p-4` = 16px
- `p-6` = 24px
- `p-8` = 32px

---

## 📱 Halaman yang Perlu Didesain

### 1. Login Page ✅ (Sudah Ada - Perlu Polish)

**Path**: `/login`

**Komponen**:

- Logo aplikasi (Church icon)
- Judul "Sistem Evaluasi Kinerja"
- Subtitle "Tenaga Pastoral (v2.0)"
- Form input: Email, Password
- Tombol "Masuk"
- Pesan error (jika login gagal)

**Catatan Desain**:

- Halaman full-screen dengan form di tengah
- Gunakan Card sebagai container form
- Background gradient atau pattern subtle

---

### 2. Dashboard ✅ (Sudah Ada - Perlu Polish)

**Path**: `/dashboard`

**Komponen Header**:

- Logo mini + nama aplikasi
- Nama user + role
- Tombol logout
- **Language Switcher (ID/EN)**

**Komponen Utama**:

- Greeting: "Selamat datang, [Nama]!"
- 4 Stat Cards:
  - Total Staf
  - Periode Aktif
  - Evaluasi Selesai
  - Menunggu Review
- **Performance Widgets (New)**:
  - Score Card (Rank & Score)
  - Monthly Activity Chart
  - Pillar Balance Chart
  - Task Status Stats
- Quick Actions Panel
- Recent Activity ~~(opsional)~~ (Implemented)

---

### 3. User Management (Admin Only)

**Path**: `/admin/users`

**Komponen**:

- Header dengan judul "Manajemen Pengguna"
- Tombol "Tambah Pengguna Baru"
- Tabel pengguna:
  - Kolom: Nama, Email, Role, Tanggal Dibuat, Aksi
  - Aksi: Edit, Hapus, Reset Password
- Pagination
- Search/filter by name or email

**Modal/Dialog**:

- Form Tambah/Edit Pengguna
  - Input: Nama, Email, Password (hanya saat tambah), Role (dropdown)
- Konfirmasi Hapus

---

### 4. Evaluation Period Management (Admin Only)

**Path**: `/admin/periods`

**Komponen**:

- Header dengan judul "Manajemen Periode Evaluasi"
- Tombol "Buat Periode Baru"
- Grid/List periode:
  - Nama periode
  - Rentang tanggal (Start - End)
  - Status badge: DRAFT (gray), ACTIVE (green), CLOSED (red)
  - Jumlah pertanyaan
  - Jumlah submission
  - Aksi: Edit, Kelola Pertanyaan, Tutup Periode

**Modal/Dialog**:

- Form Buat/Edit Periode
  - Input: Nama Periode, Tanggal Mulai, Tanggal Selesai
  - Status Toggle (hanya untuk edit)

---

### 5. Question Management (Admin Only)

**Path**: `/admin/periods/[id]/questions`

**Komponen**:

- Breadcrumb: Periode > [Nama Periode] > Pertanyaan
- Tombol "Tambah Pertanyaan"
- Daftar pertanyaan (drag & drop untuk reorder):
  - Nomor urut
  - Teks pertanyaan
  - Tipe (badge): Skala 1-5, Teks, Ya/Tidak
  - Required indicator
  - Aksi: Edit, Hapus

**Modal/Dialog**:

- Form Tambah/Edit Pertanyaan
  - Textarea: Teks pertanyaan
  - Dropdown: Tipe pertanyaan
  - Checkbox: Wajib diisi

---

### 6. Evaluation Form (Staff & Admin)

**Path**: `/evaluation/[periodId]` atau `/evaluation/[periodId]/[targetUserId]`

**Komponen**:

- Progress indicator (step x of y)
- Nama periode + target evaluasi (jika mengevaluasi orang lain)
- Pertanyaan satu per satu atau scroll panjang:
  - Teks pertanyaan
  - Input sesuai tipe:
    - **Skala 1-5**: Radio button atau slider dengan label (1=Sangat Kurang, 5=Sangat Baik)
    - **Teks**: Textarea
    - **Ya/Tidak**: Toggle atau Radio
- Tombol: Simpan Draft, Kirim (Final)
- Konfirmasi sebelum submit final

---

### 7. Evaluation Results/Report

**Path**: `/reports` atau `/reports/[periodId]`

**Untuk Admin**:

- Filter by: Periode, User
- Tabel hasil:
  - Nama staff
  - Skor rata-rata
  - Status: Selesai/Pending
  - Tombol: Lihat Detail
- Export options: PDF, Excel

**Untuk Staff**:

- Hanya melihat hasil evaluasi diri sendiri
- Grafik spider/radar untuk visualisasi skor

---

### 8. Profile Page

**Path**: `/profile`

**Komponen**:

- Avatar + Nama + Role
- Form edit profil:
  - Nama
  - Email (read-only)
- Form ganti password:
  - Password lama
  - Password baru
  - Konfirmasi password baru

### 9. Scoring Config (Admin Only) ✅

**Path**: `/admin/scoring-config`

**Komponen**:

- Header "Konfigurasi Scoring"
- 5 Weight sliders/inputs:
  - Activity Weight, Pillar Balance Weight, Task Completion Weight, Consistency Weight, Evaluation Weight
- Visual total (harus = 100%)
- Save button
- Composite Score Card preview (SVG animated circle)

---

### 10. Wording Editor (Admin Only) ✅

**Path**: `/admin/wording`

**Komponen**:

- Header "Manajemen Teks" + Locale Switcher (ID/EN)
- Info Banner (cara penggunaan)
- Stats bar: total teks, jumlah custom
- Search input + Filter tabs (Semua / Custom / Default)
- Grouped sections (Sidebar, Dashboard, Common, dll):
  - Per-item: Key label, text input, save/reset buttons
  - Badge "CUSTOM" (biru) / "BELUM DISIMPAN" (kuning)
- Bulk actions: Simpan Semua, Reset Semua ke Default
- Toast notifications untuk feedback

---

### 11. Analytics Dashboard (Admin Only) ✅

**Path**: `/admin/analytics`

**Komponen**:

- 4 Tab navigation: Overview, Productivity, Staff Performance, Development Plan
- **Overview**: Stat cards + TrendChart + PillarChart + Score Distribution
- **Productivity**: Task stats + Activity trend + Pillar progress bars
- **Staff Performance**: Attention list + Performance table + Weekly heatmap
- **Development Plan**: Staff list + Plan form (Strengths, Improvements, Recommendations)

---

## 🧩 Komponen UI yang Diperlukan

### Sudah Ada ✅

- ✅ Button (primary, secondary, ghost, destructive, outline)
- ✅ Input, Label, Textarea
- ✅ Card (Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter)
- ✅ Form (dengan validasi error states)
- ✅ Table (with search, filter)
- ✅ Dialog/Modal (Radix AlertDialog)
- ✅ Select (dropdown)
- ✅ Badge/Tag
- ✅ Avatar (with initials fallback)
- ✅ Tabs
- ✅ Toast/Notification
- ✅ Progress Bar
- ✅ Skeleton Loading
- ✅ Empty State
- ✅ Error State
- ✅ Popover (Radix)
- ✅ Charts (recharts: Bar, Radar, Line)

---

## 📐 Layout Guidelines

### Desktop (>1024px)

- Max content width: 1400px
- Sidebar navigation (collapsible): 256px
- Main content area: sisanya

### Tablet (768px - 1024px)

- Sidebar collapsed to icons
- Responsive tables (horizontal scroll atau card view)

### Mobile (<768px)

- Bottom navigation atau hamburger menu
- Stack layouts
- Full-width cards

---

## 🎯 UX Considerations

1. **Loading States**: Semua aksi yang memerlukan waktu harus menampilkan loading indicator
2. **Error Handling**: Pesan error yang jelas dan actionable
3. **Empty States**: Ilustrasi/pesan ketika tidak ada data
4. **Confirmation**: Konfirmasi untuk aksi destructive (hapus, submit final)
5. **Feedback**: Toast notification untuk sukses/gagal operasi
6. **Accessibility**:
   - Kontras warna minimal 4.5:1
   - Focus states yang jelas
   - Label untuk semua form inputs

---

## 🖼️ Assets yang Diperlukan

1. **Logo Aplikasi** (SVG)
   - Full version (with text)
   - Icon only version
   - Light & Dark variants

2. **Illustrations**
   - Empty state illustration
   - Error/404 illustration
   - Success illustration

3. **Icons** (menggunakan Lucide React)
   - Sudah tersedia library Lucide

---

## 📎 Reference & Inspiration

- Shadcn UI: https://ui.shadcn.com
- Tailwind CSS: https://tailwindcss.com
- Lucide Icons: https://lucide.dev/icons

---

## 📞 Kontak Developer

Untuk pertanyaan teknis atau koordinasi implementasi, silakan hubungi tim development.

---

_Dokumen ini dibuat pada: 24 Januari 2026, diperbarui: 10 Februari 2026_
