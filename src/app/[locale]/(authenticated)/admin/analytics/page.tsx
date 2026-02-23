import { auth } from "@/auth"
import { redirect } from "next/navigation"

import prisma from "@/lib/prisma"
import { getOverviewAnalytics, getProductivityAnalytics } from "@/lib/actions/analytics"
import { getDevelopmentPlan } from "@/lib/actions/development-plan"
import { getStaffPerformanceComparison, getActivityHeatmapData, getStaffRequiringAttention, getActivityTrend } from "@/lib/actions/admin-analytics"
import { getLeaderboard, getLeaderboardStats } from "@/lib/actions/scoring"
import { TrendChart } from "@/components/analytics/trend-chart"
import { PillarChart } from "@/components/analytics/pillar-chart"
import { DevelopmentPlanForm } from "./development-plan-form"
import { AnalyticsTabs } from "@/components/analytics/analytics-tabs"
import { getPeriodsForReports } from "@/lib/actions/reports"
import { StaffScoreboard } from "@/components/scoring/staff-scoreboard"

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ periodId?: string; tab?: string; userId?: string }>
}) {
  const session = await auth()
  
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const { periodId: searchPeriodId, tab, userId } = await searchParams

  const periods = await getPeriodsForReports()
  const activePeriod = periods.find(p => p.status === "ACTIVE") || periods[0]
  const periodId = searchPeriodId || activePeriod?.id
  
  if (!periodId && periods.length === 0) {
    return <div className="p-8">Belum ada periode evaluasi.</div>
  }

  const currentPeriod = periods.find(p => p.id === periodId) || activePeriod

  const activeTab = tab || "overview"
  const selectedUserId = userId

  // Fetch Data based on filters
  const overviewData = await getOverviewAnalytics(periodId)
  
  const startDate = currentPeriod ? new Date(currentPeriod.startDate) : new Date(new Date().getFullYear(), 0, 1)
  const endDate = currentPeriod ? new Date(currentPeriod.endDate) : new Date()

  const productivityData = await getProductivityAnalytics(startDate, endDate)
  
  const staffList = await prisma.user.findMany({
    where: { role: "PASTORAL_STAFF" },
    select: { id: true, name: true, email: true }
  })

  // Development Plan Data
  let developmentPlan = null
  if (selectedUserId) {
    developmentPlan = await getDevelopmentPlan(selectedUserId, periodId!)
  }

  // Staff Performance Data
  let staffPerformance: Array<{ userId: string; userName: string; activityCount: number; totalDuration: number; taskCompleted: number; taskTotal: number; completionRate: number }> = []
  let heatmapData: Array<{ day: string; dayIndex: number; count: number; intensity: number }> = []
  let attentionList: Array<{ userId: string; userName: string; lastActivityDate: Date | null; monthlyCount: number; reason: string }> = []
  
  if (activeTab === "staffPerformance") {
    try {
      const [perf, heatmap, attention] = await Promise.all([
        getStaffPerformanceComparison(),
        getActivityHeatmapData(),
        getStaffRequiringAttention()
      ])
      staffPerformance = perf
      heatmapData = heatmap
      attentionList = attention
    } catch (error) {
      console.error("Error fetching staff performance data:", error)
    }
  }

  // Scoreboard data
  let scoreboardData: any[] = []
  let scoreboardStats = { average: 0, highest: 0, lowest: 0, median: 0, count: 0 }
  
  if (activeTab === "scoreboard") {
    try {
      const [lb, st] = await Promise.all([
        getLeaderboard(),
        getLeaderboardStats()
      ])
      scoreboardData = lb
      scoreboardStats = st
    } catch (error) {
      console.error("Error fetching scoreboard data:", error)
    }
  }

  // Activity trend data for productivity tab
  let activityTrend: Array<{ month: Date; totalActivities: number; totalDuration: number; uniqueUsers: number }> = []
  if (activeTab === "productivity") {
    try {
      activityTrend = await getActivityTrend()
    } catch (error) {
      console.error("Error fetching activity trend:", error)
    }
  }

  // Computed values for Overview
  const totalEvaluations = Object.values(overviewData.scoreDistribution).reduce((a, b) => a + b, 0)
  const totalPillarHours = productivityData.pillarData.reduce((a: number, b: { value: number }) => a + b.value, 0)

  // Pillar colors
  const PILLAR_COLORS: Record<string, { bg: string; text: string; icon: string; hex: string }> = {
    LITURGIA: { bg: "bg-blue-500/10", text: "text-blue-500", icon: "church", hex: "#3B82F6" },
    KERYGMA: { bg: "bg-amber-500/10", text: "text-amber-500", icon: "menu_book", hex: "#F59E0B" },
    KOINONIA: { bg: "bg-green-500/10", text: "text-green-500", icon: "diversity_3", hex: "#10B981" },
    DIAKONIA: { bg: "bg-purple-500/10", text: "text-purple-500", icon: "volunteer_activism", hex: "#8B5CF6" },
    MARTYRIA: { bg: "bg-red-500/10", text: "text-red-500", icon: "campaign", hex: "#EF4444" },
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Analytics & Insights</h1>
        <p className="text-muted-foreground">
          Monitoring kinerja staff dan analisis produktivitas
        </p>
      </div>

      <AnalyticsTabs />

      {/* ━━━━━━━━━━━━━ OVERVIEW TAB ━━━━━━━━━━━━━ */}
      {activeTab === "overview" && (
        <div className="flex flex-col gap-6">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="size-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-blue-500">groups</span>
                </div>
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Staff</span>
              </div>
              <p className="text-3xl font-bold">{staffList.length}</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="size-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-green-500">assignment_turned_in</span>
                </div>
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Evaluasi</span>
              </div>
              <p className="text-3xl font-bold">{totalEvaluations}</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="size-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-amber-500">schedule</span>
                </div>
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Jam Aktivitas</span>
              </div>
              <p className="text-3xl font-bold">{totalPillarHours}<span className="text-sm font-normal text-muted-foreground ml-1">jam</span></p>
            </div>
            <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="size-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-purple-500">event_available</span>
                </div>
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Periode Aktif</span>
              </div>
              <p className="text-lg font-bold truncate">{currentPeriod?.name || "-"}</p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Trend Chart — takes 2 cols */}
            <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary text-xl">trending_up</span>
                <h3 className="font-semibold">Tren Nilai Evaluasi</h3>
              </div>
              {overviewData.trendData.length > 0 ? (
                <TrendChart data={overviewData.trendData} />
              ) : (
                <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
                  <span className="material-symbols-outlined text-4xl mb-2 opacity-40">show_chart</span>
                  <p>Belum ada data evaluasi</p>
                </div>
              )}
            </div>

            {/* Score Distribution — 1 col */}
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary text-xl">bar_chart</span>
                <h3 className="font-semibold">Distribusi Skor</h3>
              </div>
              {totalEvaluations > 0 ? (
                <div className="flex flex-col gap-3 mt-2">
                  {Object.entries(overviewData.scoreDistribution).map(([range, count]) => {
                    const pct = totalEvaluations > 0 ? Math.round((count / totalEvaluations) * 100) : 0
                    const colors: Record<string, string> = {
                      "0-1": "#EF4444", "1-2": "#F97316", "2-3": "#F59E0B", "3-4": "#10B981", "4-5": "#3B82F6"
                    }
                    return (
                      <div key={range} className="flex items-center gap-3">
                        <span className="text-xs font-mono text-muted-foreground w-8">{range}</span>
                        <div className="flex-1 h-6 bg-muted/40 rounded-full overflow-hidden relative">
                          <div 
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${Math.max(pct, 4)}%`, backgroundColor: colors[range] }}
                          />
                          <span className="absolute inset-0 flex items-center pl-3 text-xs font-bold text-white mix-blend-difference">
                            {count} ({pct}%)
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground">
                  <span className="material-symbols-outlined text-3xl mb-2 opacity-40">equalizer</span>
                  <p className="text-sm">Belum ada distribusi skor</p>
                </div>
              )}
            </div>
          </div>

          {/* Pillar Distribution */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary text-xl">donut_small</span>
              <h3 className="font-semibold">Distribusi Pilar Aktivitas</h3>
            </div>
            {productivityData.pillarData.length > 0 ? (
              <PillarChart data={productivityData.pillarData} />
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-40">pie_chart</span>
                <p>Belum ada aktivitas</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━ PRODUCTIVITY TAB ━━━━━━━━━━━━━ */}
      {activeTab === "productivity" && (
        <div className="flex flex-col gap-6">
          {/* Task Stats Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="size-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-blue-500">checklist</span>
                </div>
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Tugas</span>
              </div>
              <p className="text-3xl font-bold">{productivityData.taskStats.total}</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="size-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-green-500">task_alt</span>
                </div>
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Selesai</span>
              </div>
              <p className="text-3xl font-bold text-green-500">{productivityData.taskStats.completed}</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="size-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-amber-500">speed</span>
                </div>
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Completion Rate</span>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold">{productivityData.taskStats.rate}%</p>
                <div className="flex-1 h-2 bg-muted/40 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-amber-500 transition-all duration-700" 
                    style={{ width: `${productivityData.taskStats.rate}%` }} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Activity Trend (6 months) */}
          {activityTrend.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary text-xl">show_chart</span>
                <h3 className="font-semibold">Tren Aktivitas 6 Bulan Terakhir</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {activityTrend.map((month, i) => {
                  const monthName = new Date(month.month).toLocaleString("id-ID", { month: "short", year: "2-digit" })
                  const maxActivities = Math.max(...activityTrend.map(m => m.totalActivities), 1)
                  const barHeight = Math.max(10, (month.totalActivities / maxActivities) * 100)
                  return (
                    <div key={i} className="bg-muted/30 rounded-lg p-4 flex flex-col items-center text-center">
                      <span className="text-xs text-muted-foreground font-medium uppercase mb-2">{monthName}</span>
                      <div className="w-full h-20 flex items-end justify-center mb-2">
                        <div 
                          className="w-8 rounded-t-md bg-primary/80"
                          style={{ height: `${barHeight}%` }}
                        />
                      </div>
                      <span className="text-lg font-bold">{month.totalActivities}</span>
                      <span className="text-[10px] text-muted-foreground">aktivitas</span>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="material-symbols-outlined text-xs text-muted-foreground">group</span>
                        <span className="text-xs text-muted-foreground">{month.uniqueUsers} staff</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Pillar Breakdown */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <span className="material-symbols-outlined text-primary text-xl">view_column</span>
              <h3 className="font-semibold">Breakdown Pilar Aktivitas</h3>
            </div>
            {productivityData.pillarData.length > 0 ? (
              <div className="flex flex-col gap-4">
                {productivityData.pillarData.map((item: { name: string; value: number }) => {
                  const maxVal = Math.max(...productivityData.pillarData.map((p: { value: number }) => p.value), 1)
                  const pct = Math.round((item.value / maxVal) * 100)
                  const style = PILLAR_COLORS[item.name] || { bg: "bg-gray-500/10", text: "text-gray-500", icon: "category", hex: "#6B7280" }
                  return (
                    <div key={item.name} className="flex items-center gap-4">
                      <div className={`size-10 rounded-lg ${style.bg} flex items-center justify-center flex-shrink-0`}>
                        <span className={`material-symbols-outlined ${style.text}`}>{style.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="text-sm font-medium">{item.name}</span>
                          <span className="text-sm font-bold">{item.value} <span className="text-xs font-normal text-muted-foreground">jam</span></span>
                        </div>
                        <div className="h-3 bg-muted/40 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${Math.max(pct, 3)}%`, backgroundColor: style.hex }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <span className="material-symbols-outlined text-4xl mb-2 block opacity-40">inventory_2</span>
                Belum ada data aktivitas untuk periode ini
              </div>
            )}
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━ STAFF PERFORMANCE TAB ━━━━━━━━━━━━━ */}
      {activeTab === "staffPerformance" && (
        <div className="flex flex-col gap-6">
          {/* Attention List */}
          {attentionList.length > 0 && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-red-500">warning</span>
                <h3 className="font-bold text-red-700 dark:text-red-400">Perlu Perhatian</h3>
                <span className="text-xs bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full font-medium">{attentionList.length} staff</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {attentionList.map(item => (
                  <div key={item.userId} className="bg-white dark:bg-card p-4 rounded-lg border border-red-100 dark:border-red-900/30 flex items-center gap-3">
                    <div className="size-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-red-500">{item.userName.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{item.userName}</p>
                      <p className="text-xs text-red-600 dark:text-red-400">{item.reason}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{item.monthlyCount} aktivitas/bulan</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Performance Comparison Table */}
          <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">compare_arrows</span>
                <h3 className="font-semibold">Komparasi Kinerja Staff</h3>
              </div>
              <span className="text-xs bg-muted px-2.5 py-1 rounded-full text-muted-foreground">{staffPerformance.length} staff</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Staff</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase text-center">Aktivitas</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase text-center w-40">Durasi Total</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase text-center w-48">Task Completion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {staffPerformance.length > 0 ? (
                    staffPerformance.map(staff => {
                      const maxActivity = Math.max(...staffPerformance.map(s => s.activityCount), 1)
                      const actPct = Math.round((staff.activityCount / maxActivity) * 100)
                      const maxDuration = Math.max(...staffPerformance.map(s => s.totalDuration), 1)
                      const durPct = Math.round((staff.totalDuration / maxDuration) * 100)
                      return (
                        <tr key={staff.userId} className="hover:bg-accent/30 transition-colors">
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-3">
                              <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                                {staff.userName.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium text-sm">{staff.userName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-sm font-bold">{staff.activityCount}</span>
                              <div className="w-full max-w-[80px] h-1.5 bg-muted/40 rounded-full overflow-hidden">
                                <div className="h-full rounded-full bg-blue-500" style={{ width: `${actPct}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-sm font-bold">{Math.round(staff.totalDuration / 60)}<span className="text-xs font-normal text-muted-foreground ml-0.5">jam</span></span>
                              <div className="w-full max-w-[100px] h-1.5 bg-muted/40 rounded-full overflow-hidden">
                                <div className="h-full rounded-full bg-amber-500" style={{ width: `${durPct}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 justify-center">
                              <div className="flex-1 max-w-[100px] h-2 bg-muted/40 rounded-full overflow-hidden">
                                <div 
                                  className="h-full rounded-full transition-all"
                                  style={{ 
                                    width: `${staff.completionRate}%`,
                                    backgroundColor: staff.completionRate >= 80 ? "#10B981" : staff.completionRate >= 50 ? "#F59E0B" : "#EF4444"
                                  }}
                                />
                              </div>
                              <span className="text-sm font-bold w-10 text-right">{staff.completionRate}%</span>
                              <span className="text-[10px] text-muted-foreground">({staff.taskCompleted}/{staff.taskTotal})</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                        <span className="material-symbols-outlined text-4xl mb-2 block opacity-40">person_off</span>
                        Belum ada data kinerja staff
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Weekly Activity Pattern */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-primary text-xl">calendar_view_week</span>
              <h3 className="font-semibold">Pola Aktivitas Institusi (Mingguan)</h3>
              <span className="text-xs text-muted-foreground ml-auto">3 bulan terakhir</span>
            </div>
            {heatmapData.length > 0 ? (
              <div className="flex flex-col gap-4">
                {/* Bar chart */}
                <div className="flex items-end gap-3 justify-center h-48 px-4">
                  {heatmapData.map((data) => {
                    const barHeight = Math.max(8, data.intensity)
                    const isWeekend = data.dayIndex === 0 || data.dayIndex === 6
                    const barColor = data.intensity >= 70 ? "#10B981" 
                      : data.intensity >= 40 ? "#3B82F6" 
                      : data.intensity >= 15 ? "#F59E0B" 
                      : "#94A3B8"
                    return (
                      <div key={data.day} className="flex-1 flex flex-col items-center gap-2 max-w-[80px]">
                        <span className="text-sm font-bold" style={{ color: barColor }}>{data.count}</span>
                        <div className="w-full flex justify-center">
                          <div 
                            className="w-12 rounded-t-lg transition-all duration-700 relative group"
                            style={{ 
                              height: `${barHeight}%`,
                              minHeight: "12px",
                              backgroundColor: barColor,
                              opacity: isWeekend ? 0.6 : 1,
                              boxShadow: `0 0 12px ${barColor}30`
                            }}
                          >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                              {data.count} aktivitas ({data.intensity}%)
                            </div>
                          </div>
                        </div>
                        <div className="text-center">
                          <span className={`text-sm font-semibold ${isWeekend ? "text-muted-foreground" : "text-foreground"}`}>
                            {data.day}
                          </span>
                          <span className="block text-[10px] text-muted-foreground">{data.intensity}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {/* Legend */}
                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#10B981" }} />
                    <span>Tinggi (≥70%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#3B82F6" }} />
                    <span>Sedang (40-69%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#F59E0B" }} />
                    <span>Rendah (15-39%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#94A3B8" }} />
                    <span>Sangat Rendah (&lt;15%)</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-muted-foreground">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-40">calendar_today</span>
                <p>Belum ada data aktivitas</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SCOREBOARD TAB */}
      {activeTab === "scoreboard" && (
        <StaffScoreboard leaderboard={scoreboardData} stats={scoreboardStats} />
      )}

      {/* ━━━━━━━━━━━━━ DEVELOPMENT PLAN TAB ━━━━━━━━━━━━━ */}
      {activeTab === "developmentPlan" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl border border-border p-5 sticky top-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Pilih Staff</h3>
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{staffList.length}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {staffList.map(staff => (
                  <a 
                    key={staff.id} 
                    href={`?tab=developmentPlan&userId=${staff.id}`}
                    className={`p-3 rounded-lg text-sm flex items-center gap-3 transition-colors ${selectedUserId === staff.id ? "bg-primary text-white shadow-md" : "hover:bg-accent text-foreground"}`}
                  >
                    <div className={`size-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      selectedUserId === staff.id ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                    }`}>
                      {(staff.name || staff.email).charAt(0).toUpperCase()}
                    </div>
                    <span className="truncate">{staff.name || staff.email}</span>
                    {selectedUserId === staff.id && <span className="material-symbols-outlined text-[16px] ml-auto">check</span>}
                  </a>
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-2">
            {selectedUserId ? (
              <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                <h3 className="font-semibold text-lg mb-6">Development Plan</h3>
                <DevelopmentPlanForm 
                  userId={selectedUserId}
                  periodId={periodId!}
                  initialData={developmentPlan as any}
                  currentUserEmail={session.user.email || ""}
                  currentUserRole={session.user.role}
                />
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-12 bg-card rounded-xl border border-border border-dashed text-muted-foreground text-center shadow-sm">
                <span className="material-symbols-outlined text-5xl mb-3 opacity-30">person_search</span>
                <p className="font-medium">Pilih staff</p>
                <p className="text-sm mt-1">Pilih staff di sebelah kiri untuk melihat atau membuat Development Plan.</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
