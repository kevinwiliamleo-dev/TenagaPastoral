\# DOKUMEN SPESIFIKASI TEKNIS

\## Sistem Evaluasi Kinerja Tenaga Pastoral (v2.0)



\*\*Tanggal Dokumen:\*\* 23 Januari 2026

\*\*Status:\*\* Final Draft untuk Implementasi

\*\*Target Pengguna:\*\* Developer / Programmer / Vendor IT



---



\### 1. RINGKASAN EKSEKUTIF

Proyek ini adalah rancang bangun ulang (\*re-write\*) dari aplikasi penilaian kinerja. Versi sebelumnya mengalami kegagalan fatal (\*crash\*) akibat penggunaan teknologi yang terlalu dini (\*bleeding edge\*) dan arsitektur yang rentan.



\*\*Tujuan Utama v2.0:\*\*

1\.  \*\*Stabilitas:\*\* Aplikasi harus berjalan lancar tanpa \*rendering error\*.

2\.  \*\*Keamanan:\*\* Mencegah \*SQL Injection\*, \*XSS\*, dan akses ilegal (Backdoor).

3\.  \*\*Integritas Data:\*\* Mencegah manipulasi nilai setelah periode berakhir dan memastikan data tersimpan rapi.



---



\### 2. STANDARDISASI TEKNOLOGI (TECH STACK)

Developer \*\*WAJIB\*\* mematuhi batasan teknologi berikut untuk menjamin stabilitas jangka panjang. Dilarang menggunakan versi Alpha/Beta.



| Komponen | Spesifikasi Wajib | Keterangan |

| :--- | :--- | :--- |

| \*\*Framework\*\* | \*\*Next.js 14 atau 15 (App Router)\*\* | Gunakan versi LTS (\*Long Term Support\*). \*\*DILARANG\*\* menggunakan Next.js 16 (kecuali sudah stabil penuh). |

| \*\*Bahasa\*\* | \*\*TypeScript 5.x\*\* | \*Strict Mode\* harus aktif untuk mencegah error tipe data. |

| \*\*Database\*\* | \*\*PostgreSQL\*\* | Menggantikan SQLite. Gunakan layanan Cloud (seperti Supabase Free Tier) untuk kemudahan backup. |

| \*\*ORM\*\* | \*\*Prisma\*\* | Wajib digunakan untuk koneksi database guna mencegah \*SQL Injection\*. |

| \*\*Autentikasi\*\* | \*\*NextAuth.js v5 (Auth.js)\*\* | Dilarang membuat sistem login manual (\*hand-rolled auth\*). |

| \*\*Styling\*\* | \*\*Tailwind CSS v3\*\* | Gunakan versi 3 yang stabil. \*\*DILARANG\*\* menggunakan versi 4 (Alpha/Beta). |

| \*\*Komponen UI\*\* | \*\*Radix UI / Shadcn UI\*\* | Fokus pada aksesibilitas dan performa ringan (\*lightweight\*). |

| \*\*Validasi\*\* | \*\*Zod\*\* | Wajib validasi data di sisi Server \& Client. |



---



\### 3. ARSITEKTUR DATABASE (SCHEMA)

Developer harus mengimplementasikan skema database berikut. Skema ini menggunakan UUID untuk keamanan ID dan relasi yang kuat.



\*\*Provider:\*\* PostgreSQL

\*\*Schema File (`schema.prisma`):\*\*



