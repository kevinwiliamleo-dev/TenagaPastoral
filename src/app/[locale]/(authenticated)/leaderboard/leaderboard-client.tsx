"use client"

import { useTranslations } from "next-intl"

interface ScoringWeights {
  activity: number
  pillar: number
  task: number
  consistency: number
  evaluation: number
}

interface ScoreBreakdown {
  activityScore: number
  pillarBalanceScore: number
  taskScore: number
  consistencyScore: number
  evaluationScore?: number
  totalScore: number
  rank?: string
  weights?: ScoringWeights
}

interface LeaderboardEntry extends ScoreBreakdown {
  userId: string
  userName: string
  position: number
  medal: string | null
}

interface LeaderboardClientProps {
  leaderboard: LeaderboardEntry[]
  myScore: ScoreBreakdown
  currentUserId: string
  isAdmin: boolean
  userName: string
}

const SCORE_COLORS: Record<string, string> = {
  "🥇 Excellent": "text-yellow-400",
  "🥈 Very Good": "text-slate-300",
  "🥉 Good": "text-amber-600",
  "📈 Progressing": "text-blue-400",
  "💪 Needs Improvement": "text-gray-400"
}

export function LeaderboardClient({ leaderboard, myScore, currentUserId, isAdmin, userName }: LeaderboardClientProps) {
  const t = useTranslations("Leaderboard")
  const myPosition = leaderboard.find(e => e.userId === currentUserId)?.position || 0

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>

        {/* My Score Card */}
        <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl border border-primary/30 p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">{t("your_score")}</p>
              <p className="text-5xl font-bold text-foreground">{myScore.totalScore}</p>
              <p className={`text-lg font-medium mt-1 ${SCORE_COLORS[myScore.rank || ""] || "text-foreground"}`}>
                {myScore.rank}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">{t("rank")}</p>
              <p className="text-4xl font-bold text-primary">#{myPosition}</p>
              <p className="text-sm text-muted-foreground">{t("from_staff", { count: leaderboard.length })}</p>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="grid grid-cols-5 gap-3 mt-6">
            <ScoreMetric label={t("metrics.activity")} value={myScore.activityScore} weight={`${myScore.weights?.activity ?? 25}%`} />
            <ScoreMetric label={t("metrics.pillar")} value={myScore.pillarBalanceScore} weight={`${myScore.weights?.pillar ?? 20}%`} />
            <ScoreMetric label={t("metrics.task")} value={myScore.taskScore} weight={`${myScore.weights?.task ?? 20}%`} />
            <ScoreMetric label={t("metrics.consistency")} value={myScore.consistencyScore} weight={`${myScore.weights?.consistency ?? 15}%`} />
            <ScoreMetric label={t("metrics.evaluation")} value={myScore.evaluationScore ?? 0} weight={`${myScore.weights?.evaluation ?? 20}%`} />
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-bold text-foreground">{t("table.title")}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t("table.headers.rank")}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t("table.headers.name")}</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">{t("table.headers.activity")}</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">{t("table.headers.pillar")}</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">{t("table.headers.task")}</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">{t("table.headers.consistency")}</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">{t("table.headers.evaluation")}</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">{t("table.headers.total")}</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry) => (
                  <tr 
                    key={entry.userId} 
                    className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${
                      entry.userId === currentUserId ? "bg-primary/10" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <span className="text-xl">{entry.medal || entry.position}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">
                            {entry.userName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className={`font-medium ${entry.userId === currentUserId ? "text-primary" : "text-foreground"}`}>
                          {entry.userName}
                          {entry.userId === currentUserId && ` ${t("table.you")}`}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ScoreCell value={entry.activityScore} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ScoreCell value={entry.pillarBalanceScore} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ScoreCell value={entry.taskScore} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ScoreCell value={entry.consistencyScore} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ScoreCell value={entry.evaluationScore ?? 0} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-lg font-bold text-foreground">{entry.totalScore}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Scoring Info */}
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="font-bold text-foreground mb-3">{t("scoring_info.title")}</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div>
              <p className="font-medium text-blue-400">{t("metrics.activity")} ({myScore.weights?.activity ?? 25}%)</p>
              <p className="text-muted-foreground">{t("scoring_info.activity_desc")}</p>
            </div>
            <div>
              <p className="font-medium text-green-400">{t("metrics.pillar")} ({myScore.weights?.pillar ?? 20}%)</p>
              <p className="text-muted-foreground">{t("scoring_info.pillar_desc")}</p>
            </div>
            <div>
              <p className="font-medium text-amber-400">{t("metrics.task")} ({myScore.weights?.task ?? 20}%)</p>
              <p className="text-muted-foreground">{t("scoring_info.task_desc")}</p>
            </div>
            <div>
              <p className="font-medium text-purple-400">{t("metrics.consistency")} ({myScore.weights?.consistency ?? 15}%)</p>
              <p className="text-muted-foreground">{t("scoring_info.consistency_desc")}</p>
            </div>
            <div>
              <p className="font-medium text-cyan-400">{t("metrics.evaluation")} ({myScore.weights?.evaluation ?? 20}%)</p>
              <p className="text-muted-foreground">{t("scoring_info.evaluation_desc")}</p>
            </div>
          </div>
        </div>
      </div>

    </>
  )
}

function ScoreMetric({ label, value, weight }: { label: string; value: number; weight: string }) {
  return (
    <div className="text-center">
      <p className="text-sm text-muted-foreground mb-1">{label} <span className="opacity-60">({weight})</span></p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <div className="h-1 bg-muted rounded-full mt-2 overflow-hidden">
        <div className="h-full bg-primary transition-all" style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

function ScoreCell({ value }: { value: number }) {
  const color = value >= 70 ? "text-green-400" : value >= 40 ? "text-amber-400" : "text-red-400"
  return <span className={`font-medium ${color}`}>{value}</span>
}

