import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Link } from "@/i18n/navigation" // Fix i18n link
import prisma from "@/lib/prisma"
import { getDashboardChartData } from "@/lib/actions/reports"
import { getDashboardAlerts } from "@/lib/actions/dashboard-alerts"
import { getDashboardStats } from "@/lib/actions/dashboard-stats"
import { getRecentActivities } from "@/lib/actions/dashboard-activity"
import { getActivityHeatmap } from "@/lib/actions/analytics"
import { getDashboardLayout } from "@/lib/actions/dashboard-layout"
import { 
  getMonthlyActivityStats, 
  getPillarBalanceStats, 
  getTaskCompletionStats 
} from "@/lib/actions/performance"
import { getMyScore } from "@/lib/actions/scoring"
import { BarChart, RadarChart } from "@/components/ui/charts"
import { ActivityHeatmap } from "@/components/charts/activity-heatmap"
import { AlertBanner } from "@/components/ui/alert-banner"
import { DashboardGrid } from "@/components/dashboard/dashboard-grid"
import { DashboardWidgetId } from "@/components/dashboard/dashboard-layout-types"
import { DeadlineCountdown } from "@/components/dashboard/widgets/deadline-countdown"
import { DashboardChartsWidget } from "@/components/dashboard/widgets/dashboard-charts"
import { CompositeScoreCard } from "@/components/scoring/composite-score-card"
import { PerformanceMonthlyChart } from "@/components/dashboard/widgets/performance-monthly-chart"
import { PerformancePillarChart } from "@/components/dashboard/widgets/performance-pillar-chart"
import { PerformanceTaskStats } from "@/components/dashboard/widgets/performance-task-stats"
import { getTranslations } from "next-intl/server"

