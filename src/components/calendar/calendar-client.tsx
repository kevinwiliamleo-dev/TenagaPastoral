"use client"

import { CalendarEvent } from "./types"
import { CalendarView } from "./calendar-view"
import { useTranslations } from "next-intl"

interface CalendarClientProps {
  initialEvents: CalendarEvent[]
}

export function CalendarClient({ initialEvents }: CalendarClientProps) {
  const t = useTranslations("Calendar")
  
  // In future we might add filters here (e.g. filter by type)
  // For now it just passes data to view
  
  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        <div>
           {/* Filters could go here */}
        </div>
      </div>

      <div className="flex-1 min-h-0"> 
        <CalendarView events={initialEvents} />
      </div>
    </div>
  )
}
