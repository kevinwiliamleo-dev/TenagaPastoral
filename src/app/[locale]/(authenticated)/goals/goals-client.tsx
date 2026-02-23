"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createGoal, updateGoalProgress, completeGoal, cancelGoal, deleteGoal, type Goal, type GoalType } from "@/lib/actions/goals"
import { PILLAR_INFO, type PastoralPillar } from "@/lib/constants"

interface GoalsClientProps {
  initialGoals: Goal[]
  stats: { pending: number; active: number; completed: number; cancelled: number; rejected: number; total: number }
  userName: string
}

const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  ACTIVITY_COUNT: "Jumlah Aktivitas",
  ACTIVITY_DURATION: "Durasi Aktivitas",
  TASK_COMPLETION: "Tugas Selesai",
  PILLAR_BALANCE: "Keseimbangan Pilar",
  CUSTOM: "Custom"
}

type FilterType = "ALL" | "PENDING_APPROVAL" | "ACTIVE" | "COMPLETED" | "REJECTED"

export function GoalsClient({ initialGoals, stats, userName }: GoalsClientProps) {
  const router = useRouter()

  const [showModal, setShowModal] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [filter, setFilter] = useState<FilterType>("ALL")

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "CUSTOM" as GoalType,
    pillar: "" as PastoralPillar | "",
    targetValue: 10,
    targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const result = await createGoal({
        title: formData.title,
        description: formData.description || undefined,
        type: formData.type,
        pillar: formData.pillar || undefined,
        targetValue: formData.targetValue,
        targetDate: formData.targetDate
      })
      if (result.success) {
        setShowModal(false)
        setFormData({
          title: "",
          description: "",
          type: "CUSTOM",
          pillar: "",
          targetValue: 10,
          targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        })
        router.refresh()
      } else {
        alert(result.message)
      }
    })
  }

  const handleComplete = (id: string) => {
    startTransition(async () => {
      await completeGoal(id)
      router.refresh()
    })
  }

  const handleCancel = (id: string) => {
    startTransition(async () => {
      await cancelGoal(id)
      router.refresh()
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm("Hapus target ini?")) return
    startTransition(async () => {
      await deleteGoal(id)
      router.refresh()
    })
  }

  const filteredGoals = initialGoals.filter(g => {
    if (filter === "ALL") return true
    return g.status === filter
  })

  const getDaysRemaining = (targetDate: Date) => {
    const diff = new Date(targetDate).getTime() - new Date().getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return days
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING_APPROVAL":
        return <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-xs font-bold rounded-full">Menunggu Persetujuan</span>
      case "ACTIVE":
        return <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 text-xs font-bold rounded-full">Aktif</span>
      case "COMPLETED":
        return <span className="px-2 py-0.5 bg-green-500/10 text-green-500 text-xs font-bold rounded-full">Tercapai</span>
      case "REJECTED":
        return <span className="px-2 py-0.5 bg-red-500/10 text-red-500 text-xs font-bold rounded-full">Ditolak</span>
      case "CANCELLED":
        return <span className="px-2 py-0.5 bg-gray-500/10 text-gray-500 text-xs font-bold rounded-full">Dibatalkan</span>
      default:
        return null
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING_APPROVAL": return { icon: "hourglass_top", color: "text-amber-500", bg: "bg-amber-500/20" }
      case "ACTIVE": return { icon: "flag", color: "text-primary", bg: "bg-primary/20" }
      case "COMPLETED": return { icon: "check_circle", color: "text-green-500", bg: "bg-green-500/20" }
      case "REJECTED": return { icon: "block", color: "text-red-500", bg: "bg-red-500/20" }
      case "CANCELLED": return { icon: "cancel", color: "text-gray-500", bg: "bg-gray-500/20" }
      default: return { icon: "flag", color: "text-primary", bg: "bg-primary/20" }
    }
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Target Saya</h1>
            <p className="text-muted-foreground">Tetapkan dan tracking target personal Anda, {userName}</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Ajukan Target
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-start gap-3 text-sm">
          <span className="material-symbols-outlined text-blue-500 text-lg mt-0.5">info</span>
          <p className="text-muted-foreground">
            Target yang Anda ajukan akan direview oleh admin. Setelah disetujui, target akan aktif dan mulai dihitung progresnya.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          <div className="bg-card rounded-xl border border-border p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-3 text-center">
            <p className="text-2xl font-bold text-amber-500">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">Menunggu</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-3 text-center">
            <p className="text-2xl font-bold text-blue-500">{stats.active}</p>
            <p className="text-xs text-muted-foreground">Aktif</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-3 text-center">
            <p className="text-2xl font-bold text-green-500">{stats.completed}</p>
            <p className="text-xs text-muted-foreground">Tercapai</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-3 text-center">
            <p className="text-2xl font-bold text-red-500">{stats.rejected}</p>
            <p className="text-xs text-muted-foreground">Ditolak</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-3 text-center">
            <p className="text-2xl font-bold text-gray-500">{stats.cancelled}</p>
            <p className="text-xs text-muted-foreground">Batal</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          {(["ALL", "PENDING_APPROVAL", "ACTIVE", "COMPLETED", "REJECTED"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f 
                  ? "bg-primary text-white" 
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {f === "ALL" ? "Semua" : 
               f === "PENDING_APPROVAL" ? `Menunggu (${stats.pending})` :
               f === "ACTIVE" ? "Aktif" : 
               f === "COMPLETED" ? "Selesai" :
               "Ditolak"}
            </button>
          ))}
        </div>

        {/* Goals List */}
        <div className="space-y-4">
          {filteredGoals.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-12 text-center text-muted-foreground">
              <span className="material-symbols-outlined text-5xl mb-4">flag</span>
              <p className="text-lg font-medium mb-2">Belum ada target</p>
              <p className="text-sm">Mulai dengan mengajukan target pertama Anda!</p>
            </div>
          ) : (
            filteredGoals.map(goal => {
              const statusStyle = getStatusIcon(goal.status)
              return (
                <div 
                  key={goal.id} 
                  className={`bg-card rounded-xl border border-border p-5 ${
                    goal.status === "COMPLETED" ? "opacity-75" : 
                    goal.status === "CANCELLED" || goal.status === "REJECTED" ? "opacity-60" : ""
                  }`}
                >
                  {/* Rejected Reason Banner */}
                  {goal.status === "REJECTED" && goal.reviewNote && (
                    <div className="mb-3 bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2">
                      <span className="material-symbols-outlined text-red-500 text-base mt-0.5">warning</span>
                      <div>
                        <p className="text-sm font-medium text-red-500">Alasan ditolak:</p>
                        <p className="text-sm text-muted-foreground">{goal.reviewNote}</p>
                      </div>
                    </div>
                  )}

                  {/* Revised Note Banner */}
                  {goal.status === "ACTIVE" && goal.reviewNote && (
                    <div className="mb-3 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-start gap-2">
                      <span className="material-symbols-outlined text-blue-500 text-base mt-0.5">info</span>
                      <div>
                        <p className="text-sm font-medium text-blue-500">Catatan admin:</p>
                        <p className="text-sm text-muted-foreground">{goal.reviewNote}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`size-12 rounded-xl flex items-center justify-center ${statusStyle.bg}`}>
                      <span className={`material-symbols-outlined text-2xl ${statusStyle.color}`}>
                        {statusStyle.icon}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-foreground">{goal.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {GOAL_TYPE_LABELS[goal.type]}
                            {goal.pillar && ` • ${PILLAR_INFO[goal.pillar]?.name}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(goal.status)}
                          {goal.status === "ACTIVE" && (
                            <>
                              <button
                                onClick={() => handleComplete(goal.id)}
                                disabled={isPending}
                                className="text-green-500 hover:bg-green-500/10 p-1 rounded"
                                title="Selesaikan"
                              >
                                <span className="material-symbols-outlined text-lg">check</span>
                              </button>
                              <button
                                onClick={() => handleCancel(goal.id)}
                                disabled={isPending}
                                className="text-amber-500 hover:bg-amber-500/10 p-1 rounded"
                                title="Batalkan"
                              >
                                <span className="material-symbols-outlined text-lg">close</span>
                              </button>
                            </>
                          )}
                          {(goal.status === "PENDING_APPROVAL" || goal.status === "REJECTED") && (
                            <button
                              onClick={() => handleDelete(goal.id)}
                              disabled={isPending}
                              className="text-red-500 hover:bg-red-500/10 p-1 rounded"
                              title="Hapus"
                            >
                              <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {goal.description && (
                        <p className="text-sm text-muted-foreground mb-3">{goal.description}</p>
                      )}

                      {/* Progress Bar — only show for ACTIVE/COMPLETED goals */}
                      {(goal.status === "ACTIVE" || goal.status === "COMPLETED") && (
                        <div className="mb-2">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-muted-foreground">
                              {goal.currentValue} / {goal.targetValue}
                            </span>
                            <span className="font-medium">{goal.progress}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all ${
                                goal.status === "COMPLETED" ? "bg-green-500" : "bg-primary"
                              }`}
                              style={{ width: `${goal.progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Target Value for pendng/rejected */}
                      {(goal.status === "PENDING_APPROVAL" || goal.status === "REJECTED") && (
                        <div className="mb-2">
                          <span className="text-sm text-muted-foreground">Nilai target: </span>
                          <span className="text-sm font-bold">{goal.targetValue}</span>
                        </div>
                      )}

                      {/* Due Date */}
                      <div className="flex items-center gap-2 text-sm">
                        <span className="material-symbols-outlined text-base text-muted-foreground">calendar_today</span>
                        <span className={`${
                          goal.status === "ACTIVE" && getDaysRemaining(goal.targetDate) < 0 
                            ? "text-red-500" 
                            : goal.status === "ACTIVE" && getDaysRemaining(goal.targetDate) < 7
                              ? "text-amber-500"
                              : "text-muted-foreground"
                        }`}>
                          {goal.status === "COMPLETED" 
                            ? `Selesai pada ${new Date(goal.completedAt!).toLocaleDateString("id-ID")}`
                            : goal.status === "CANCELLED"
                              ? "Dibatalkan"
                              : goal.status === "REJECTED"
                                ? "Ditolak"
                                : goal.status === "PENDING_APPROVAL"
                                  ? `Deadline: ${new Date(goal.targetDate).toLocaleDateString("id-ID")}`
                                  : getDaysRemaining(goal.targetDate) < 0
                                    ? `Terlambat ${Math.abs(getDaysRemaining(goal.targetDate))} hari`
                                    : getDaysRemaining(goal.targetDate) === 0
                                      ? "Deadline hari ini!"
                                      : `${getDaysRemaining(goal.targetDate)} hari lagi`
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Add Goal Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border border-border w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h2 className="font-bold text-lg">Ajukan Target Baru</h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-start gap-2 text-sm">
                <span className="material-symbols-outlined text-amber-500 text-base mt-0.5">info</span>
                <p className="text-muted-foreground">Target akan dikirim ke admin untuk direview sebelum aktif.</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Judul Target *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                  placeholder="Contoh: Menyelesaikan 10 aktivitas"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Deskripsi</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background resize-none"
                  rows={2}
                  placeholder="Deskripsi opsional..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tipe Target</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as GoalType})}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                  >
                    {Object.entries(GOAL_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Pilar (Opsional)</label>
                  <select
                    value={formData.pillar}
                    onChange={(e) => setFormData({...formData, pillar: e.target.value as PastoralPillar | ""})}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                  >
                    <option value="">Semua Pilar</option>
                    {Object.entries(PILLAR_INFO).map(([value, info]) => (
                      <option key={value} value={value}>{info.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nilai Target *</label>
                  <input
                    type="number"
                    value={formData.targetValue}
                    onChange={(e) => setFormData({...formData, targetValue: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                    min={1}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Target Date *</label>
                  <input
                    type="date"
                    value={formData.targetDate}
                    onChange={(e) => setFormData({...formData, targetDate: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  {isPending ? "Mengirim..." : "Ajukan Target"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </>
  )
}
