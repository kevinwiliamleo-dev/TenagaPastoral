export type CalendarEventType = "PERIOD" | "TASK" | "GOAL" | "ACTIVITY"

export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  type: CalendarEventType
  color: string
  description?: string
  status?: string // e.g. "COMPLETED", "ACTIVE"
  url?: string // Link to detail page
  metadata?: any // Extra data if needed
}

export const CALENDAR_COLORS = {
  PERIOD: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800",
    dot: "bg-purple-500"
  },
  TASK: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
    dot: "bg-blue-500"
  },
  GOAL: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-300",
    border: "border-green-200 dark:border-green-800",
    dot: "bg-green-500"
  },
  ACTIVITY: {
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-700 dark:text-gray-300",
    border: "border-gray-200 dark:border-gray-700",
    dot: "bg-gray-500"
  }
}
