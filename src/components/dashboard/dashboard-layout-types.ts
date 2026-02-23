export type DashboardWidgetId =
  | "stats"
  | "recent-activity"
  | "quick-actions"
  | "heatmap"
  | "charts"
  | "deadlines"
  | "perf-score"
  | "perf-monthly"
  | "perf-pillar"
  | "perf-tasks"

export interface DashboardLayoutData {
  items: DashboardWidgetId[]
}

export const DEFAULT_LAYOUT: DashboardWidgetId[] = [
  "perf-score",
  "stats",
  "deadlines",
  "perf-monthly",
  "perf-pillar",
  "perf-tasks",
  "quick-actions",
  "heatmap",
  "recent-activity",
  "charts"
]

export const WIDGET_LABELS: Record<DashboardWidgetId, string> = {
  stats: "Statistik",
  "recent-activity": "Aktivitas Terakhir",
  "quick-actions": "Akses Cepat",
  heatmap: "Konsistensi Tahunan",
  charts: "Grafik Analisis",
  deadlines: "Hitung Mundur Deadline",
  "perf-score": "Kartu Skor Kinerja",
  "perf-monthly": "Aktivitas Bulanan",
  "perf-pillar": "Keseimbangan Pilar",
  "perf-tasks": "Status Tugas"
}