```prisma

datasource db {

&nbsp; provider = "postgresql"

&nbsp; url      = env("DATABASE\_URL")

}



generator client {

&nbsp; provider = "prisma-client-js"

}



model User {

&nbsp; id            String    @id @default(uuid())

&nbsp; email         String    @unique

&nbsp; name          String?

&nbsp; password      String    // Wajib di-hash (Bcrypt/Argon2)

&nbsp; role          Role      @default(PASTORAL\_STAFF)

&nbsp; createdAt     DateTime  @default(now())

&nbsp; 

&nbsp; evaluationsGiven    EvaluationSubmission\[] @relation("Appraiser")

&nbsp; evaluationsReceived EvaluationSubmission\[] @relation("Appraisee")

&nbsp; @@map("users")

}



enum Role {

&nbsp; ADMIN

&nbsp; PASTORAL\_STAFF

}



model EvaluationPeriod {

&nbsp; id          String       @id @default(uuid())

&nbsp; name        String

&nbsp; startDate   DateTime

&nbsp; endDate     DateTime

&nbsp; status      PeriodStatus @default(DRAFT)

&nbsp; 

&nbsp; questions   Question\[]

&nbsp; submissions EvaluationSubmission\[]

&nbsp; @@map("evaluation\_periods")

}



enum PeriodStatus {

&nbsp; DRAFT

&nbsp; ACTIVE

&nbsp; CLOSED

}



model Question {

&nbsp; id          String       @id @default(uuid())

&nbsp; text        String

&nbsp; type        QuestionType

&nbsp; order       Int

&nbsp; isRequired  Boolean      @default(true)

&nbsp; 

&nbsp; periodId    String

&nbsp; period      EvaluationPeriod @relation(fields: \[periodId], references: \[id])

&nbsp; answers     Answer\[]

&nbsp; @@map("questions")

}



enum QuestionType {

&nbsp; SCALE\_1\_TO\_5

&nbsp; TEXT

&nbsp; BOOLEAN

}



model EvaluationSubmission {

&nbsp; id            String    @id @default(uuid())

&nbsp; 

&nbsp; // Penilai (Bisa null jika mode Anonim diaktifkan)

&nbsp; appraiserId   String?   

&nbsp; appraiser     User?     @relation("Appraiser", fields: \[appraiserId], references: \[id])

&nbsp; 

&nbsp; // Yang Dinilai

&nbsp; appraiseeId   String?

&nbsp; appraisee     User?     @relation("Appraisee", fields: \[appraiseeId], references: \[id])

&nbsp; 

&nbsp; periodId      String

&nbsp; period        EvaluationPeriod @relation(fields: \[periodId], references: \[id])

&nbsp; 

&nbsp; submittedAt   DateTime  @default(now())

&nbsp; isFinal       Boolean   @default(false)

&nbsp; answers       Answer\[]

&nbsp; 

&nbsp; // Constraint: Mencegah user yang sama menilai orang yang sama 2x di periode yang sama

&nbsp; @@unique(\[appraiserId, appraiseeId, periodId]) 

&nbsp; @@map("evaluation\_submissions")

}



model Answer {

&nbsp; id            String    @id @default(uuid())

&nbsp; 

&nbsp; submissionId  String

&nbsp; submission    EvaluationSubmission @relation(fields: \[submissionId], references: \[id], onDelete: Cascade)

&nbsp; 

&nbsp; questionId    String

&nbsp; question      Question  @relation(fields: \[questionId], references: \[id])

&nbsp; 

&nbsp; scoreValue    Int?

&nbsp; textValue     String?   @db.Text

&nbsp; boolValue     Boolean?

&nbsp; @@map("answers")

}







Berikut adalah Dokumen Spesifikasi Teknis (Technical Requirement Document) yang lengkap dan siap Anda serahkan kepada developer atau vendor IT.Dokumen ini dirancang sebagai "SOP Teknis" yang mengikat, untuk memastikan developer tidak bereksperimen dengan teknologi yang belum matang dan fokus pada stabilitas serta keamanan.Silakan unduh atau salin teks di bawah ini.DOKUMEN SPESIFIKASI TEKNISSistem Evaluasi Kinerja Tenaga Pastoral (v2.0)Tanggal Dokumen: 23 Januari 2026Status: Final Draft untuk ImplementasiTarget Pengguna: Developer / Programmer1. RINGKASAN EKSEKUTIFProyek ini adalah rancang bangun ulang (re-write) dari aplikasi penilaian kinerja. Versi sebelumnya mengalami kegagalan akibat penggunaan teknologi yang terlalu dini (bleeding edge) dan arsitektur yang rentan (fragile).Tujuan Utama v2.0:Stabilitas: Aplikasi harus berjalan lancar tanpa crash atau rendering error.Keamanan: Mencegah SQL Injection, XSS, dan akses ilegal (Backdoor).Integritas Data: Tidak ada data ganda, hilang, atau manipulasi nilai setelah periode berakhir.2. STANDARDISASI TEKNOLOGI (TECH STACK)Developer WAJIB mematuhi batasan teknologi berikut untuk menjamin stabilitas jangka panjang. Dilarang menggunakan versi Alpha/Beta.KomponenSpesifikasi WajibKeteranganFrameworkNext.js 14 atau 15 (App Router)Gunakan versi LTS (Long Term Support). DILARANG menggunakan Next.js 16 (kecuali sudah stabil penuh).BahasaTypeScript 5.xStrict Mode harus aktif untuk mencegah error tipe data.DatabasePostgreSQL (via Supabase)Menggantikan SQLite. Wajib menggunakan akun Supabase Free Tier (bukan Trial).ORMPrismaWajib digunakan untuk koneksi database guna mencegah SQL Injection.AutentikasiNextAuth.js v5 (Auth.js)Dilarang membuat sistem login manual (hand-rolled auth).StylingTailwind CSS v3Gunakan versi 3 yang stabil. DILARANG menggunakan versi 4 (Alpha/Beta).Komponen UIRadix UI / Shadcn UIFokus pada aksesibilitas dan keringanan (lightweight).ValidasiZodWajib validasi data di sisi Server \& Client.3. ARSITEKTUR DATABASE (SCHEMA)Developer harus mengimplementasikan skema database berikut. Skema ini menggunakan UUID untuk keamanan ID dan relasi yang kuat.Provider: PostgreSQLSchema File (schema.prisma):Code snippetmodel User {

&nbsp; id            String    @id @default(uuid())

&nbsp; email         String    @unique

&nbsp; name          String?

&nbsp; password      String    // Wajib di-hash (Bcrypt/Argon2)

&nbsp; role          Role      @default(PASTORAL\_STAFF)

&nbsp; evaluationsGiven    EvaluationSubmission\[] @relation("Appraiser")

&nbsp; evaluationsReceived EvaluationSubmission\[] @relation("Appraisee")

&nbsp; @@map("users")

}



enum Role {

&nbsp; ADMIN

&nbsp; PASTORAL\_STAFF

}



model EvaluationPeriod {

&nbsp; id          String       @id @default(uuid())

&nbsp; name        String

&nbsp; startDate   DateTime

&nbsp; endDate     DateTime

&nbsp; status      PeriodStatus @default(DRAFT)

&nbsp; questions   Question\[]

&nbsp; submissions EvaluationSubmission\[]

&nbsp; @@map("evaluation\_periods")

}



enum PeriodStatus {

&nbsp; DRAFT

&nbsp; ACTIVE

&nbsp; CLOSED

}



model Question {

&nbsp; id          String       @id @default(uuid())

&nbsp; text        String

&nbsp; type        QuestionType

&nbsp; order       Int

&nbsp; isRequired  Boolean      @default(true)

&nbsp; periodId    String

&nbsp; period      EvaluationPeriod @relation(fields: \[periodId], references: \[id])

&nbsp; answers     Answer\[]

&nbsp; @@map("questions")

}



enum QuestionType {

&nbsp; SCALE\_1\_TO\_5

&nbsp; TEXT

&nbsp; BOOLEAN

}



model EvaluationSubmission {

&nbsp; id            String    @id @default(uuid())

&nbsp; appraiserId   String?   // Bisa null jika Anonim

&nbsp; appraiser     User?     @relation("Appraiser", fields: \[appraiserId], references: \[id])

&nbsp; appraiseeId   String?

&nbsp; appraisee     User?     @relation("Appraisee", fields: \[appraiseeId], references: \[id])

&nbsp; periodId      String

&nbsp; period        EvaluationPeriod @relation(fields: \[periodId], references: \[id])

&nbsp; submittedAt   DateTime  @default(now())

&nbsp; isFinal       Boolean   @default(false)

&nbsp; answers       Answer\[]

&nbsp; 

&nbsp; // Mencegah user yang sama menilai orang yang sama 2x di periode yang sama

&nbsp; @@unique(\[appraiserId, appraiseeId, periodId]) 

&nbsp; @@map("evaluation\_submissions")

}



model Answer {

&nbsp; id            String    @id @default(uuid())

&nbsp; submissionId  String

&nbsp; submission    EvaluationSubmission @relation(fields: \[submissionId], references: \[id], onDelete: Cascade)

&nbsp; questionId    String

&nbsp; question      Question  @relation(fields: \[questionId], references: \[id])

&nbsp; scoreValue    Int?

&nbsp; textValue     String?   @db.Text

&nbsp; boolValue     Boolean?

&nbsp; @@map("answers")

}

4\. PROTOKOL KEAMANAN (SECURITY)Developer wajib menerapkan lapisan keamanan berikut:Proteksi Input (Anti-Injector):Setiap input form (nama, esai, nilai) harus divalidasi dengan library Zod sebelum diproses database.Karakter berbahaya (seperti <script>, DROP TABLE) harus ditolak atau dibersihkan (sanitized).Proteksi Rute (Middleware):Gunakan Middleware Next.js untuk memblokir akses URL.User dengan role PASTORAL\_STAFF yang mencoba mengakses URL /admin/... harus otomatis dialihkan (redirect) ke halaman error/login.Manajemen Sesi:Sesi login dibatasi durasinya (misal: 24 jam).Rate Limiting: Batasi percobaan login maksimal 5x per menit untuk mencegah Brute Force.5. LOGIKA BISNIS \& ALUR KERJAPeriode Penilaian:Admin membuat Periode (misal: "Semester I 2026"). Status awal: DRAFT.Saat status diubah jadi ACTIVE, User baru bisa mengisi.Saat status diubah jadi CLOSED, data terkunci (Read-Only). Tidak ada input baru yang boleh masuk.Mekanisme Submit:Gunakan React Server Actions untuk proses submit form. Hindari penggunaan API Route (/api/...) yang berlebihan untuk mengurangi beban client.Sistem harus mengecek di database: "Apakah User ini sudah menilai Target ini di Periode ini?". Jika ya, tolak input.Tampilan (UI/UX):Mobile First: Desain harus optimal untuk layar HP (Potrait) karena user sering di lapangan. Hindari tabel lebar yang terpotong. Gunakan model Card/List.6. PENGEMBANGAN LANJUTAN (FUTURE ROADMAP)Fitur berikut ini TIDAK dikerjakan di fase ini, namun arsitektur kode harus disiapkan agar mudah ditambahkan di masa depan:Notifikasi Otomatis: Integrasi Email (SMTP) atau WhatsApp Gateway untuk mengingatkan user yang belum mengisi survei.Dashboard Analitik: Visualisasi grafik tren kinerja individu antar-tahun.Ekspor PDF: Fitur untuk mencetak rapor hasil evaluasi per individu.7. SERAH TERIMA (DELIVERABLES)Developer wajib menyerahkan:Source Code penuh (diunggah ke Repository Git pribadi/klien).Akun Database (Akses Supabase).File .env.example (Dokumentasi variabel lingkungan).Video Tutorial Singkat cara instalasi dan penggunaan fitur Admin.Akhir Dokumen Spesifikasi

