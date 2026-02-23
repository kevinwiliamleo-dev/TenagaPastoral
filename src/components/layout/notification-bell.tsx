"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { 
  getNotificationData,
  markNotificationAsRead,
  markAllNotificationsAsRead 
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

// Notification type icons
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

// Notification type colors
const typeColors: Record<string, string> = {
  EVALUATION_REMINDER: "text-blue-500",
  TASK_ASSIGNED: "text-green-500",
  TASK_DUE_SOON: "text-orange-500",
  TASK_OVERDUE: "text-red-500",
  GOAL_DEADLINE: "text-yellow-500",
  GOAL_ACHIEVED: "text-emerald-500",
  DEVELOPMENT_PLAN: "text-purple-500",
  SYSTEM: "text-gray-500",
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Load notifications
  const loadNotifications = async () => {
    try {
      const { notifications, unreadCount } = await getNotificationData(10)
      setNotifications(notifications)
      setUnreadCount(unreadCount)
    } catch (error) {
      console.error("Error loading notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
    
    // Refresh every 60 seconds
    const interval = setInterval(loadNotifications, 60000)
    return () => clearInterval(interval)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markNotificationAsRead(notification.id)
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    }

    if (notification.linkUrl) {
      router.push(notification.linkUrl)
      setIsOpen(false)
    }
  }

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead()
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    setUnreadCount(0)
  }

  // Format time
  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "Baru saja"
    if (minutes < 60) return `${minutes} menit lalu`
    if (hours < 24) return `${hours} jam lalu`
    if (days < 7) return `${days} hari lalu`
    return new Date(date).toLocaleDateString("id-ID")
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-accent transition-colors"
        aria-label="Notifikasi"
      >
        <span className="material-symbols-outlined text-foreground/70">
          notifications
        </span>
        
        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
            <h3 className="font-semibold text-foreground">Notifikasi</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-primary hover:underline"
              >
                Tandai semua dibaca
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <span className="material-symbols-outlined animate-spin text-muted-foreground">
                  progress_activity
                </span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <span className="material-symbols-outlined text-4xl mb-2">notifications_off</span>
                <p className="text-sm">Tidak ada notifikasi</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full text-left px-4 py-3 border-b border-border/50 hover:bg-accent/50 transition-colors ${
                    !notification.isRead ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div className={`flex-shrink-0 ${typeColors[notification.type] || "text-gray-500"}`}>
                      <span className="material-symbols-outlined">
                        {typeIcons[notification.type] || "notifications"}
                      </span>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium ${!notification.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <span className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-1.5" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-border bg-muted/30">
              <button
                onClick={() => {
                  router.push("/notifications")
                  setIsOpen(false)
                }}
                className="w-full text-center text-sm text-primary hover:underline"
              >
                Lihat semua notifikasi
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
