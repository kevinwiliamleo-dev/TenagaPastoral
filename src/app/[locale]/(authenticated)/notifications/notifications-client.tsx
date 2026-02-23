"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  deleteNotification 
} from "@/lib/actions/notifications"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  linkUrl: string | null
  linkText: string | null
  isRead: boolean
  createdAt: Date
}

// Reuse icon/color logic or import if shared
const typeIcons: Record<string, string> = {
  EVALUATION_REMINDER: "assignment",
  TASK_ASSIGNED: "task_alt",
  TASK_DUE_SOON: "schedule",
  TASK_OVERDUE: "error",
  GOAL_DEADLINE: "flag",
  GOAL_ACHIEVED: "emoji_events",
  DEVELOPMENT_PLAN: "trending_up",
  SYSTEM: "info",
}

const typeColors: Record<string, string> = {
  EVALUATION_REMINDER: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  TASK_ASSIGNED: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  TASK_DUE_SOON: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  TASK_OVERDUE: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  GOAL_DEADLINE: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400",
  GOAL_ACHIEVED: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  DEVELOPMENT_PLAN: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  SYSTEM: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
}

export function NotificationsClient({ 
  initialNotifications,
  userId 
}: { 
  initialNotifications: Notification[]
  userId: string 
}) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id)
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      )
      router.refresh() // Update bell count
    } catch (error) {
      console.error("Error marking as read:", error)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      setIsLoading(true)
      await markAllNotificationsAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      router.refresh()
    } catch (error) {
      console.error("Error marking all read:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus notifikasi ini?")) return
    
    try {
      await deleteNotification(id)
      setNotifications(prev => prev.filter(n => n.id !== id))
    } catch (error) {
      console.error("Error deleting notification:", error)
    }
  }

  const formatTimeFull = (date: Date) => {
    return new Date(date).toLocaleString("id-ID", {
      weekday: 'long',
      day: 'numeric',
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Actions Bar */}
      <div className="flex justify-end mb-4">
        <button
          onClick={handleMarkAllRead}
          disabled={isLoading || !notifications.some(n => !n.isRead)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[18px]">done_all</span>
          Tandai semua dibaca
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <span className="material-symbols-outlined text-3xl text-muted-foreground">notifications_off</span>
            </div>
            <h3 className="text-lg font-medium text-foreground">Tidak ada notifikasi</h3>
            <p className="text-muted-foreground mt-1">Anda belum memiliki notifikasi apapun saat ini.</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div 
              key={notification.id}
              className={`relative flex gap-4 p-4 rounded-xl border transition-all ${
                notification.isRead 
                  ? "bg-card border-border" 
                  : "bg-card border-primary/30 shadow-sm ring-1 ring-primary/10"
              }`}
            >
              {/* Icon */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${typeColors[notification.type] || typeColors.SYSTEM}`}>
                <span className="material-symbols-outlined">
                  {typeIcons[notification.type] || "notifications"}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className={`font-semibold ${!notification.isRead ? "text-foreground" : "text-foreground/80"}`}>
                      {notification.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {notification.message}
                    </p>
                    
                    {notification.linkUrl && (
                      <a 
                        href={notification.linkUrl}
                        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline mt-2"
                      >
                        {notification.linkText || "Lihat detail"}
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </a>
                    )}
                    
                    <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{formatTimeFull(notification.createdAt)}</span>
                      {!notification.isRead && (
                        <span className="text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full">Baru</span>
                      )}
                    </div>
                  </div>

                  {/* Item Actions */}
                  <div className="flex items-center gap-1">
                    {!notification.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-full tooltip-trigger"
                        title="Tandai dibaca"
                      >
                        <span className="material-symbols-outlined text-[20px]">mark_email_read</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notification.id)}
                      className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-full"
                      title="Hapus"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
