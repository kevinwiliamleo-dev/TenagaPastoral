"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { createTask, updateTaskStatus, deleteTask, type TaskWithUser, type Task } from "@/lib/actions/tasks"
import { useToast } from "@/hooks/use-toast"
import { TaskTimelineModal } from "@/components/task-timeline-modal"
import { TaskDetailModal } from "@/components/tasks/task-detail-modal"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED"
type TaskPriority = "LOW" | "MEDIUM" | "HIGH"

interface Stats {
  todo: number
  inProgress: number
  completed: number
}

interface TasksClientProps {
  tasks: TaskWithUser[]
  stats: Stats
  userRole: "ADMIN" | "PASTORAL_STAFF"
  userName: string
}

const STATUSES: { key: TaskStatus; icon: string; color: string }[] = [
  { key: "TODO", icon: "radio_button_unchecked", color: "bg-slate-500" },
  { key: "IN_PROGRESS", icon: "pending", color: "bg-amber-500" },
  { key: "COMPLETED", icon: "check_circle", color: "bg-green-500" },
]

const PRIORITIES: { key: TaskPriority; label: string; color: string; badge: string }[] = [
  { key: "HIGH", label: "Tinggi", color: "bg-red-500 text-white", badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
  { key: "MEDIUM", label: "Sedang", color: "bg-amber-500 text-white", badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  { key: "LOW", label: "Rendah", color: "bg-slate-400 text-white", badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
]

export function TasksClient({ tasks, stats, userRole, userName }: TasksClientProps) {
  const t = useTranslations("Tasks")
  const tCommon = useTranslations("Common")
  const { toast } = useToast()
  
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [timelineTaskId, setTimelineTaskId] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<TaskWithUser | null>(null)
  
  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM")
  const [dueDate, setDueDate] = useState("")

  const getStatusLabel = (status: TaskStatus) => {
    switch(status) {
      case "TODO": return t("todo")
      case "IN_PROGRESS": return t("in_progress")
      case "COMPLETED": return t("completed")
      default: return status
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const result = await createTask({ title, description, priority, dueDate })
      if (result.success) {
        toast({ title: tCommon("save"), description: result.message })
        setShowForm(false)
        setTitle("")
        setDescription("")
        setDueDate("")
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: tCommon("error_generic"), variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    const result = await updateTaskStatus(id, status)
    if (result.success) {
      toast({ title: tCommon("save"), description: result.message })
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(tCommon("confirm"))) return
    const result = await deleteTask(id)
    if (result.success) {
      toast({ title: tCommon("delete"), description: result.message })
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" })
    }
  }

  const getTasksByStatus = (status: TaskStatus) => tasks.filter(t => t.status === status)

  const handleTaskUpdate = () => {
    setSelectedTask(null)
    window.location.reload() 
  }

  const getProgress = (t: Task) => {
    if (!t.checklist || t.checklist.length === 0) return 0
    const completed = t.checklist.filter(i => i.isCompleted).length
    return Math.round((completed / t.checklist.length) * 100)
  }

  return (
    <>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header restored */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
            <p className="text-muted-foreground">{t("subtitle")}</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition shadow-sm"
          >
            <span className="material-symbols-outlined">add</span>
            {t("add_task")}
          </button>
        </div>
        
        {/* Kanban Board */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {STATUSES.map((s) => {
            const statusTasks = getTasksByStatus(s.key)
            const label = getStatusLabel(s.key)
            
            return (
              <div key={s.key} className="bg-muted/30 rounded-xl p-4 border border-border/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className={`material-symbols-outlined ${s.key === "COMPLETED" ? "text-green-500" : s.key === "IN_PROGRESS" ? "text-amber-500" : "text-slate-500"}`}>
                      {s.icon}
                    </span>
                    <h2 className="font-bold text-foreground text-sm uppercase tracking-wider">{label}</h2>
                  </div>
                  <span className="bg-background px-2 py-0.5 rounded-md text-xs font-semibold border border-border shadow-sm">
                    {statusTasks.length}
                  </span>
                </div>
                
                <div className="space-y-3">
                  {statusTasks.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-border rounded-lg bg-background/50">
                      <p className="text-muted-foreground text-sm font-medium">{t("no_tasks")}</p>
                    </div>
                  ) : (
                    statusTasks.map((task) => {
                      const priorityInfo = PRIORITIES.find(p => p.key === task.priority)
                      const progress = getProgress(task)
                      const isAssignedByOthers = task.creatorName && task.creatorName !== userName
                      
                      return (
                        <Card 
                          key={task.id} 
                          className="hover:shadow-md transition-all cursor-pointer group border-l-4"
                          style={{ borderLeftColor: s.color.replace('bg-', '').replace('text-', '') }} // Dynamic border color
                          onClick={() => setSelectedTask(task)}
                        >
                          <CardContent className="p-4 space-y-3">
                            <div className="flex justify-between items-start gap-2">
                              <h3 className="font-semibold text-foreground line-clamp-2 leading-tight">{task.title}</h3>
                              <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 uppercase tracking-wide", priorityInfo?.badge)}>
                                {priorityInfo?.label}
                              </span>
                            </div>
                            
                            {task.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{task.description}</p>
                            )}

                             {/* Assignee Info - Showing the relationship */}
                             <div className="flex items-center gap-2 mt-2">
                                <Avatar name={task.creatorName || "Unknown"} size="sm" className="size-6 text-[10px]" />
                                <div className="flex flex-col">
                                  <span className="text-[10px] text-muted-foreground leading-none">
                                    {isAssignedByOthers ? `Ditugaskan oleh ${task.creatorName}` : "Dibuat sendiri"}
                                  </span>
                                </div>
                             </div>
                            
                            {/* Checklist Progress */}
                            {task.checklist && task.checklist.length > 0 && (
                              <div className="space-y-1 pt-1">
                                <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                                  <span>{t("modal.checklist")}</span>
                                  <span>{progress}%</span>
                                  </div>
                                <div className="h-1.5 w-full bg-secondary/50 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-primary transition-all duration-500 ease-out" 
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              </div>
                            )}

                            {task.dueDate && (
                              <div className={cn(
                                "flex items-center gap-1.5 text-xs pt-1 font-medium",
                                new Date(task.dueDate) < new Date() && task.status !== "COMPLETED" ? "text-red-500" : "text-muted-foreground"
                              )}>
                                <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                                {new Date(task.dueDate).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' })}
                                {new Date(task.dueDate) < new Date() && task.status !== "COMPLETED" && (
                                  <span className="text-[10px] bg-red-100 dark:bg-red-900/30 px-1 rounded">Overdue</span>
                                )}
                              </div>
                            )}
                          </CardContent>

                          <CardFooter className="p-2 bg-muted/30 flex justify-between items-center border-t border-border/50">
                            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                              {s.key !== "TODO" && (
                                <button
                                  onClick={() => handleStatusChange(task.id, "TODO")}
                                  className="size-7 rounded-sm hover:bg-background border border-transparent hover:border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all shadow-sm"
                                  title="To Do"
                                >
                                  <span className="material-symbols-outlined text-[16px]">undo</span>
                                </button>
                              )}
                               {s.key !== "IN_PROGRESS" && (
                                <button
                                  onClick={() => handleStatusChange(task.id, "IN_PROGRESS")}
                                  className="size-7 rounded-sm hover:bg-amber-50 border border-transparent hover:border-amber-200 flex items-center justify-center text-muted-foreground hover:text-amber-600 transition-all shadow-sm"
                                  title="Start"
                                >
                                  <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                                </button>
                              )}
                              {s.key !== "COMPLETED" && (
                                <button
                                  onClick={() => handleStatusChange(task.id, "COMPLETED")}
                                  className="size-7 rounded-sm hover:bg-green-50 border border-transparent hover:border-green-200 flex items-center justify-center text-muted-foreground hover:text-green-600 transition-all shadow-sm"
                                  title="Complete"
                                >
                                  <span className="material-symbols-outlined text-[16px]">check</span>
                                </button>
                              )}
                            </div>
                            
                            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => setTimelineTaskId(task.id)}
                                className="size-7 rounded-sm hover:bg-background border border-transparent hover:border-border flex items-center justify-center text-muted-foreground hover:text-primary transition-all shadow-sm"
                                title="Timeline"
                              >
                                <span className="material-symbols-outlined text-[16px]">history</span>
                              </button>
                               <button
                                onClick={() => handleDelete(task.id)}
                                className="size-7 rounded-sm hover:bg-red-50 border border-transparent hover:border-red-200 flex items-center justify-center text-muted-foreground hover:text-red-500 transition-all shadow-sm"
                                title={tCommon("delete")}
                              >
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                              </button>
                            </div>
                          </CardFooter>
                        </Card>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Add Task Modal */}
        {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-card rounded-xl shadow-2xl w-full max-w-lg mx-4 border border-border animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-border flex justify-between items-center bg-muted/10">
                <h2 className="text-xl font-bold text-foreground">{t("add_task")}</h2>
                <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-muted transition text-muted-foreground hover:text-foreground">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-foreground">{t("form.title")}</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 focus:ring-2 focus:ring-primary/20 transition"
                    placeholder="Contoh: Persiapan misa minggu"
                    required
                  />
                </div>
                
                <div className="space-y-1.5">
                   <label className="block text-sm font-semibold text-foreground">{t("form.description")}</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 min-h-[100px] focus:ring-2 focus:ring-primary/20 transition resize-none"
                    placeholder="Deskripsi detail tugas..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-foreground">{t("form.priority")}</label>
                    <div className="relative">
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as TaskPriority)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 appearance-none focus:ring-2 focus:ring-primary/20 transition"
                      >
                        {PRIORITIES.map((p) => (
                          <option key={p.key} value={p.key}>{p.label}</option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-2.5 text-muted-foreground pointer-events-none">expand_more</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-foreground">{t("form.due_date")}</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 focus:ring-2 focus:ring-primary/20 transition"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 py-2.5 rounded-lg border border-border font-medium hover:bg-muted transition text-muted-foreground hover:text-foreground"
                  >
                    {tCommon("cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition disabled:opacity-50 shadow-lg shadow-primary/20"
                  >
                    {isSubmitting ? tCommon("loading") : tCommon("save")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Task Timeline Modal */}
        {timelineTaskId && (
          <TaskTimelineModal
            taskId={timelineTaskId}
            onClose={() => setTimelineTaskId(null)}
          />
        )}

        {/* Task Detail Modal */}
        {selectedTask && (
          <TaskDetailModal
             task={selectedTask}
             isOpen={!!selectedTask}
             onClose={() => setSelectedTask(null)}
             onUpdate={handleTaskUpdate}
          />
        )}
      </div>
    </>
  )
}
