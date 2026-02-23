"use client"

import { useEffect, useState } from "react"

interface StaffEntry {
  userId: string
  userName: string
  activityScore: number
  pillarBalanceScore: number
  taskScore: number
  consistencyScore: number
  evaluationScore?: number
  totalScore: number
  position: number
  medal: string | null
}

interface StaffScoreboardProps {
  leaderboard: StaffEntry[]
  stats: {
    average: number
    highest: number
    lowest: number
    median: number
    count: number
  }
}

function getScoreColor(score: number) {
  if (score >= 90) return "#3B82F6"
  if (score >= 75) return "#10B981"
  if (score >= 60) return "#F59E0B"
  if (score >= 40) return "#F97316"
  return "#EF4444"
}

function getScoreBg(score: number) {
  if (score >= 90) return "bg-blue-500/10 text-blue-400"
  if (score >= 75) return "bg-emerald-500/10 text-emerald-400"
  if (score >= 60) return "bg-amber-500/10 text-amber-400"
  if (score >= 40) return "bg-orange-500/10 text-orange-400"
  return "bg-red-500/10 text-red-400"
}

export function StaffScoreboard({ leaderboard, stats }: StaffScoreboardProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(true)
  }, [])

  return (
    <div className={`flex flex-col gap-6 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Rata-rata" value={stats.average} icon="analytics" color="#3B82F6" />
        <StatCard label="Tertinggi" value={stats.highest} icon="arrow_upward" color="#10B981" />
        <StatCard label="Terendah" value={stats.lowest} icon="arrow_downward" color="#EF4444" />
        <StatCard label="Median" value={stats.median} icon="horizontal_rule" color="#F59E0B" />
      </div>

      {/* Ranking Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">leaderboard</span>
              <h3 className="font-semibold">Scoreboard Staff</h3>
            </div>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
              {stats.count} staff
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase w-12">#</th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Nama Staff</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase text-center">Aktivitas</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase text-center">Pilar</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase text-center">Tugas</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase text-center">Konsistensi</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase text-center">Evaluasi</th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase text-center">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                    <span className="material-symbols-outlined text-4xl mb-2 block opacity-40">person_off</span>
                    Belum ada data staff
                  </td>
                </tr>
              ) : (
                leaderboard.map((staff, idx) => (
                  <tr 
                    key={staff.userId} 
                    className="hover:bg-accent/30 transition-colors"
                    style={{
                      animationDelay: `${idx * 50}ms`,
                    }}
                  >
                    <td className="px-6 py-3">
                      <span className="text-lg">{staff.medal || staff.position}</span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div 
                          className="size-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ backgroundColor: getScoreColor(staff.totalScore) }}
                        >
                          {staff.userName?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <span className="font-medium text-sm">{staff.userName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm">{Math.round(staff.activityScore)}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm">{Math.round(staff.pillarBalanceScore)}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm">{Math.round(staff.taskScore)}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm">{Math.round(staff.consistencyScore)}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm">{Math.round(staff.evaluationScore ?? 0)}</span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className={`inline-flex items-center justify-center text-sm font-bold px-3 py-1 rounded-full ${getScoreBg(staff.totalScore)}`}>
                        {staff.totalScore}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Score Distribution Bar Chart */}
      {leaderboard.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">bar_chart</span>
            Distribusi Skor Staff
          </h3>
          <div className="flex items-end gap-2 h-40 px-2">
            {leaderboard.map((staff) => {
              const barHeight = Math.max(8, (staff.totalScore / 100) * 100)
              return (
                <div 
                  key={staff.userId} 
                  className="flex-1 flex flex-col items-center gap-1 min-w-0"
                >
                  <span className="text-xs font-bold" style={{ color: getScoreColor(staff.totalScore) }}>
                    {staff.totalScore}
                  </span>
                  <div
                    className="w-full rounded-t-md transition-all duration-700 ease-out min-w-[20px] max-w-[48px] mx-auto"
                    style={{
                      height: `${barHeight}%`,
                      background: `linear-gradient(180deg, ${getScoreColor(staff.totalScore)}, ${getScoreColor(staff.totalScore)}88)`,
                      boxShadow: `0 0 8px ${getScoreColor(staff.totalScore)}30`,
                    }}
                  />
                  <span className="text-[10px] text-muted-foreground truncate max-w-full text-center">
                    {staff.userName?.split(" ")[0]}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ 
  label, value, icon, color 
}: { 
  label: string; value: number; icon: string; color: string 
}) {
  return (
    <div 
      className="rounded-xl border border-border p-4 transition-all hover:scale-[1.02]"
      style={{ background: `linear-gradient(135deg, ${color}08, transparent)` }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="material-symbols-outlined text-lg" style={{ color }}>{icon}</span>
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
    </div>
  )
}
