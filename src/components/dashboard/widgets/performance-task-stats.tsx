"use client"

import { useTranslations } from "next-intl"

interface TaskStats {
  todo: number
  inProgress: number
  completed: number
  total: number
  completionRate: number
}

interface PerformanceTaskStatsProps {
  taskStats: TaskStats
}

export function PerformanceTaskStats({ taskStats }: PerformanceTaskStatsProps) {
  const t = useTranslations("Performance")

  return (
    <div className="bg-card rounded-xl border border-border p-5 h-full flex flex-col justify-between">
      <div>
        <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">task_alt</span>
          {t("tasks.title")}
        </h2>
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <p className="text-2xl font-bold text-foreground">{taskStats.total}</p>
            <p className="text-[10px] text-muted-foreground uppercase">{t("tasks.total")}</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-yellow-500/10">
            <p className="text-2xl font-bold text-yellow-500">{taskStats.todo}</p>
            <p className="text-[10px] text-muted-foreground uppercase">{t("tasks.todo")}</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-blue-500/10">
            <p className="text-2xl font-bold text-blue-500">{taskStats.inProgress}</p>
            <p className="text-[10px] text-muted-foreground uppercase">{t("tasks.in_progress")}</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-green-500/10">
            <p className="text-2xl font-bold text-green-500">{taskStats.completed}</p>
            <p className="text-[10px] text-muted-foreground uppercase">{t("tasks.completed")}</p>
          </div>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="mt-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-muted-foreground">{t("tasks.progress")}</span>
          <span className="font-medium">{taskStats.completionRate}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all"
            style={{ width: `${taskStats.completionRate}%` }}
          />
        </div>
      </div>
    </div>
  )
}
