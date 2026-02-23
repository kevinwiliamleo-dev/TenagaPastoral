"use client"

import { useState, useEffect } from "react"
import { getTaskWithTimeline, createMilestone, TaskMilestone } from "@/lib/actions/tasks"

type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED"
type TaskPriority = "LOW" | "MEDIUM" | "HIGH"

interface TaskWithTimeline {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  dueDate: Date | null
  assigneeName: string | null
  createdAt: Date
  completedAt: Date | null
  milestones: TaskMilestone[]
}

interface TaskTimelineModalProps {
  taskId: string
  onClose: () => void
  onStatusChange?: () => void
}

const STATUS_CONFIG = {
  TODO: { label: "To Do", color: "bg-yellow-500", icon: "pending" },
  IN_PROGRESS: { label: "Sedang Dikerjakan", color: "bg-blue-500", icon: "autorenew" },
  COMPLETED: { label: "Selesai", color: "bg-green-500", icon: "check_circle" }
}

const PRIORITY_CONFIG = {
  LOW: { label: "Rendah", color: "text-gray-500" },
  MEDIUM: { label: "Sedang", color: "text-yellow-500" },
  HIGH: { label: "Tinggi", color: "text-red-500" }
}

export function TaskTimelineModal({ taskId, onClose, onStatusChange }: TaskTimelineModalProps) {
  const [task, setTask] = useState<TaskWithTimeline | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddNote, setShowAddNote] = useState(false)
  const [note, setNote] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function fetchTask() {
      setLoading(true)
      try {
        const data = await getTaskWithTimeline(taskId)
        setTask(data)
      } catch (error) {
        console.error("Error fetching task:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchTask()
  }, [taskId])

  const handleAddNote = async () => {
    if (!task || !note.trim()) return
    setSubmitting(true)
    try {
      const result = await createMilestone(taskId, task.status, note)
      if (result.success) {
        const data = await getTaskWithTimeline(taskId)
        setTask(data)
        setNote("")
        setShowAddNote(false)
        onStatusChange?.()
      }
    } catch (error) {
      console.error("Error adding note:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("id-ID", { 
      day: "numeric", 
      month: "short", 
      year: "numeric" 
    })
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("id-ID", { 
      hour: "2-digit", 
      minute: "2-digit" 
    })
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-card rounded-xl p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-card rounded-xl p-8">
          <p className="text-muted-foreground">Task tidak ditemukan</p>
        </div>
      </div>
    )
  }

  const statusConfig = STATUS_CONFIG[task.status]
  const priorityConfig = PRIORITY_CONFIG[task.priority]

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-card rounded-2xl w-full max-w-xl max-h-[90vh] overflow-hidden shadow-2xl border border-border"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-foreground">{task.title}</h2>
              {task.description && (
                <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
              )}
            </div>
            <button 
              onClick={onClose}
              className="size-10 rounded-full hover:bg-accent flex items-center justify-center transition"
            >
              <span className="material-symbols-outlined text-muted-foreground">close</span>
            </button>
          </div>
          
          {/* Status & Info */}
          <div className="flex flex-wrap gap-2 items-center text-sm">
            <span className={`px-2 py-1 rounded-full text-white ${statusConfig.color} flex items-center gap-1`}>
              <span className="material-symbols-outlined text-sm">{statusConfig.icon}</span>
              {statusConfig.label}
            </span>
            <span className={`${priorityConfig.color} flex items-center gap-1`}>
              <span className="material-symbols-outlined text-sm">flag</span>
              {priorityConfig.label}
            </span>
            {task.dueDate && (
              <span className="text-muted-foreground flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">event</span>
                {formatDate(task.dueDate)}
              </span>
            )}
            {task.assigneeName && (
              <span className="text-muted-foreground flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">person</span>
                {task.assigneeName}
              </span>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-220px)]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-foreground">Timeline Aktivitas</h3>
            <button
              onClick={() => setShowAddNote(!showAddNote)}
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Tambah Catatan
            </button>
          </div>

          {/* Add Note Form */}
          {showAddNote && (
            <div className="mb-4 p-3 rounded-lg border border-border bg-accent/30">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Tulis catatan progres..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none"
                rows={3}
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => { setShowAddNote(false); setNote("") }}
                  className="px-3 py-1 text-sm rounded-lg hover:bg-accent transition"
                >
                  Batal
                </button>
                <button
                  onClick={handleAddNote}
                  disabled={submitting || !note.trim()}
                  className="px-3 py-1 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
                >
                  {submitting ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </div>
          )}

          {/* Timeline Items */}
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border"></div>

            {/* Created Event */}
            <div className="relative flex gap-4 pb-4">
              <div className="size-8 rounded-full bg-accent border-2 border-border flex items-center justify-center z-10">
                <span className="material-symbols-outlined text-sm text-muted-foreground">add_circle</span>
              </div>
              <div className="flex-1 pt-0.5">
                <p className="text-sm font-medium text-foreground">Tugas dibuat</p>
                <p className="text-xs text-muted-foreground">{formatDate(task.createdAt)} • {formatTime(task.createdAt)}</p>
              </div>
            </div>

            {/* Milestone Events */}
            {task.milestones.map((milestone) => {
              const config = STATUS_CONFIG[milestone.status]
              return (
                <div key={milestone.id} className="relative flex gap-4 pb-4">
                  <div className={`size-8 rounded-full ${config.color} flex items-center justify-center z-10`}>
                    <span className="material-symbols-outlined text-sm text-white">{config.icon}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{config.label}</p>
                    {milestone.note && (
                      <p className="text-sm text-muted-foreground mt-1 bg-accent/30 p-2 rounded-lg">{milestone.note}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(milestone.createdAt)} • {formatTime(milestone.createdAt)} • oleh {milestone.createdByName}
                    </p>
                  </div>
                </div>
              )
            })}

            {/* Completed Event */}
            {task.completedAt && (
              <div className="relative flex gap-4 pb-4">
                <div className="size-8 rounded-full bg-green-500 flex items-center justify-center z-10">
                  <span className="material-symbols-outlined text-sm text-white">verified</span>
                </div>
                <div className="flex-1 pt-0.5">
                  <p className="text-sm font-medium text-foreground">Tugas selesai</p>
                  <p className="text-xs text-muted-foreground">{formatDate(task.completedAt)} • {formatTime(task.completedAt)}</p>
                </div>
              </div>
            )}

            {/* Empty State */}
            {task.milestones.length === 0 && !task.completedAt && (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">Belum ada aktivitas lain.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
