"use client"

import { useState } from "react"
import { EmptySearch, EmptyState } from "@/components/ui/empty-state"

interface FAQ {
  id: string
  question: string
  answer: string
  category: string
}

interface HelpClientProps {
  faqs: Record<string, FAQ[]>
  userRole: "ADMIN" | "PASTORAL_STAFF"
  userName: string
}

// User Guide Data
const userGuides = {
  staff: [
    {
      id: "dashboard",
      icon: "dashboard",
      title: "Dashboard",
      description: "Halaman utama yang menampilkan ringkasan aktivitas dan statistik Anda.",
      steps: [
        "Lihat statistik total staf, periode aktif, progress evaluasi, dan tugas pending",
        "Gunakan Quick Actions untuk akses cepat ke fitur utama",
        "Pantau aktivitas terakhir Anda di panel Recent Activity"
      ]
    },
    {
      id: "panca-tugas",
      icon: "church",
      title: "Panca Tugas",
      description: "Catat aktivitas pelayanan Anda berdasarkan 5 pilar pastoral.",
      steps: [
        "Klik tombol 'Tambah Aktivitas' pada kartu pilar yang sesuai",
        "Isi judul, deskripsi, tanggal, dan durasi aktivitas",
        "Aktivitas akan tercatat dan mempengaruhi skor kinerja Anda",
        "5 Pilar: Liturgia (Ibadah), Diakonia (Pelayanan Sosial), Kerygma (Pewartaan), Koinonia (Persekutuan), Martyria (Kesaksian)"
      ]
    },
    {
      id: "tugas",
      icon: "task_alt",
      title: "Manajemen Tugas",
      description: "Kelola tugas-tugas yang diberikan atau yang Anda buat sendiri.",
      steps: [
        "Lihat tugas dalam tampilan Kanban (To Do, In Progress, Completed)",
        "Klik tugas untuk melihat detail dan mengubah status",
        "Gunakan tombol 'Tambah Tugas' untuk membuat tugas baru",
        "Selesaikan tugas tepat waktu untuk meningkatkan skor kinerja"
      ]
    },
    {
      id: "target",
      icon: "flag",
      title: "Target Saya",
      description: "Tetapkan target pribadi dan pantau pencapaian Anda.",
      steps: [
        "Klik 'Tambah Target' untuk membuat target baru",
        "Pilih jenis target: Jumlah Aktivitas, Durasi Aktivitas, atau Penyelesaian Tugas",
        "Target akan otomatis terupdate saat Anda mencatat aktivitas atau menyelesaikan tugas",
        "Pantau progress di halaman Target Saya"
      ]
    },
    {
      id: "evaluasi",
      icon: "rate_review",
      title: "Evaluasi",
      description: "Submit evaluasi diri dan evaluasi rekan kerja.",
      steps: [
        "Pilih periode evaluasi yang aktif",
        "Untuk Evaluasi Diri: pilih 'Self' kemudian isi form penilaian",
        "Untuk Evaluasi Peer: pilih rekan kerja yang ingin dinilai",
        "Jawab semua pertanyaan dan klik 'Submit' untuk mengirim evaluasi"
      ]
    },
    {
      id: "kinerja",
      icon: "insights",
      title: "Dashboard Kinerja",
      description: "Lihat skor kinerja, peringkat, dan statistik performa Anda.",
      steps: [
        "Lihat skor total dan breakdown per komponen (Aktivitas, Keseimbangan Pilar, Tugas, Konsistensi)",
        "Periksa peringkat Anda di Leaderboard",
        "Pantau grafik aktivitas bulanan dan keseimbangan pilar",
        "Gunakan data ini untuk meningkatkan performa Anda"
      ]
    },
    {
      id: "hasil",
      icon: "assignment",
      title: "Hasil Evaluasi",
      description: "Lihat hasil evaluasi dan rencana pengembangan dari Admin.",
      steps: [
        "Pilih periode evaluasi untuk melihat hasil",
        "Lihat skor rata-rata dan breakdown per kategori",
        "Baca Development Plan (rencana pengembangan) yang diberikan Admin",
        "Gunakan feedback untuk perbaikan diri"
      ]
    },
    {
      id: "profil",
      icon: "person",
      title: "Profil",
      description: "Kelola data pribadi dan keamanan akun Anda.",
      steps: [
        "Update nama dan informasi pribadi",
        "Ganti password secara berkala untuk keamanan",
        "Pastikan data Anda selalu up-to-date"
      ]
    }
  ],
  admin: [
    {
      id: "user-management",
      icon: "group",
      title: "Manajemen Pengguna",
      description: "Kelola akun staff pastoral dalam sistem.",
      steps: [
        "Klik 'Tambah Pengguna' untuk membuat akun baru",
        "Isi nama, email, password, dan pilih role (Admin/Pastoral Staff)",
        "Edit atau hapus pengguna dengan tombol aksi di tabel",
        "Reset password jika diperlukan"
      ]
    },
    {
      id: "periode",
      icon: "calendar_today",
      title: "Periode Evaluasi",
      description: "Buat dan kelola periode evaluasi.",
      steps: [
        "Klik 'Buat Periode Baru' untuk memulai periode evaluasi",
        "Isi nama periode, tanggal mulai, dan tanggal berakhir",
        "Tambahkan pertanyaan evaluasi menggunakan template atau buat custom",
        "Aktifkan periode agar staff dapat mulai submit evaluasi",
        "Tutup periode saat evaluasi selesai"
      ]
    },
    {
      id: "questions",
      icon: "quiz",
      title: "Pertanyaan Evaluasi",
      description: "Setup pertanyaan untuk setiap periode evaluasi.",
      steps: [
        "Buka periode evaluasi dan klik 'Setup Pertanyaan'",
        "Gunakan template yang tersedia atau buat pertanyaan custom",
        "Pilih jenis pertanyaan: Skala 1-5, Ya/Tidak, atau Teks",
        "Atur bobot (weight) untuk perhitungan skor",
        "Urutkan pertanyaan sesuai kebutuhan"
      ]
    },
    {
      id: "laporan",
      icon: "summarize",
      title: "Laporan & Report",
      description: "Lihat dan export laporan evaluasi staff.",
      steps: [
        "Pilih periode evaluasi untuk melihat laporan",
        "Lihat ringkasan skor semua staff",
        "Klik nama staff untuk detail evaluasi",
        "Download PDF untuk dokumentasi atau rapat",
        "Gunakan filter untuk mencari staff tertentu"
      ]
    },
    {
      id: "aktivitas-staff",
      icon: "monitoring",
      title: "Aktivitas Staff",
      description: "Pantau aktivitas Panca Tugas seluruh staff.",
      steps: [
        "Lihat statistik total aktivitas dan durasi",
        "Filter berdasarkan staff atau pilar",
        "Pantau keseimbangan aktivitas per pilar",
        "Identifikasi staff yang aktif atau kurang aktif"
      ]
    },
    {
      id: "tugas-staff",
      icon: "assignment_ind",
      title: "Manajemen Tugas Staff",
      description: "Assign dan pantau tugas untuk staff.",
      steps: [
        "Lihat ringkasan tugas semua staff",
        "Assign tugas baru ke staff tertentu",
        "Pantau progress dan status penyelesaian",
        "Identifikasi tugas yang overdue"
      ]
    },
    {
      id: "analitik",
      icon: "analytics",
      title: "Analitik & Pengembangan",
      description: "Analisis trend dan buat rencana pengembangan.",
      steps: [
        "Lihat grafik trend nilai evaluasi antar periode",
        "Analisis distribusi skor staff",
        "Pilih staff untuk membuat Development Plan",
        "Isi kekuatan, kelemahan, dan rekomendasi pengembangan",
        "Staff dapat melihat Development Plan di halaman Hasil Evaluasi"
      ]
    },
    {
      id: "master-data",
      icon: "database",
      title: "Master Data",
      description: "Kelola data referensi seperti jabatan dan kategori.",
      steps: [
        "Tambah, edit, atau hapus data Jabatan",
        "Kelola kategori FAQ",
        "Data master digunakan di seluruh aplikasi"
      ]
    }
  ]
}

