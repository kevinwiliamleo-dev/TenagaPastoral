"use client"

import { ScoreProgressBar } from "./score-progress-bar"

interface ScoreBreakdownProps {
  activityScore: number
  pillarBalanceScore: number
  taskScore: number
  consistencyScore: number
  evaluationScore: number
  weights: {
    activity: number
    pillar: number
    task: number
    consistency: number
    evaluation: number
  }
}

const COMPONENT_CONFIG = [
  { key: "activity", scoreKey: "activityScore", icon: "📊", color: "#3B82F6", label: "Aktivitas Panca Tugas" },
  { key: "pillar", scoreKey: "pillarBalanceScore", icon: "⚖️", color: "#10B981", label: "Keseimbangan Pilar" },
  { key: "task", scoreKey: "taskScore", icon: "✅", color: "#F59E0B", label: "Penyelesaian Tugas" },
  { key: "consistency", scoreKey: "consistencyScore", icon: "📅", color: "#8B5CF6", label: "Konsistensi Harian" },
  { key: "evaluation", scoreKey: "evaluationScore", icon: "⭐", color: "#06B6D4", label: "Evaluasi 360°" },
] as const

export function ScoreBreakdown({
  activityScore,
  pillarBalanceScore,
  taskScore,
  consistencyScore,
  evaluationScore,
  weights,
}: ScoreBreakdownProps) {
  const scores: Record<string, number> = {
    activityScore,
    pillarBalanceScore,
    taskScore,
    consistencyScore,
    evaluationScore,
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Breakdown Komponen
      </p>
      <div className="flex flex-col gap-2.5">
        {COMPONENT_CONFIG.map((comp, i) => (
          <ScoreProgressBar
            key={comp.key}
            value={Math.round(scores[comp.scoreKey])}
            label={comp.label}
            weight={weights[comp.key as keyof typeof weights]}
            color={comp.color}
            icon={comp.icon}
            delay={i * 150}
          />
        ))}
      </div>
    </div>
  )
}
