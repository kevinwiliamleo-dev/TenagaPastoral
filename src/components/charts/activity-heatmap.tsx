"use client"

import { useMemo } from "react"

interface ActivityDay {
  date: string
  count: number
  level: number // 0-4
}

interface ActivityHeatmapProps {
  data: ActivityDay[]
  className?: string
}

export function ActivityHeatmap({ data, className }: ActivityHeatmapProps) {
  // Generate last 365 days dates
  const calendarData = useMemo(() => {
    const today = new Date()
    const startDate = new Date()
    startDate.setFullYear(today.getFullYear() - 1)
    
    // Adjust start date to previous Sunday to aligh grid
    const dayOfWeek = startDate.getDay()
    startDate.setDate(startDate.getDate() - dayOfWeek)

    const days: { date: Date, dateStr: string, value: ActivityDay | undefined }[] = []
    
    // Create map for O(1) lookup
    const dataMap = new Map(data.map(d => [d.date, d]))
    
    // Generate ~53 weeks of days
    const current = new Date(startDate)
    const end = new Date(today)
    
    while (current <= end || days.length % 7 !== 0) {
      const dateStr = current.toISOString().split('T')[0]
      days.push({
        date: new Date(current),
        dateStr,
        value: dataMap.get(dateStr)
      })
      current.setDate(current.getDate() + 1)
    }
    
    return days
  }, [data])

  // Group by weeks for columns
  const weeks = useMemo(() => {
    const w = []
    for (let i = 0; i < calendarData.length; i += 7) {
      w.push(calendarData.slice(i, i + 7))
    }
    return w
  }, [calendarData])

  // Month labels
  const monthLabels = useMemo(() => {
    const labels: { month: string, index: number }[] = []
    let lastMonth = -1
    
    weeks.forEach((week, index) => {
      const firstDay = week[0].date
      const month = firstDay.getMonth()
      
      if (month !== lastMonth) {
        labels.push({ 
          month: firstDay.toLocaleString('default', { month: 'short' }), 
          index 
        })
        lastMonth = month
      }
    })
    
    return labels
  }, [weeks])

  // Color map for levels
  const getLevelColor = (level?: number) => {
    switch (level) {
      case 1: return "bg-green-200 dark:bg-green-900/40"
      case 2: return "bg-green-400 dark:bg-green-700/60"
      case 3: return "bg-green-600 dark:bg-green-600/80"
      case 4: return "bg-green-800 dark:bg-green-500"
      default: return "bg-muted/50 dark:bg-muted/20"
    }
  }

  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <div className="min-w-[700px] flex flex-col gap-2">
        {/* Month Labels */}
        <div className="flex text-xs text-muted-foreground ml-8 relative h-4">
          {monthLabels.map((label, i) => (
             // Simple positioning approximation
             <span key={i} style={{ left: `${label.index * 14}px`, position: 'absolute' }}>
               {label.month}
             </span>
          ))}
        </div>

        <div className="flex gap-2">
          {/* Day Labels (Mon/Wed/Fri) */}
          <div className="flex flex-col gap-[3px] text-[10px] text-muted-foreground pt-3 w-6">
            <span className="h-[10px]"></span>
            <span className="h-[10px]">Sen</span>
            <span className="h-[10px]"></span>
            <span className="h-[10px]">Rab</span>
            <span className="h-[10px]"></span>
            <span className="h-[10px]">Jum</span>
            <span className="h-[10px]"></span>
          </div>

          {/* Grid */}
          <div className="flex gap-[3px]">
            {weeks.map((week, wIndex) => (
              <div key={wIndex} className="flex flex-col gap-[3px]">
                {week.map((day, dIndex) => (
                  <div
                    key={`${wIndex}-${dIndex}`}
                    className={`w-[10px] h-[10px] rounded-[2px] transition-colors hover:ring-1 hover:ring-ring cursor-default tooltip-trigger ${getLevelColor(day.value?.level)}`}
                    title={`${day.value?.count || 0} aktivitas pada ${day.date.toLocaleDateString()}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground ml-8 mt-2">
          <span>Less</span>
          <div className="flex gap-[3px]">
             <div className="w-[10px] h-[10px] rounded-[2px] bg-muted/50 dark:bg-muted/20"></div>
             <div className="w-[10px] h-[10px] rounded-[2px] bg-green-200 dark:bg-green-900/40"></div>
             <div className="w-[10px] h-[10px] rounded-[2px] bg-green-400 dark:bg-green-700/60"></div>
             <div className="w-[10px] h-[10px] rounded-[2px] bg-green-600 dark:bg-green-600/80"></div>
             <div className="w-[10px] h-[10px] rounded-[2px] bg-green-800 dark:bg-green-500"></div>
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  )
}
