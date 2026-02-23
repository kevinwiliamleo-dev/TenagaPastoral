// Empty state components for when there's no data

interface EmptyStateProps {
  icon?: string
  title: string
  description: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
}

export function EmptyState({ icon = "inbox", title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="size-20 rounded-full bg-muted flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-4xl text-muted-foreground">{icon}</span>
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-6">{description}</p>
      {action && (
        action.href ? (
          <a
            href={action.href}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            {action.label}
          </a>
        ) : (
          <button
            onClick={action.onClick}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            {action.label}
          </button>
        )
      )}
    </div>
  )
}

// Specific empty states
export function EmptyReports() {
  return (
    <EmptyState
      icon="assessment"
      title="Belum Ada Laporan"
      description="Laporan evaluasi akan muncul setelah staff menyelesaikan evaluasi untuk periode yang aktif."
    />
  )
}

export function EmptyEvaluations() {
  return (
    <EmptyState
      icon="rate_review"
      title="Tidak Ada Evaluasi Aktif"
      description="Saat ini tidak ada periode evaluasi yang aktif. Hubungi administrator untuk informasi lebih lanjut."
    />
  )
}

export function EmptyUsers() {
  return (
    <EmptyState
      icon="group"
      title="Belum Ada Pengguna"
      description="Tambahkan pengguna baru untuk memulai sistem evaluasi."
      action={{
        label: "Tambah Pengguna",
        href: "#",
      }}
    />
  )
}

export function EmptyPeriods() {
  return (
    <EmptyState
      icon="calendar_month"
      title="Belum Ada Periode"
      description="Buat periode evaluasi baru untuk memulai proses penilaian kinerja."
      action={{
        label: "Buat Periode",
        href: "#",
      }}
    />
  )
}

export function EmptyQuestions() {
  return (
    <EmptyState
      icon="quiz"
      title="Belum Ada Pertanyaan"
      description="Tambahkan pertanyaan evaluasi untuk periode ini, atau gunakan template pertanyaan yang sudah tersedia."
      action={{
        label: "Tambah Pertanyaan",
        href: "#",
      }}
    />
  )
}

export function EmptyFeedback() {
  return (
    <EmptyState
      icon="chat_bubble"
      title="Belum Ada Umpan Balik"
      description="Umpan balik tertulis dari evaluator akan ditampilkan di sini setelah evaluasi selesai."
    />
  )
}

export function EmptySearch({ query }: { query: string }) {
  return (
    <EmptyState
      icon="search_off"
      title="Tidak Ditemukan"
      description={`Tidak ada hasil yang cocok dengan pencarian "${query}". Coba kata kunci lain.`}
    />
  )
}

export function ErrorState({ message = "Terjadi kesalahan saat memuat data." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="size-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-4xl text-destructive">error</span>
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">Terjadi Kesalahan</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-6">{message}</p>
      <button
        onClick={() => window.location.reload()}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-foreground font-medium hover:bg-muted transition"
      >
        <span className="material-symbols-outlined text-[20px]">refresh</span>
        Coba Lagi
      </button>
    </div>
  )
}
