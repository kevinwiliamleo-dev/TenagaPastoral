"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { ScoreBreakdown } from "./score-breakdown"

interface ScoringWeights {
  activity: number
  pillar: number
  task: number
  consistency: number
  evaluation: number
}

interface CompositeScoreCardProps {
  score: {
    activityScore: number
    pillarBalanceScore: number
    taskScore: number
    consistencyScore: number
    evaluationScore?: number
    totalScore: number
    rank?: string
    weights?: ScoringWeights
  }
}

const DEFAULT_WEIGHTS: ScoringWeights = {
  activity: 25, pillar: 20, task: 20, consistency: 15, evaluation: 20,
}

function getScoreGradient(score: number) {
  if (score >= 90) return { from: "#3B82F6", to: "#60A5FA", glow: "#3B82F640" }
  if (score >= 75) return { from: "#10B981", to: "#34D399", glow: "#10B98140" }
  if (score >= 60) return { from: "#F59E0B", to: "#FBBF24", glow: "#F59E0B40" }
  if (score >= 40) return { from: "#F97316", to: "#FB923C", glow: "#F9731640" }
  return { from: "#EF4444", to: "#F87171", glow: "#EF444440" }
}

function getScoreLabel(score: number) {
  if (score >= 90) return "Luar Biasa"
  if (score >= 75) return "Sangat Baik"
  if (score >= 60) return "Baik"
  if (score >= 40) return "Cukup"
  return "Perlu Peningkatan"
}

export function CompositeScoreCard({ score }: CompositeScoreCardProps) {
  const t = useTranslations("Performance")
  const [animatedScore, setAnimatedScore] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  const weights = score.weights || DEFAULT_WEIGHTS
  const gradient = getScoreGradient(score.totalScore)
  const label = getScoreLabel(score.totalScore)

  // Animated counter
  useEffect(() => {
    setIsVisible(true)
    const target = score.totalScore
    const duration = 1200
    const steps = 40
    const increment = target / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        setAnimatedScore(target)
        clearInterval(timer)
      } else {
        setAnimatedScore(Math.round(current))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [score.totalScore])

  // SVG circle
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const strokeDash = (score.totalScore / 100) * circumference

  return (
    <div 
      className={`rounded-xl border border-border/50 p-6 transition-all duration-500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      style={{
        background: `linear-gradient(135deg, ${gradient.from}08 0%, ${gradient.from}03 50%, transparent 100%)`,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <span className="material-symbols-outlined text-xl" style={{ color: gradient.from }}>
          emoji_events
        </span>
        <h3 className="font-semibold text-sm uppercase tracking-wider text-foreground">
          {t("score_card.title")}
        </h3>
      </div>

      {/* Score Circle + Label */}
      <div className="flex items-center gap-6 mb-6">
        <div className="relative flex-shrink-0">
          <svg width="128" height="128" viewBox="0 0 128 128" className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="64" cy="64" r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted/30"
            />
            {/* Score circle */}
            <circle
              cx="64" cy="64" r={radius}
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - strokeDash}
              className="transition-all duration-1000 ease-out"
              style={{
                stroke: `url(#scoreGradient)`,
                filter: `drop-shadow(0 0 6px ${gradient.glow})`,
              }}
            />
            <defs>
              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={gradient.from} />
                <stop offset="100%" stopColor={gradient.to} />
              </linearGradient>
            </defs>
          </svg>
          {/* Score number overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span 
              className="text-3xl font-bold"
              style={{ color: gradient.from }}
            >
              {animatedScore}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">/ 100</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p 
            className="text-lg font-bold"
            style={{ color: gradient.from }}
          >
            {label}
          </p>
          {score.rank && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {score.rank}
            </p>
          )}
          <Link 
            href="/leaderboard"
            className="inline-flex items-center gap-1 mt-3 text-xs font-medium hover:underline transition-colors"
            style={{ color: gradient.from }}
          >
            <span className="material-symbols-outlined text-sm">leaderboard</span>
            {t("score_card.view_rank")}
          </Link>
        </div>
      </div>

      {/* Score Breakdown */}
      <ScoreBreakdown
        activityScore={score.activityScore}
        pillarBalanceScore={score.pillarBalanceScore}
        taskScore={score.taskScore}
        consistencyScore={score.consistencyScore}
        evaluationScore={score.evaluationScore ?? 0}
        weights={weights}
      />
    </div>
  )
}