export function HelpClient({ faqs, userRole, userName }: HelpClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"faq" | "guide">("guide")
  const [expandedGuide, setExpandedGuide] = useState<string | null>(null)

  const categories = Object.keys(faqs)
  const isAdmin = userRole === "ADMIN"
  
  // Get relevant guides based on role
  const relevantGuides = isAdmin 
    ? [...userGuides.staff, ...userGuides.admin]
    : userGuides.staff
  
  // Filter FAQs by search and category
  const filteredFaqs: Record<string, FAQ[]> = {}
  for (const category of categories) {
    if (selectedCategory && category !== selectedCategory) continue
    
    const filtered = faqs[category].filter(faq => 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
    
    if (filtered.length > 0) {
      filteredFaqs[category] = filtered
    }
  }

  // Filter guides by search
  const filteredGuides = relevantGuides.filter(guide =>
    guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guide.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guide.steps.some(step => step.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const totalFaqs = Object.values(filteredFaqs).reduce((sum, arr) => sum + arr.length, 0)

  return (
    <>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="size-16 rounded-full bg-primary/10 mx-auto flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-3xl text-primary">help</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Pusat Bantuan</h1>
          <p className="text-muted-foreground mt-2">Panduan lengkap penggunaan aplikasi Sistem Evaluasi</p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setActiveTab("guide")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition ${
              activeTab === "guide"
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-card border border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            <span className="material-symbols-outlined text-xl">menu_book</span>
            Panduan Pengguna
          </button>
          <button
            onClick={() => setActiveTab("faq")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition ${
              activeTab === "faq"
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-card border border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            <span className="material-symbols-outlined text-xl">quiz</span>
            FAQ
          </button>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              <span className="material-symbols-outlined">search</span>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === "guide" ? "Cari panduan..." : "Cari pertanyaan..."}
              className="w-full rounded-xl border border-border bg-card pl-12 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>

        {/* User Guide Tab */}
        {activeTab === "guide" && (
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Staff Guides */}
            <div className="mb-6">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">person</span>
                Panduan untuk Staff
              </h2>
              <div className="grid gap-3">
                {filteredGuides.filter(g => userGuides.staff.some(s => s.id === g.id)).map(guide => (
                  <div 
                    key={guide.id}
                    className="bg-card rounded-xl border border-border overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedGuide(expandedGuide === guide.id ? null : guide.id)}
                      className="w-full p-4 flex items-center gap-4 text-left hover:bg-muted/50 transition"
                    >
                      <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-2xl text-primary">{guide.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground">{guide.title}</h3>
                        <p className="text-sm text-muted-foreground truncate">{guide.description}</p>
                      </div>
                      <span className={`material-symbols-outlined text-muted-foreground transition-transform ${expandedGuide === guide.id ? "rotate-180" : ""}`}>
                        expand_more
                      </span>
                    </button>
                    {expandedGuide === guide.id && (
                      <div className="px-4 pb-4 pt-0 border-t border-border">
                        <div className="pt-4 pl-16">
                          <p className="text-muted-foreground mb-3">{guide.description}</p>
                          <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg text-primary">checklist</span>
                            Langkah-langkah:
                          </h4>
                          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                            {guide.steps.map((step, idx) => (
                              <li key={idx} className="leading-relaxed">{step}</li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Admin Guides (only for Admin) */}
            {isAdmin && filteredGuides.some(g => userGuides.admin.some(a => a.id === g.id)) && (
              <div>
                <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-orange-500">admin_panel_settings</span>
                  Panduan untuk Admin
                </h2>
                <div className="grid gap-3">
                  {filteredGuides.filter(g => userGuides.admin.some(a => a.id === g.id)).map(guide => (
                    <div 
                      key={guide.id}
                      className="bg-card rounded-xl border border-orange-500/30 overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedGuide(expandedGuide === guide.id ? null : guide.id)}
                        className="w-full p-4 flex items-center gap-4 text-left hover:bg-muted/50 transition"
                      >
                        <div className="size-12 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-2xl text-orange-500">{guide.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-foreground">{guide.title}</h3>
                          <p className="text-sm text-muted-foreground truncate">{guide.description}</p>
                        </div>
                        <span className={`material-symbols-outlined text-muted-foreground transition-transform ${expandedGuide === guide.id ? "rotate-180" : ""}`}>
                          expand_more
                        </span>
                      </button>
                      {expandedGuide === guide.id && (
                        <div className="px-4 pb-4 pt-0 border-t border-orange-500/30">
                          <div className="pt-4 pl-16">
                            <p className="text-muted-foreground mb-3">{guide.description}</p>
                            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                              <span className="material-symbols-outlined text-lg text-orange-500">checklist</span>
                              Langkah-langkah:
                            </h4>
                            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                              {guide.steps.map((step, idx) => (
                                <li key={idx} className="leading-relaxed">{step}</li>
                              ))}
                            </ol>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filteredGuides.length === 0 && (
              <EmptySearch query={searchQuery} />
            )}
          </div>
        )}

        {/* FAQ Tab */}
        {activeTab === "faq" && (
          <>
            {/* Category Filter */}
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                  selectedCategory === null 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Semua
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                    selectedCategory === category 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* FAQ Accordion */}
            <div className="max-w-3xl mx-auto space-y-6">
              {Object.keys(filteredFaqs).length === 0 ? (
                searchQuery ? (
                  <EmptySearch query={searchQuery} />
                ) : (
                  <EmptyState 
                    icon="help_center" 
                    title="Tidak Ada FAQ" 
                    description="Belum ada pertanyaan yang sering diajukan." 
                  />
                )
              ) : (
                Object.entries(filteredFaqs).map(([category, items]) => (
                  <div key={category}>
                    <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">folder</span>
                      {category}
                    </h2>
                    <div className="bg-card rounded-xl border border-border overflow-hidden divide-y divide-border">
                      {items.map((faq) => {
                        const isExpanded = expandedId === faq.id
                        return (
                          <div key={faq.id}>
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : faq.id)}
                              className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/50 transition"
                            >
                              <span className="font-medium text-foreground pr-4">{faq.question}</span>
                              <span className={`material-symbols-outlined text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}>
                                expand_more
                              </span>
                            </button>
                            {isExpanded && (
                              <div className="px-4 pb-4">
                                <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer stats */}
            <p className="text-center text-sm text-muted-foreground">
              {totalFaqs} pertanyaan tersedia
            </p>
          </>
        )}

        {/* Contact Section */}
        <div className="max-w-2xl mx-auto bg-card rounded-xl border border-border p-6 text-center">
          <h3 className="font-bold text-foreground mb-2">Butuh bantuan lebih lanjut?</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Hubungi tim Pusat Pastoral Keuskupan Surabaya
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="mailto:support@pusatpastoral.id" className="flex items-center gap-2 text-primary hover:underline">
              <span className="material-symbols-outlined">mail</span>
              support@pusatpastoral.id
            </a>
            <span className="text-border">|</span>
            <a href="tel:+6231123456" className="flex items-center gap-2 text-primary hover:underline">
              <span className="material-symbols-outlined">call</span>
              (031) 123-456
            </a>
          </div>
        </div>
      </div>
      </>
  )
}
