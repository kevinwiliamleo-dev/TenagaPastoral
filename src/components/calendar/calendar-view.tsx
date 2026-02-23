"use client"

import { useState } from "react"
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday
} from "date-fns"
import { useTranslations, useFormatter } from "next-intl"
import { CalendarEvent, CALENDAR_COLORS } from "./types"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import Link from "next/link"

interface CalendarViewProps {
  events: CalendarEvent[]
}

export function CalendarView({ events }: CalendarViewProps) {
  const t = useTranslations("Calendar")
  const format = useFormatter()
  const [currentDate, setCurrentDate] = useState(new Date())

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const goToToday = () => setCurrentDate(new Date())

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }) // Monday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate })

  const getEventsForDay = (date: Date) => {
    return events.filter(event => 
      isSameDay(new Date(event.start), date) || 
      (new Date(event.start) <= date && new Date(event.end) >= date)
    )
  }

  const daysOfWeek = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-foreground capitalize">
            {format.dateTime(currentDate, { month: "long", year: "numeric" })}
          </h2>
          <div className="flex items-center bg-accent rounded-lg p-0.5">
            <button onClick={prevMonth} className="p-1 hover:bg-background rounded-md transition-colors">
              <span className="material-symbols-outlined text-lg">chevron_left</span>
            </button>
            <button onClick={goToToday} className="px-3 py-1 text-xs font-medium hover:bg-background rounded-md transition-colors">
              {t("controls.today")}
            </button>
            <button onClick={nextMonth} className="p-1 hover:bg-background rounded-md transition-colors">
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </div>
        </div>
        
        {/* Legend */}
        <div className="hidden md:flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className={`size-2.5 rounded-full ${CALENDAR_COLORS.PERIOD.dot}`}></span>
            <span className="text-muted-foreground">{t("legend.period")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`size-2.5 rounded-full ${CALENDAR_COLORS.TASK.dot}`}></span>
            <span className="text-muted-foreground">{t("legend.task")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`size-2.5 rounded-full ${CALENDAR_COLORS.GOAL.dot}`}></span>
            <span className="text-muted-foreground">{t("legend.goal")}</span>
          </div>
        </div>
      </div>

      {/* Days Header */}
      <div className="grid grid-cols-7 border-b border-border bg-accent/30">
        {daysOfWeek.map(day => (
          <div key={day} className="py-2 text-center text-xs font-semibold text-muted-foreground">
            {t(`days.${day}`)}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 flex-1 auto-rows-fr min-h-[500px]">
        {calendarDays.map((day, idx) => {
          const dayEvents = getEventsForDay(day)
          const isCurrentMonth = isSameMonth(day, monthStart)
          const isDayToday = isToday(day)

          return (
            <div 
              key={day.toString()} 
              className={`
                min-h-[100px] border-b border-r border-border p-2 flex flex-col gap-1 transition-colors hover:bg-accent/10
                ${!isCurrentMonth ? "bg-accent/5" : ""}
                ${(idx + 1) % 7 === 0 ? "border-r-0" : ""} 
              `}
            >
              <div className="flex justify-between items-start mb-1">
                 <span className={`
                    text-xs font-medium size-7 flex items-center justify-center rounded-full
                    ${isDayToday 
                      ? "bg-primary text-primary-foreground" 
                      : isCurrentMonth ? "text-foreground" : "text-muted-foreground opacity-50"}
                 `}>
                   {format.dateTime(day, { day: "numeric" })}
                 </span>
                 {dayEvents.length > 2 && (
                   <span className="text-[10px] bg-accent px-1.5 rounded-full text-muted-foreground">
                     +{dayEvents.length - 2}
                   </span>
                 )}
              </div>

              <div className="flex flex-col gap-1">
                {dayEvents.slice(0, 3).map(event => { // Show max 3 events per cell to avoid overflow
                   const colorSet = CALENDAR_COLORS[event.type as keyof typeof CALENDAR_COLORS] || CALENDAR_COLORS.ACTIVITY
                   
                   return (
                     <Popover key={event.id}>
                       <PopoverTrigger asChild>
                         <button 
                           className={`
                             w-full text-left text-[10px] px-1.5 py-0.5 rounded border truncate font-medium block transition-transform hover:scale-105 active:scale-95
                             ${colorSet.bg} ${colorSet.text} ${colorSet.border}
                           `}
                         >
                           {event.title}
                         </button>
                       </PopoverTrigger>
                       <PopoverContent className="w-64 p-3" align="start">
                         <div className="space-y-2">
                           <div className={`text-xs font-bold px-2 py-0.5 rounded-full w-fit ${colorSet.bg} ${colorSet.text}`}>
                             {event.type}
                           </div>
                           <h4 className="font-semibold text-sm leading-tight">{event.title}</h4>
                           {event.description && (
                             <p className="text-xs text-muted-foreground">{event.description}</p>
                           )}
                           
                           <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border mt-2">
                             <div>
                               <span className="text-muted-foreground block">{t("event_details.status")}</span>
                               <span className="font-medium capitalize">{event.status?.toLowerCase().replace(/_/g, " ") || "-"}</span>
                             </div>
                             {(event.type === 'TASK' || event.type === 'GOAL') && (
                               <div className="text-right">
                                  <Link href={event.url || "#"} className="text-primary hover:underline">
                                    {t("event_details.view_detail")} &rarr;
                                  </Link>
                               </div>
                             )}
                           </div>
                         </div>
                       </PopoverContent>
                     </Popover>
                   )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
