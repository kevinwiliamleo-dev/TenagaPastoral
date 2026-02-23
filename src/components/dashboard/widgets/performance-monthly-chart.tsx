"use client"

import { useTranslations, useFormatter } from "next-intl"

interface MonthlyStats {
  month: Date
  count: number
  totalDuration: number
}

interface PerformanceMonthlyChartProps {
  monthlyStats: MonthlyStats[]
}

export function PerformanceMonthlyChart({ monthlyStats }: PerformanceMonthlyChartProps) {
  const t = useTranslations("Performance")
  const format = useFormatter()

  // Calculate max for chart scaling
  const maxMonthlyCount = Math.max(...monthlyStats.map(m => m.count), 1)

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}j ${mins}m`
  }

  return (
    <div className="bg-card rounded-xl border border-border p-5 h-full flex flex-col">
      <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">bar_chart</span>
        {t("charts.monthly_activity")}
      </h2>
      {monthlyStats.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground flex-1 flex flex-col items-center justify-center">
          <span className="material-symbols-outlined text-4xl mb-2">calendar_month</span>
          <p>{t("charts.no_data")}</p>
        </div>
      ) : (
        <div className="flex items-end gap-2 h-40 mt-auto">
          {monthlyStats.map((stat, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
              <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity absolute -top-5">{stat.count}</span>
              <div 
                className="w-full bg-primary rounded-t-lg transition-all hover:bg-primary/80"
                style={{ height: `${Math.max(10, (stat.count / maxMonthlyCount) * 120)}px` }}
                title={`${stat.count} aktivitas, ${formatDuration(stat.totalDuration)}`}
              />
              <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                {format.dateTime(new Date(stat.month), { month: "short" })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
