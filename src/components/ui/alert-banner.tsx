"use client"

import Link from "next/link"

interface AlertBannerProps {
  alerts: Array<{
    id: string
    type: "warning" | "info" | "success" | "danger"
    icon: string
    title: string
    message: string
    link?: string
    linkText?: string
  }>
}

const typeStyles = {
  warning: {
    bg: "bg-amber-50 dark:bg-amber-900/20",
    border: "border-amber-200 dark:border-amber-800",
    icon: "text-amber-600 dark:text-amber-400",
    title: "text-amber-900 dark:text-amber-100",
    text: "text-amber-700 dark:text-amber-300",
    link: "bg-amber-100 dark:bg-amber-800 text-amber-800 dark:text-amber-100 hover:bg-amber-200 dark:hover:bg-amber-700"
  },
  info: {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-800",
    icon: "text-blue-600 dark:text-blue-400",
    title: "text-blue-900 dark:text-blue-100",
    text: "text-blue-700 dark:text-blue-300",
    link: "bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 hover:bg-blue-200 dark:hover:bg-blue-700"
  },
  success: {
    bg: "bg-green-50 dark:bg-green-900/20",
    border: "border-green-200 dark:border-green-800",
    icon: "text-green-600 dark:text-green-400",
    title: "text-green-900 dark:text-green-100",
    text: "text-green-700 dark:text-green-300",
    link: "bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100 hover:bg-green-200 dark:hover:bg-green-700"
  },
  danger: {
    bg: "bg-red-50 dark:bg-red-900/20",
    border: "border-red-200 dark:border-red-800",
    icon: "text-red-600 dark:text-red-400",
    title: "text-red-900 dark:text-red-100",
    text: "text-red-700 dark:text-red-300",
    link: "bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100 hover:bg-red-200 dark:hover:bg-red-700"
  }
}

export function AlertBanner({ alerts }: AlertBannerProps) {
  if (alerts.length === 0) return null

  return (
    <div className="flex flex-col gap-3 mb-6">
      {alerts.map((alert) => {
        const styles = typeStyles[alert.type]
        
        return (
          <div
            key={alert.id}
            className={`${styles.bg} ${styles.border} border rounded-xl p-4 flex items-start gap-4`}
          >
            <div className={`${styles.icon} p-2 rounded-lg bg-white/50 dark:bg-white/10`}>
              <span className="material-symbols-outlined">{alert.icon}</span>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className={`${styles.title} font-semibold text-sm`}>
                {alert.title}
              </h3>
              <p className={`${styles.text} text-sm mt-0.5`}>
                {alert.message}
              </p>
            </div>
            
            {alert.link && alert.linkText && (
              <Link
                href={alert.link}
                className={`${styles.link} px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex-shrink-0`}
              >
                {alert.linkText}
              </Link>
            )}
          </div>
        )
      })}
    </div>
  )
}
