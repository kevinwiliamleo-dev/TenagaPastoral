"use client"

import { useState, useEffect, createContext, useContext, useCallback } from "react"
import { cn } from "@/lib/utils"

interface Toast {
  id: string
  type: "success" | "error" | "warning" | "info"
  title: string
  message?: string
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, "id">) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2, 9)
    setToasts((prev) => [...prev, { ...toast, id }])

    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm w-full">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [isExiting, setIsExiting] = useState(false)

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => onRemove(toast.id), 200)
  }

  const iconMap = {
    success: { icon: "check_circle", color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/20" },
    error: { icon: "error", color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20" },
    warning: { icon: "warning", color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
    info: { icon: "info", color: "text-primary", bg: "bg-blue-50 dark:bg-blue-900/20" },
  }

  const { icon, color, bg } = iconMap[toast.type]

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 bg-card border border-border rounded-xl shadow-lg transition-all duration-200",
        isExiting ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0 animate-in slide-in-from-right-5"
      )}
    >
      <div className={cn("p-1.5 rounded-lg", bg)}>
        <span className={cn("material-symbols-outlined text-[20px]", color)}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-muted-foreground mt-0.5">{toast.message}</p>
        )}
      </div>
      <button
        onClick={handleClose}
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">close</span>
      </button>
    </div>
  )
}
