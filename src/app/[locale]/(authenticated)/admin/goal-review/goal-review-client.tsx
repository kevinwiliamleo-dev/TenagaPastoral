"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { approveGoal, reviseGoal, rejectGoal, type Goal, type GoalType } from "@/lib/actions/goals"
import { PILLAR_INFO } from "@/lib/constants"

interface GoalReviewClientProps {
  initialGoals: Goal[]
  adminName: string
}

const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  ACTIVITY_COUNT: "Jumlah Aktivitas",
  ACTIVITY_DURATION: "Durasi Aktivitas",
  TASK_COMPLETION: "Tugas Selesai",
  PILLAR_BALANCE: "Keseimbangan Pilar",
  CUSTOM: "Custom"
}

export function GoalReviewClient({ initialGoals, adminName }: GoalReviewClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  // Modal states
  const [reviewGoal, setReviewGoal] = useState<Goal | null>(null)
  const [reviewAction, setReviewAction] = useState<"approve" | "revise" | "reject" | null>(null)
  const [reviewNote, setReviewNote] = useState("")
  const [revisedTarget, setRevisedTarget] = useState(0)

  const openReviewModal = (goal: Goal, action: "approve" | "revise" | "reject") => {
    setReviewGoal(goal)
    setReviewAction(action)
    setReviewNote("")
    setRevisedTarget(goal.targetValue)
  }

  const closeModal = () => {
    setReviewGoal(null)
    setReviewAction(null)
    setReviewNote("")
  }

  const handleSubmitReview = async () => {
    if (!reviewGoal || !reviewAction) return

    startTransition(async () => {
      let result
      switch (reviewAction) {
        case "approve":
          result = await approveGoal(reviewGoal.id, reviewNote || undefined)
          break
        case "revise":
          result = await reviseGoal(reviewGoal.id, revisedTarget, reviewNote)
          break
        case "reject":
          result = await rejectGoal(reviewGoal.id, reviewNote)
          break
      }
      
      if (result?.success) {
        closeModal()
        router.refresh()
      } else {
        alert(result?.message || "Gagal memproses review")
      }
    })
  }

  const formatDate = (date: Date) => new Date(date).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric"
  })

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Review Target Staff</h1>
          <p className="text-muted-foreground">Review dan setujui target yang diajukan oleh staff, {adminName}</p>
        </div>

        {/* Stats */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-2xl text-amber-500">pending_actions</span>
          <div>
            <p className="text-lg font-bold text-foreground">{initialGoals.length} target menunggu review</p>
            <p className="text-sm text-muted-foreground">Staff mengajukan target dan menunggu persetujuan Anda</p>
          </div>
        </div>

        {/* Goals List */}
        <div className="space-y-4">
          {initialGoals.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-12 text-center text-muted-foreground">
              <span className="material-symbols-outlined text-5xl mb-4">task_alt</span>
              <p className="text-lg font-medium mb-2">Tidak ada target yang perlu direview</p>
              <p className="text-sm">Semua target staff sudah diproses</p>
            </div>
          ) : (
            initialGoals.map(goal => (
              <div key={goal.id} className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="size-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl text-amber-500">hourglass_top</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-foreground">{goal.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Diajukan oleh: <span className="font-medium text-foreground">{goal.userName || goal.userEmail}</span>
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-amber-500/10 text-amber-500 text-xs font-bold rounded-full">
                        Menunggu Review
                      </span>
                    </div>

                    {goal.description && (
                      <p className="text-sm text-muted-foreground mb-3">{goal.description}</p>
                    )}

                    {/* Details */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                      <div className="bg-muted/50 rounded-lg p-2">
                        <p className="text-xs text-muted-foreground">Tipe</p>
                        <p className="text-sm font-medium">{GOAL_TYPE_LABELS[goal.type]}</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2">
                        <p className="text-xs text-muted-foreground">Nilai Target</p>
                        <p className="text-sm font-bold text-primary">{goal.targetValue}</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2">
                        <p className="text-xs text-muted-foreground">Pilar</p>
                        <p className="text-sm font-medium">{goal.pillar ? PILLAR_INFO[goal.pillar]?.name : "Semua"}</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2">
                        <p className="text-xs text-muted-foreground">Deadline</p>
                        <p className="text-sm font-medium">{formatDate(goal.targetDate)}</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => openReviewModal(goal, "approve")}
                        disabled={isPending}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium flex items-center gap-1 disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-base">check</span>
                        Setujui
                      </button>
                      <button
                        onClick={() => openReviewModal(goal, "revise")}
                        disabled={isPending}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-1 disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-base">edit</span>
                        Revisi Target
                      </button>
                      <button
                        onClick={() => openReviewModal(goal, "reject")}
                        disabled={isPending}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium flex items-center gap-1 disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-base">close</span>
                        Tolak
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Review Modal */}
      {reviewGoal && reviewAction && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border border-border w-full max-w-md">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h2 className="font-bold text-lg">
                {reviewAction === "approve" ? "Setujui Target" :
                 reviewAction === "revise" ? "Revisi & Setujui Target" :
                 "Tolak Target"}
              </h2>
              <button onClick={closeModal} className="text-muted-foreground hover:text-foreground">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Goal Info */}
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="font-medium">{reviewGoal.title}</p>
                <p className="text-sm text-muted-foreground">
                  Oleh: {reviewGoal.userName || reviewGoal.userEmail}
                </p>
                <p className="text-sm text-muted-foreground">
                  Target: <span className="font-bold">{reviewGoal.targetValue}</span> ({GOAL_TYPE_LABELS[reviewGoal.type]})
                </p>
              </div>

              {/* Revise: Change target value */}
              {reviewAction === "revise" && (
                <div>
                  <label className="block text-sm font-medium mb-1">Nilai Target Baru *</label>
                  <input
                    type="number"
                    value={revisedTarget}
                    onChange={(e) => setRevisedTarget(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                    min={1}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Target asal: {reviewGoal.targetValue}
                  </p>
                </div>
              )}

              {/* Note */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  {reviewAction === "reject" ? "Alasan Penolakan *" : "Catatan (Opsional)"}
                </label>
                <textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background resize-none"
                  rows={3}
                  placeholder={
                    reviewAction === "approve" ? "Catatan persetujuan (opsional)..." :
                    reviewAction === "revise" ? "Alasan perubahan target..." :
                    "Jelaskan alasan penolakan..."
                  }
                  required={reviewAction === "reject" || reviewAction === "revise"}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmitReview}
                  disabled={isPending || (reviewAction === "reject" && reviewNote.trim().length < 3) || (reviewAction === "revise" && (revisedTarget <= 0 || !reviewNote.trim()))}
                  className={`flex-1 px-4 py-2 text-white rounded-lg disabled:opacity-50 ${
                    reviewAction === "approve" ? "bg-green-600 hover:bg-green-700" :
                    reviewAction === "revise" ? "bg-blue-600 hover:bg-blue-700" :
                    "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {isPending ? "Memproses..." :
                   reviewAction === "approve" ? "Setujui" :
                   reviewAction === "revise" ? "Revisi & Setujui" :
                   "Tolak"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
