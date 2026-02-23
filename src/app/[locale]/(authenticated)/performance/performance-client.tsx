"use client"

import { useTranslations, useFormatter } from "next-intl"
import { PILLAR_INFO, type PastoralPillar } from "@/lib/constants"

interface MonthlyStats {
  month: Date
  count: number
  totalDuration: number
}

interface PillarStats {
  pillar: string
  count: number
  totalDuration: number
}

interface TaskStats {
  todo: number
  inProgress: number
  completed: number
  total: number
  completionRate: number
}

interface ScoreBreakdown {
  activityScore: number
  pillarBalanceScore: number
  taskScore: number
  consistencyScore: number
  totalScore: number
  rank?: string
}

interface PerformanceClientProps {
  monthlyStats: MonthlyStats[]
  pillarBalance: PillarStats[]
  taskStats: TaskStats
  streak: { currentStreak: number; longestStreak: number }
  summary: { totalActivities: number; totalDuration: number; thisMonthActivities: number; avgDuration: number }
  score: ScoreBreakdown
  userName: string
}

export function PerformanceClient({ 
  monthlyStats, 
  pillarBalance, 
  taskStats, 
  streak, 
  summary,
  score,
  userName 
}: PerformanceClientProps) {
  const t = useTranslations("Performance")
  const format = useFormatter()

  // Calculate max for chart scaling
  const maxMonthlyCount = Math.max(...monthlyStats.map(m => m.count), 1)
  const maxPillarCount = Math.max(...pillarBalance.map(p => p.count), 1)

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours === 0) return `${mins} ${t("summary.minutes")}`
    if (mins === 0) return `${hours} ${t("summary.hours")}`
    return `${hours}j ${mins}m` // Keep compact format for chart tooltip or mix
  }

  // Simplified duration for display
  const getDurationDisplay = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours === 0) return `${mins} ${t("summary.minutes")}`
    return `${hours} ${t("summary.hours")} ${mins > 0 ? `${mins} ${t("summary.minutes")}` : ""}`
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle", { name: userName })}</p>
        </div>
        {/* Score Card */}
        <a href="/leaderboard" className="block">
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl border border-primary/30 p-5 hover:border-primary/50 transition-colors">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="size-14 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-2xl">{score.rank?.split(' ')[0] || '📊'}</span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("score_card.title")}</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-bold text-foreground">{score.totalScore}</p>
                    <p className="text-lg text-primary">{score.rank?.split(' ').slice(1).join(' ') || ''}</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="grid grid-cols-4 gap-3 text-xs">
                  <div className="px-3 py-1 rounded bg-blue-500/10">
                    <p className="font-bold text-blue-400">{score.activityScore}</p>
                    <p className="text-muted-foreground">{t("score_card.activity")}</p>
                  </div>
                  <div className="px-3 py-1 rounded bg-green-500/10">
                    <p className="font-bold text-green-400">{score.pillarBalanceScore}</p>
                    <p className="text-muted-foreground">{t("score_card.pillar")}</p>
                  </div>
                  <div className="px-3 py-1 rounded bg-amber-500/10">
                    <p className="font-bold text-amber-400">{score.taskScore}</p>
                    <p className="text-muted-foreground">{t("score_card.task")}</p>
                  </div>
                  <div className="px-3 py-1 rounded bg-purple-500/10">
                    <p className="font-bold text-purple-400">{score.consistencyScore}</p>
                    <p className="text-muted-foreground">{t("score_card.consistency")}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{t("score_card.view_rank")}</p>
              </div>
            </div>
          </div>
        </a>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-blue-500">activity_zone</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{summary.totalActivities}</p>
                <p className="text-xs text-muted-foreground">{t("summary.total_activities")}</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-green-500">schedule</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{formatDuration(summary.totalDuration)}</p>
                <p className="text-xs text-muted-foreground">{t("summary.total_duration")}</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-amber-500">local_fire_department</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{streak.currentStreak} {t("summary.days")}</p>
                <p className="text-xs text-muted-foreground">{t("summary.active_streak")}</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-purple-500">check_circle</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{taskStats.completionRate}%</p>
                <p className="text-xs text-muted-foreground">{t("summary.tasks_completed")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Monthly Activity Chart */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">bar_chart</span>
              {t("charts.monthly_activity")}
            </h2>
            {monthlyStats.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <span className="material-symbols-outlined text-4xl mb-2">calendar_month</span>
                <p>{t("charts.no_data")}</p>
              </div>
            ) : (
              <div className="flex items-end gap-2 h-40">
                {monthlyStats.map((stat, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-muted-foreground">{stat.count}</span>
                    <div 
                      className="w-full bg-primary rounded-t-lg transition-all hover:bg-primary/80"
                      style={{ height: `${Math.max(10, (stat.count / maxMonthlyCount) * 120)}px` }}
                      title={`${stat.count} aktivitas, ${formatDuration(stat.totalDuration)}`}
                    />
                    <span className="text-xs text-muted-foreground">{format.dateTime(new Date(stat.month), { month: "short" })}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pillar Balance Radar */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">donut_small</span>
              {t("charts.pillar_balance")}
            </h2>
            <div className="space-y-3">
              {pillarBalance.map((stat) => {
                const info = PILLAR_INFO[stat.pillar as PastoralPillar]
                const percentage = maxPillarCount > 0 ? (stat.count / maxPillarCount) * 100 : 0
                return (
                  <div key={stat.pillar} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className={`size-3 rounded-full ${info?.color || "bg-gray-500"}`} />
                        {info?.name || stat.pillar}
                      </span>
                      <span className="text-muted-foreground">
                        {t("charts.activities_count", { count: stat.count })}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${info?.color || "bg-gray-500"} transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Task Stats */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">task_alt</span>
            {t("tasks.title")}
          </h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <p className="text-3xl font-bold text-foreground">{taskStats.total}</p>
              <p className="text-sm text-muted-foreground">{t("tasks.total")}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-yellow-500/10">
              <p className="text-3xl font-bold text-yellow-500">{taskStats.todo}</p>
              <p className="text-sm text-muted-foreground">{t("tasks.todo")}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-blue-500/10">
              <p className="text-3xl font-bold text-blue-500">{taskStats.inProgress}</p>
              <p className="text-sm text-muted-foreground">{t("tasks.in_progress")}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-green-500/10">
              <p className="text-3xl font-bold text-green-500">{taskStats.completed}</p>
              <p className="text-sm text-muted-foreground">{t("tasks.completed")}</p>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">{t("tasks.progress")}</span>
              <span className="font-medium">{taskStats.completionRate}%</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all"
                style={{ width: `${taskStats.completionRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-primary">trending_up</span>
              <span className="font-medium text-foreground">{t("metrics.this_month")}</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{summary.thisMonthActivities}</p>
            <p className="text-sm text-muted-foreground">{t("metrics.recorded_activities")}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-primary">timer</span>
              <span className="font-medium text-foreground">{t("metrics.avg_duration")}</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{formatDuration(summary.avgDuration)}</p>
            <p className="text-sm text-muted-foreground">{t("metrics.per_activity")}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-primary">emoji_events</span>
              <span className="font-medium text-foreground">{t("metrics.longest_streak")}</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{streak.longestStreak} {t("summary.days")}</p>
            <p className="text-sm text-muted-foreground">{t("metrics.last_30_days")}</p>
          </div>
        </div>
      </div>

    </>
  )
}


