"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

interface ScoringConfigClientProps {
  initialConfig: {
    id: string | null
    activityWeight: number
    pillarWeight: number
    taskWeight: number
    consistencyWeight: number
    evaluationWeight: number
    total: number
  }
}

const WEIGHT_DESCRIPTIONS = {
  activity: {
    label: "Aktivitas Panca Tugas",
    description: "Jumlah dan durasi kegiatan pastoral yang dilakukan",
    icon: "volunteer_activism",
    color: "blue"
  },
  pillar: {
    label: "Keseimbangan Pilar",
    description: "Distribusi aktivitas di 5 pilar (Liturgia, Diakonia, Kerygma, Koinonia, Martyria)",
    icon: "balance",
    color: "green"
  },
  task: {
    label: "Penyelesaian Tugas",
    description: "Rasio tugas selesai terhadap total tugas yang diberikan",
    icon: "task_alt",
    color: "amber"
  },
  consistency: {
    label: "Konsistensi",
    description: "Streak harian dan jumlah hari aktif per bulan",
    icon: "calendar_today",
    color: "purple"
  },
  evaluation: {
    label: "Hasil Evaluasi 360°",
    description: "Rata-rata nilai dari semua periode evaluasi",
    icon: "star",
    color: "cyan"
  }
}

const COLOR_CLASSES: Record<string, { bg: string; text: string; bar: string }> = {
  blue: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-600 dark:text-blue-400", bar: "bg-blue-500" },
  green: { bg: "bg-green-50 dark:bg-green-900/20", text: "text-green-600 dark:text-green-400", bar: "bg-green-500" },
  amber: { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-600 dark:text-amber-400", bar: "bg-amber-500" },
  purple: { bg: "bg-purple-50 dark:bg-purple-900/20", text: "text-purple-600 dark:text-purple-400", bar: "bg-purple-500" },
  cyan: { bg: "bg-cyan-50 dark:bg-cyan-900/20", text: "text-cyan-600 dark:text-cyan-400", bar: "bg-cyan-500" }
}

export function ScoringConfigClient({ initialConfig }: ScoringConfigClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  const [weights, setWeights] = useState({
    activity: initialConfig.activityWeight,
    pillar: initialConfig.pillarWeight,
    task: initialConfig.taskWeight,
    consistency: initialConfig.consistencyWeight,
    evaluation: initialConfig.evaluationWeight
  })

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const total = Object.values(weights).reduce((a, b) => a + b, 0)
  const isValid = total === 100

  const handleSliderChange = (key: keyof typeof weights, value: number) => {
    setWeights(prev => ({ ...prev, [key]: value }))
    setError(null)
    setSuccess(false)
  }

  const handleReset = () => {
    setWeights({
      activity: 25,
      pillar: 20,
      task: 20,
      consistency: 15,
      evaluation: 20
    })
    setError(null)
    setSuccess(false)
  }

  const handleSave = async () => {
    if (!isValid) {
      setError(`Total bobot harus 100%, saat ini: ${total}%`)
      return
    }

    startTransition(async () => {
      try {
        const { updateScoringConfig } = await import("@/lib/actions/scoring")
        await updateScoringConfig({
          activityWeight: weights.activity,
          pillarWeight: weights.pillar,
          taskWeight: weights.task,
          consistencyWeight: weights.consistency,
          evaluationWeight: weights.evaluation
        })
        setSuccess(true)
        setError(null)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal menyimpan konfigurasi")
        setSuccess(false)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <span className="material-symbols-outlined text-primary">tune</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Konfigurasi Bobot Scoring</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Atur bobot masing-masing komponen untuk menghitung skor kinerja total. 
              Total semua bobot harus berjumlah <strong>100%</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Weight Sliders */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {(Object.keys(weights) as Array<keyof typeof weights>).map((key, index) => {
          const config = WEIGHT_DESCRIPTIONS[key]
          const colors = COLOR_CLASSES[config.color]
          
          return (
            <div 
              key={key} 
              className={`p-5 ${index < Object.keys(weights).length - 1 ? "border-b border-border" : ""}`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg ${colors.bg}`}>
                  <span className={`material-symbols-outlined ${colors.text}`}>{config.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-foreground">{config.label}</h3>
                    <span className={`text-lg font-bold ${colors.text}`}>{weights[key]}%</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{config.description}</p>
                  
                  {/* Slider */}
                  <div className="relative">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={weights[key]}
                      onChange={(e) => handleSliderChange(key, parseInt(e.target.value))}
                      className="w-full h-2 bg-accent rounded-lg appearance-none cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none
                        [&::-webkit-slider-thumb]:w-4
                        [&::-webkit-slider-thumb]:h-4
                        [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:bg-primary
                        [&::-webkit-slider-thumb]:cursor-pointer
                        [&::-webkit-slider-thumb]:shadow-md
                        [&::-webkit-slider-thumb]:transition-transform
                        [&::-webkit-slider-thumb]:hover:scale-110"
                    />
                    {/* Progress Fill */}
                    <div 
                      className={`absolute top-0 left-0 h-2 rounded-lg pointer-events-none ${colors.bar} opacity-50`}
                      style={{ width: `${weights[key]}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Total & Actions */}
      <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">Total:</span>
            <span className={`text-2xl font-bold ${isValid ? "text-green-500" : "text-red-500"}`}>
              {total}%
            </span>
            {isValid ? (
              <span className="text-green-500 flex items-center gap-1 text-sm">
                <span className="material-symbols-outlined text-base">check_circle</span>
                Valid
              </span>
            ) : (
              <span className="text-red-500 flex items-center gap-1 text-sm">
                <span className="material-symbols-outlined text-base">error</span>
                {total > 100 ? `Kelebihan ${total - 100}%` : `Kurang ${100 - total}%`}
              </span>
            )}
          </div>
          
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={handleReset}
              className="flex-1 sm:flex-none px-4 py-2 rounded-lg border border-border 
                text-muted-foreground hover:bg-accent transition-colors
                flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">refresh</span>
              Reset Default
            </button>
            <button
              onClick={handleSave}
              disabled={!isValid || isPending}
              className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-primary text-primary-foreground
                hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                  Menyimpan...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">save</span>
                  Simpan Konfigurasi
                </>
              )}
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            {error}
          </div>
        )}
        {success && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400 text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-base">check_circle</span>
            Konfigurasi berhasil disimpan!
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-5">
        <div className="flex gap-3">
          <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">info</span>
          <div>
            <h4 className="font-semibold text-blue-700 dark:text-blue-300">Catatan</h4>
            <ul className="mt-2 text-sm text-blue-600 dark:text-blue-400 space-y-1">
              <li>• Perubahan bobot akan berlaku untuk semua staff</li>
              <li>• Skor akan dihitung ulang secara otomatis</li>
              <li>• Bobot default adalah: Aktivitas 25%, Pilar 20%, Tugas 20%, Konsistensi 15%, Evaluasi 20%</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