export default async function DashboardPage() {
  const session = await auth()
  const t = await getTranslations('Dashboard')
  
  if (!session) {
    redirect("/login")
  }

  const isAdmin = session.user?.role === "ADMIN"
  
  // Fetch active period
  const activePeriod = await prisma.evaluationPeriod.findFirst({
    where: { status: "ACTIVE" },
    orderBy: { startDate: "desc" },
  })

  // Fetch all data in parallel
  const [
    alerts, 
    dashboardStats, 
    recentActivities, 
    heatmapData,
    chartData,
    layout,
    monthlyStats,
    pillarBalance,
    taskStats,
    score
  ] = await Promise.all([
    getDashboardAlerts(),
    getDashboardStats(),
    getRecentActivities(),
    session.user?.id ? getActivityHeatmap(session.user.id) : Promise.resolve([]),
    (isAdmin && activePeriod) ? getDashboardChartData(activePeriod.id) : Promise.resolve({ barData: [], radarData: [] }),
    getDashboardLayout(),
    !isAdmin ? getMonthlyActivityStats() : Promise.resolve([]),
    !isAdmin ? getPillarBalanceStats() : Promise.resolve([]),
    !isAdmin ? getTaskCompletionStats() : Promise.resolve({ todo: 0, inProgress: 0, completed: 0, total: 0, completionRate: 0 }),
    !isAdmin ? getMyScore() : Promise.resolve({ activityScore: 0, pillarBalanceScore: 0, taskScore: 0, consistencyScore: 0, totalScore: 0 })
  ])

  // Define Widgets
  const widgets: Record<DashboardWidgetId, React.ReactNode> = {
    stats: (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 h-full">
        {/* Card 1: Total Staf */}
        <div className="flex flex-col p-5 bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow h-full">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-primary">
              <span className="material-symbols-outlined">groups</span>
            </div>
          </div>
          <p className="text-muted-foreground text-sm font-medium mb-1">{t('stats.total_staff')}</p>
          <p className="text-3xl font-bold text-foreground">{dashboardStats.totalStaff}</p>
        </div>

        {/* Card 2: Periode Saat Ini */}
        <div className="flex flex-col p-5 bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow h-full">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400">
              <span className="material-symbols-outlined">event_available</span>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${activePeriod ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' : 'bg-gray-100 text-gray-700'}`}>
              {activePeriod ? 'Active' : 'No Active'}
            </span>
          </div>
          <p className="text-muted-foreground text-sm font-medium mb-1">{t('stats.active_period')}</p>
          <p className="text-2xl font-bold text-foreground truncate" title={activePeriod?.name || t('stats.no_active_period')}>
            {activePeriod?.name || "-"}
          </p>
        </div>

        {/* Card 3: Evaluasi Selesai */}
        <div className="flex flex-col p-5 bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow h-full">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400">
              <span className="material-symbols-outlined">pie_chart</span>
            </div>
            <div className="size-6 rounded-full border-[3px] border-border border-t-purple-500 border-r-purple-500 transform rotate-45"></div>
          </div>
          <p className="text-muted-foreground text-sm font-medium mb-1">{isAdmin ? t('stats.completed_evaluation') : t('stats.evaluation_progress')}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-foreground">{dashboardStats.completedPercent}%</p>
          </div>
        </div>

        {/* Card 4: Menunggu Review */}
        <div className="flex flex-col p-5 bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group h-full">
          <div className="absolute right-0 top-0 w-24 h-24 bg-orange-500/5 rounded-full -mr-6 -mt-6 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-600 dark:text-orange-400">
              <span className="material-symbols-outlined">pending_actions</span>
            </div>
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
            </span>
          </div>
          <p className="text-muted-foreground text-sm font-medium mb-1 relative z-10">
            {isAdmin ? t('stats.pending_review') : t('stats.pending_tasks')}
          </p>
          <p className="text-3xl font-bold text-foreground relative z-10">{dashboardStats.pendingReview}</p>
        </div>
      </div>
    ),
    "quick-actions": (
      <div className="flex flex-col gap-4 h-full">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Quick Actions</h2>
        </div>
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm flex flex-col gap-3 h-full">
          {isAdmin ? (
            <>
              {/* Admin Quick Actions */}
              <Link href="/admin/users" className="w-full flex items-center justify-between p-4 rounded-lg bg-primary text-primary-foreground hover:bg-sky-600 transition-all shadow-md shadow-sky-200 dark:shadow-none group">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <span className="material-symbols-outlined">person_add</span>
                  </div>
                  <span className="font-bold text-sm">Tambah Pengguna</span>
                </div>
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">chevron_right</span>
              </Link>
              <Link href="/admin/periods" className="w-full flex items-center justify-between p-4 rounded-lg bg-card border border-border text-foreground hover:border-primary hover:text-primary transition-all group">
                <div className="flex items-center gap-3">
                  <div className="bg-accent p-2 rounded-lg text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                    <span className="material-symbols-outlined">playlist_add</span>
                  </div>
                  <span className="font-bold text-sm">Buat Periode Baru</span>
                </div>
                <span className="material-symbols-outlined text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all">chevron_right</span>
              </Link>
              <Link href="/reports" className="w-full flex items-center justify-between p-4 rounded-lg bg-card border border-border text-foreground hover:border-primary hover:text-primary transition-all group mt-auto">
                <div className="flex items-center gap-3">
                  <div className="bg-accent p-2 rounded-lg text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                    <span className="material-symbols-outlined">download</span>
                  </div>
                  <span className="font-bold text-sm">Download Report</span>
                </div>
                <span className="material-symbols-outlined text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all">chevron_right</span>
              </Link>
            </>
          ) : (
            <>
              {/* Staff Quick Actions */}
              <Link href="/panca-tugas" className="w-full flex items-center justify-between p-4 rounded-lg bg-primary text-primary-foreground hover:bg-sky-600 transition-all shadow-md shadow-sky-200 dark:shadow-none group">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <span className="material-symbols-outlined">add_circle</span>
                  </div>
                  <span className="font-bold text-sm">Catat Aktivitas Baru</span>
                </div>
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">chevron_right</span>
              </Link>
              <Link href="/tasks" className="w-full flex items-center justify-between p-4 rounded-lg bg-card border border-border text-foreground hover:border-primary hover:text-primary transition-all group">
                <div className="flex items-center gap-3">
                  <div className="bg-accent p-2 rounded-lg text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                    <span className="material-symbols-outlined">task_alt</span>
                  </div>
                  <span className="font-bold text-sm">Tugas Saya</span>
                </div>
                <span className="material-symbols-outlined text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all">chevron_right</span>
              </Link>
              <Link href="/goals" className="w-full flex items-center justify-between p-4 rounded-lg bg-card border border-border text-foreground hover:border-primary hover:text-primary transition-all group">
                <div className="flex items-center gap-3">
                  <div className="bg-accent p-2 rounded-lg text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                    <span className="material-symbols-outlined">flag</span>
                  </div>
                  <span className="font-bold text-sm">Target Saya</span>
                </div>
                <span className="material-symbols-outlined text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all">chevron_right</span>
              </Link>
              <Link href="/evaluations" className="w-full flex items-center justify-between p-4 rounded-lg bg-card border border-border text-foreground hover:border-primary hover:text-primary transition-all group mt-auto">
                <div className="flex items-center gap-3">
                  <div className="bg-accent p-2 rounded-lg text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                    <span className="material-symbols-outlined">description</span>
                  </div>
                  <span className="font-bold text-sm">Evaluasi Saya</span>
                </div>
                <span className="material-symbols-outlined text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all">chevron_right</span>
              </Link>
            </>
          )}
        </div>
      </div>
    ),
    "recent-activity": (
      <div className="flex flex-col gap-4 h-full">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">
            {isAdmin ? "Recent Activity" : "Aktivitas Terakhir Saya"}
          </h2>
          <Link 
            href={isAdmin ? "/admin/activities" : "/panca-tugas"} 
            className="text-primary text-sm font-semibold hover:underline"
          >
            Lihat Semua
          </Link>
        </div>
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm h-full flex flex-col">
          <div className="flex flex-col flex-1">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <div 
                  key={activity.id} 
                  className={`flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors ${
                    index < recentActivities.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <div className={`size-10 rounded-full flex items-center justify-center flex-shrink-0 ${activity.iconColor}`}>
                    <span className="material-symbols-outlined text-[20px]">{activity.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{activity.userName}</p>
                    <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
                  </div>
                  <div className="text-xs text-muted-foreground font-medium whitespace-nowrap">{activity.timeAgo}</div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground flex-1 flex flex-col items-center justify-center">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">history</span>
                <p className="text-sm">Belum ada aktivitas terbaru</p>
              </div>
            )}
          </div>
        </div>
      </div>
    ),
    "heatmap": (
      <div className="bg-card rounded-xl border border-border p-6 shadow-sm overflow-hidden h-full">
        <h2 className="text-lg font-bold text-foreground mb-4">
          Konsistensi Aktivitas Tahunan
        </h2>
        <ActivityHeatmap data={heatmapData} />
      </div>
    ),
    charts: (isAdmin && activePeriod) ? (
      <DashboardChartsWidget 
         activePeriodId={activePeriod.id}
         activePeriodName={activePeriod.name}
         barData={chartData.barData}
         radarData={chartData.radarData}
      />
    ) : null,
    deadlines: (
      <DeadlineCountdown 
        activePeriod={activePeriod} 
        pendingTasksCount={dashboardStats.pendingReview} 
      />
    ),
    "perf-score": (
      !isAdmin ? <CompositeScoreCard score={score} /> : null
    ),
    "perf-monthly": (
      !isAdmin ? <PerformanceMonthlyChart monthlyStats={monthlyStats} /> : null
    ),
    "perf-pillar": (
      !isAdmin ? <PerformancePillarChart pillarBalance={pillarBalance} /> : null
    ),
    "perf-tasks": (
      !isAdmin ? <PerformanceTaskStats taskStats={taskStats} /> : null
    )
  }

  return (
    <>
      {/* Alert Banners */}
      <AlertBanner alerts={alerts} />

      {/* Greeting */}
      <div className="flex flex-col gap-1 mb-6">
        <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">
          {t('welcome', { name: session.user?.name || "User" })}
        </h1>
        <p className="text-muted-foreground text-base">
          {t('role', { role: session.user?.role })}
        </p>
      </div>

      <DashboardGrid 
        layout={layout} 
        widgets={widgets} 
        role={session.user?.role || "PASTORAL_STAFF"} 
      />

      {/* Footer Spacer */}
      <div className="h-10"></div>
    </>
  )
}
