"use client"

import { useState, useEffect } from "react"
import { PILLAR_INFO, PastoralPillar } from "@/lib/constants"
import { getMyActivities, getPillarMonthlyStats } from "@/lib/actions/activities"

interface Activity {
  id: string
  title: string
  description: string | null
  pillar: PastoralPillar
  date: Date
  duration: number
  location: string | null
}

interface MonthlyStats {
  month: Date
  count: number
  totalDuration: number
}

interface PillarStats {
  count: number
  totalDuration: number
}

interface PillarDetailModalProps {
  pillar: PastoralPillar
  stats: PillarStats
  onClose: () => void
}

// Pillar descriptions with examples
const PILLAR_DETAILS: Record<PastoralPillar, { fullDescription: string; examples: string[] }> = {
  LITURGIA: {
    fullDescription: "Tugas liturgi mencakup segala bentuk peribadatan dan upacara keagamaan yang dilaksanakan oleh tenaga pastoral untuk membimbing umat dalam hubungan dengan Tuhan.",
    examples: ["Memimpin Misa/Ibadah", "Pelayanan Sakramen", "Doa Penyembuhan", "Adorasi", "Devosi"]
  },
  DIAKONIA: {
    fullDescription: "Tugas diakonia adalah pelayanan kasih dalam bentuk konkret kepada sesama yang membutuhkan, sebagai wujud cinta kasih Kristus.",
    examples: ["Kunjungan ke Panti Jompo", "Bakti Sosial", "Penggalangan Dana", "Bantuan Bencana", "Pelayanan Konseling"]
  },
  KERYGMA: {
    fullDescription: "Tugas kerygma adalah pewartaan Injil dan pengajaran iman untuk memperkenalkan dan memperdalam pengenalan akan Kristus.",
    examples: ["Khotbah/Homili", "Katekese", "Kelompok Pendalaman Alkitab", "Retreat", "Seminar Iman"]
  },
  KOINONIA: {
    fullDescription: "Tugas koinonia adalah membangun persekutuan dan komunitas iman yang saling mendukung dan menguatkan.",
    examples: ["Pertemuan Komunitas", "Rekoleksi Bersama", "Kegiatan Kepemudaan", "Arisan Rohani", "Kunjungan Pastoral"]
  },
  MARTYRIA: {
    fullDescription: "Tugas martyria adalah bersaksi tentang iman melalui kata-kata dan perbuatan sehari-hari, menjadi terang dunia.",
    examples: ["Dialog Antar Agama", "Kampanye Sosial", "Menulis Artikel Rohani", "Media Sosial Rohani", "Teladan Hidup"]
  }
}

export function PillarDetailModal({ pillar, stats, onClose }: PillarDetailModalProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([])
  const [loading, setLoading] = useState(true)

  const info = PILLAR_INFO[pillar]
  const details = PILLAR_DETAILS[pillar]

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [acts, monthly] = await Promise.all([
          getMyActivities(pillar),
          getPillarMonthlyStats(pillar)
        ])
        setActivities(acts.slice(0, 10)) // Last 10
        setMonthlyStats(monthly)
      } catch (error) {
        console.error("Error fetching pillar data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [pillar])

  const formatDuration = (mins: number) => {
    if (mins < 60) return `${mins}m`
    const hours = Math.floor(mins / 60)
    const remaining = mins % 60
    return remaining > 0 ? `${hours}j ${remaining}m` : `${hours}j`
  }

  const formatMonth = (date: Date) => {
    return new Date(date).toLocaleDateString("id-ID", { month: "short" })
  }

  // Calculate max for chart scaling
  const maxCount = Math.max(...monthlyStats.map(s => s.count), 1)

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-card rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl border border-border"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`${info.color} p-6 text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="size-14 rounded-xl bg-white/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">{info.icon}</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold">{info.name}</h2>
                <p className="text-white/80">{info.description}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="size-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] space-y-6">
          {/* Description */}
          <div>
            <h3 className="font-bold text-foreground mb-2">Tentang {info.name}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{details.fullDescription}</p>
          </div>

          {/* Examples */}
          <div>
            <h3 className="font-bold text-foreground mb-2">Contoh Aktivitas</h3>
            <div className="flex flex-wrap gap-2">
              {details.examples.map((ex, i) => (
                <span key={i} className="px-3 py-1 rounded-full bg-accent text-accent-foreground text-sm">
                  {ex}
                </span>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-accent/50 rounded-xl p-4">
              <p className="text-3xl font-bold text-foreground">{stats.count}</p>
              <p className="text-sm text-muted-foreground">Total Aktivitas</p>
            </div>
            <div className="bg-accent/50 rounded-xl p-4">
              <p className="text-3xl font-bold text-foreground">{formatDuration(stats.totalDuration)}</p>
              <p className="text-sm text-muted-foreground">Total Durasi</p>
            </div>
          </div>

          {/* Monthly Chart */}
          {monthlyStats.length > 0 && (
            <div>
              <h3 className="font-bold text-foreground mb-3">Tren 6 Bulan Terakhir</h3>
              <div className="bg-accent/30 rounded-xl p-4">
                <div className="flex items-end justify-between gap-2 h-32">
                  {monthlyStats.map((stat, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div 
                        className={`w-full ${info.color} rounded-t transition-all`}
                        style={{ height: `${Math.max((stat.count / maxCount) * 100, 8)}%` }}
                      />
                      <span className="text-xs text-muted-foreground">{formatMonth(stat.month)}</span>
                      <span className="text-xs font-medium text-foreground">{stat.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Recent Activities */}
          <div>
            <h3 className="font-bold text-foreground mb-3">Aktivitas Terkini</h3>
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : activities.length > 0 ? (
              <div className="space-y-2">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition">
                    <div className={`size-8 rounded-lg ${info.color} flex items-center justify-center flex-shrink-0`}>
                      <span className="material-symbols-outlined text-white text-sm">{info.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })} • {formatDuration(activity.duration)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <span className="material-symbols-outlined text-4xl text-muted-foreground mb-2">event_busy</span>
                <p className="text-muted-foreground text-sm">Belum ada aktivitas untuk pilar ini.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
