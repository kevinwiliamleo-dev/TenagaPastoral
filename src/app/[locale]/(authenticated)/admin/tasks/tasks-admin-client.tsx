"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getAllTasks, assignTaskToStaff } from "@/lib/actions/tasks"
import { useToast } from "@/hooks/use-toast"

type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED"
type TaskPriority = "LOW" | "MEDIUM" | "HIGH"

interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  dueDate: Date | null
  assignedTo: string | null
  createdBy: string
  createdAt: Date
  userName: string | null
  userEmail: string
  creatorName: string | null
}

interface Stats {
  todo: number
  inProgress: number
  completed: number
}

interface StaffSummary {
  id: string
  name: string
  email: string
  todoCount: number
  inProgressCount: number
  completedCount: number
}

interface Staff {
  id: string
  name: string
  email: string
}

interface TasksAdminClientProps {
  initialTasks: Task[]
  stats: Stats | null
  staffSummary: StaffSummary[]
  staffList: Staff[]
  userName: string
}

export function TasksAdminClient({
  initialTasks,
  stats,
  staffSummary,
  staffList,
  userName,
}: TasksAdminClientProps) {
  const { toast } = useToast()
  const [selectedStaffId, setSelectedStaffId] = useState<string>("")
  const [tasks, setTasks] = useState(initialTasks)
  const [loading, setLoading] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  
  // Form state for new task
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "MEDIUM" as TaskPriority,
    dueDate: "",
    assignedTo: ""
  })

  const handleStaffFilter = async (staffId: string) => {
    setSelectedStaffId(staffId)
    setLoading(true)
    try {
      const filtered = await getAllTasks(staffId || undefined)
      setTasks(filtered)
    } catch (error) {
      console.error("Error filtering:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const result = await assignTaskToStaff({
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        dueDate: newTask.dueDate,
        assignedTo: newTask.assignedTo
      })
      
      if (result.success) {
        toast({ title: "Berhasil", description: result.message })
        setShowAssignModal(false)
        setNewTask({ title: "", description: "", priority: "MEDIUM", dueDate: "", assignedTo: "" })
        // Refresh tasks
        const updated = await getAllTasks()
        setTasks(updated)
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Gagal menugaskan tugas", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: TaskStatus) => {
    const styles = {
      TODO: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
      IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
    }
    const labels = { TODO: "To Do", IN_PROGRESS: "Sedang Dikerjakan", COMPLETED: "Selesai" }
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>{labels[status]}</span>
  }

  const getPriorityBadge = (priority: TaskPriority) => {
    const styles = {
      HIGH: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      MEDIUM: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
      LOW: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
    }
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[priority]}`}>{priority}</span>
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight">Manajemen Tugas</h1>
            <p className="text-muted-foreground">Kelola dan tugaskan tugas untuk semua Staff Pastoral</p>
          </div>
          
          <div className="flex gap-2">
            <select
              value={selectedStaffId}
              onChange={(e) => handleStaffFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Semua Staff</option>
              {staffList.map((staff) => (
                <option key={staff.id} value={staff.id}>{staff.name}</option>
              ))}
            </select>
            
            <button
              onClick={() => setShowAssignModal(true)}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">add_task</span>
              Tugaskan
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">{stats?.todo || 0}</div>
              <p className="text-sm text-muted-foreground">To Do</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">{stats?.inProgress || 0}</div>
              <p className="text-sm text-muted-foreground">Sedang Dikerjakan</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{stats?.completed || 0}</div>
              <p className="text-sm text-muted-foreground">Selesai</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-foreground">{(stats?.todo || 0) + (stats?.inProgress || 0) + (stats?.completed || 0)}</div>
              <p className="text-sm text-muted-foreground">Total Tugas</p>
            </CardContent>
          </Card>
        </div>

        {/* Staff Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Ringkasan per Staff</CardTitle>
            <CardDescription>Status tugas setiap Staff Pastoral</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Staff</th>
                    <th className="text-center py-3 px-4 font-semibold text-yellow-600">To Do</th>
                    <th className="text-center py-3 px-4 font-semibold text-blue-600">Progress</th>
                    <th className="text-center py-3 px-4 font-semibold text-green-600">Selesai</th>
                    <th className="text-right py-3 px-4 font-semibold text-foreground">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {staffSummary.map((staff) => (
                    <tr key={staff.id} className="border-b border-border hover:bg-accent/50">
                      <td className="py-3 px-4">
                        <p className="font-medium text-foreground">{staff.name}</p>
                      </td>
                      <td className="py-3 px-4 text-center font-semibold">{staff.todoCount}</td>
                      <td className="py-3 px-4 text-center font-semibold">{staff.inProgressCount}</td>
                      <td className="py-3 px-4 text-center font-semibold">{staff.completedCount}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleStaffFilter(staff.id)}
                          className="text-primary hover:underline text-sm"
                        >
                          Lihat
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Tasks List */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Tugas</CardTitle>
            <CardDescription>{loading ? "Memuat..." : `${tasks.length} tugas ditemukan`}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : tasks.length > 0 ? (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-foreground">{task.title}</p>
                        {getStatusBadge(task.status)}
                        {getPriorityBadge(task.priority)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {task.userName || "Tidak ditugaskan"} • Dibuat oleh {task.creatorName || "Unknown"}
                      </p>
                    </div>
                    {task.dueDate && (
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Due</p>
                        <p className="text-sm font-medium text-foreground">
                          {new Date(task.dueDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-5xl text-muted-foreground mb-3">task</span>
                <p className="text-muted-foreground">Belum ada tugas.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assign Modal */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card rounded-xl p-6 w-full max-w-md shadow-xl border border-border">
              <h2 className="text-xl font-bold text-foreground mb-4">Tugaskan Tugas Baru</h2>
              <form onSubmit={handleAssignTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Judul</label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask(p => ({ ...p, title: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Deskripsi</label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask(p => ({ ...p, description: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Prioritas</label>
                    <select
                      value={newTask.priority}
                      onChange={(e) => setNewTask(p => ({ ...p, priority: e.target.value as TaskPriority }))}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Deadline</label>
                    <input
                      type="date"
                      value={newTask.dueDate}
                      onChange={(e) => setNewTask(p => ({ ...p, dueDate: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Tugaskan ke</label>
                  <select
                    value={newTask.assignedTo}
                    onChange={(e) => setNewTask(p => ({ ...p, assignedTo: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                    required
                  >
                    <option value="">Pilih Staff...</option>
                    {staffList.map((staff) => (
                      <option key={staff.id} value={staff.id}>{staff.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 justify-end mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(false)}
                    className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-accent"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50"
                  >
                    {loading ? "Menyimpan..." : "Tugaskan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
