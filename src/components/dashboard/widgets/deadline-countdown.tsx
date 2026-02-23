"use client"

import { useEffect, useState } from "react"
import { differenceInDays, differenceInHours, differenceInMinutes } from "date-fns"
import { id } from "date-fns/locale"

interface EvaluationPeriod {
  id: string
  name: string
  startDate: Date
  endDate: Date
  status: string
}

interface DeadlineCountdownProps {
  activePeriod: EvaluationPeriod | null
  pendingTasksCount: number
}

export function DeadlineCountdown({ activePeriod, pendingTasksCount }: DeadlineCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number } | null>(null)

  useEffect(() => {
    if (!activePeriod) return

    const calculateTimeLeft = () => {
      const now = new Date()
      const end = new Date(activePeriod.endDate)
      
      if (now > end) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0 })
        return
      }

      const days = differenceInDays(end, now)
      const hours = differenceInHours(end, now) % 24
      const minutes = differenceInMinutes(end, now) % 60

      setTimeLeft({ days, hours, minutes })
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [activePeriod])

  if (!activePeriod) {
    return (
      <div className="bg-card rounded-xl border border-border p-6 shadow-sm h-full flex flex-col justify-center items-center text-center">
        <div className="bg-muted p-4 rounded-full mb-4">
          <span className="material-symbols-outlined text-3xl text-muted-foreground">event_busy</span>
        </div>
        <h3 className="font-bold text-foreground mb-1">Tidak Ada Deadline</h3>
        <p className="text-sm text-muted-foreground">Belum ada periode evaluasi aktif saat ini.</p>
      </div>
    )
  }

  const isUrgent = timeLeft && timeLeft.days < 7

  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-sm h-full flex flex-col relative overflow-hidden">
      {/* Background decoration */}
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 opacity-10 ${isUrgent ? 'bg-red-500' : 'bg-primary'}`}></div>

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className={`material-symbols-outlined ${isUrgent ? 'text-red-500 animate-pulse' : 'text-primary'}`}>
                {isUrgent ? 'timer_off' : 'timer'}
              </span>
              Hitung Mundur
            </h2>
            <p className="text-sm text-muted-foreground">{activePeriod.name}</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center my-2">
          {timeLeft ? (
            <div className="grid grid-cols-3 gap-4 text-center w-full max-w-sm">
              <div className="flex flex-col">
                <span className={`text-4xl font-bold ${isUrgent ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}>
                  {timeLeft.days}
                </span>
                <span className="text-xs uppercase font-semibold text-muted-foreground">Hari</span>
              </div>
              <div className="flex flex-col">
                <span className={`text-4xl font-bold ${isUrgent ? 'text-red-500 dark:text-red-400' : 'text-foreground'}`}>
                  {timeLeft.hours}
                </span>
                <span className="text-xs uppercase font-semibold text-muted-foreground">Jam</span>
              </div>
              <div className="flex flex-col">
                <span className={`text-4xl font-bold ${isUrgent ? 'text-red-400 dark:text-red-300' : 'text-foreground'}`}>
                  {timeLeft.minutes}
                </span>
                <span className="text-xs uppercase font-semibold text-muted-foreground">Menit</span>
              </div>
            </div>
          ) : (
             <div className="animate-pulse flex gap-4">
               <div className="h-12 w-12 bg-muted rounded"></div>
               <div className="h-12 w-12 bg-muted rounded"></div>
               <div className="h-12 w-12 bg-muted rounded"></div>
             </div>
          )}
        </div>

        <div className="mt-auto pt-4 border-t border-border">
          <div className="flex justify-between items-center text-sm">
             <span className="text-muted-foreground">Deadline:</span>
             <span className="font-medium text-foreground">
               {new Date(activePeriod.endDate).toLocaleDateString("id-ID", { 
                 day: 'numeric', month: 'long', year: 'numeric' 
               })}
             </span>
          </div>
          {pendingTasksCount > 0 && (
            <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg">
              <span className="material-symbols-outlined text-[16px]">warning</span>
              {pendingTasksCount} tugas perlu diselesaikan segera!
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
