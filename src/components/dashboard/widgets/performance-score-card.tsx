"use client"

import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"

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

interface PerformanceScoreCardProps {
  score: ScoreBreakdown
}

export function PerformanceScoreCard({ score }: PerformanceScoreCardProps) {
  const t = useTranslations("Performance")

  // Get score color based on value
  const getScoreColor = (value: number) => {
    if (value >= 80) return "text-emerald-400"
    if (value >= 60) return "text-primary"
    if (value >= 40) return "text-amber-400"
    return "text-red-400"
  }

  return (
    <Link href="/leaderboard" className="block h-full">
      <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl border border-primary/30 p-5 hover:border-primary/50 transition-colors h-full flex flex-col justify-between">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">{score.rank?.split(' ')[0] || '📊'}</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("score_card.title")}</p>
              <div className="flex items-baseline gap-2">
                <p className={`text-4xl font-bold ${getScoreColor(score.totalScore)}`}>{score.totalScore}</p>
                <p className="text-lg text-primary">{score.rank?.split(' ').slice(1).join(' ') || ''}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-right mt-auto">
          <div className="grid grid-cols-5 gap-1.5 text-xs">
            <div className="px-1.5 py-1 rounded bg-blue-500/10 text-center">
              <p className="font-bold text-blue-400">{score.activityScore}</p>
              <p className="text-[9px] text-muted-foreground truncate">{t("score_card.activity")}</p>
            </div>
            <div className="px-1.5 py-1 rounded bg-green-500/10 text-center">
              <p className="font-bold text-green-400">{score.pillarBalanceScore}</p>
              <p className="text-[9px] text-muted-foreground truncate">{t("score_card.pillar")}</p>
            </div>
            <div className="px-1.5 py-1 rounded bg-amber-500/10 text-center">
              <p className="font-bold text-amber-400">{score.taskScore}</p>
              <p className="text-[9px] text-muted-foreground truncate">{t("score_card.task")}</p>
            </div>
            <div className="px-1.5 py-1 rounded bg-purple-500/10 text-center">
              <p className="font-bold text-purple-400">{score.consistencyScore}</p>
              <p className="text-[9px] text-muted-foreground truncate">{t("score_card.consistency")}</p>
            </div>
            <div className="px-1.5 py-1 rounded bg-cyan-500/10 text-center">
              <p className="font-bold text-cyan-400">{score.evaluationScore ?? 0}</p>
              <p className="text-[9px] text-muted-foreground truncate">{t("score_card.evaluation")}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">{t("score_card.view_rank")}</p>
        </div>
      </div>
    </Link>
  )
}

