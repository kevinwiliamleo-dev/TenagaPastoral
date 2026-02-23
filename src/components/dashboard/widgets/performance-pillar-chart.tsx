"use client"

import { useTranslations } from "next-intl"
import { PILLAR_INFO, type PastoralPillar } from "@/lib/constants"

interface PillarStats {
  pillar: string
  count: number
  totalDuration: number
}

interface PerformancePillarChartProps {
  pillarBalance: PillarStats[]
}

export function PerformancePillarChart({ pillarBalance }: PerformancePillarChartProps) {
  const t = useTranslations("Performance")

  const maxPillarCount = Math.max(...pillarBalance.map(p => p.count), 1)

  return (
    <div className="bg-card rounded-xl border border-border p-5 h-full">
      <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">donut_small</span>
        {t("charts.pillar_balance")}
      </h2>
      <div className="space-y-4">
        {pillarBalance.map((stat) => {
          const info = PILLAR_INFO[stat.pillar as PastoralPillar]
          const percentage = maxPillarCount > 0 ? (stat.count / maxPillarCount) * 100 : 0
          return (
            <div key={stat.pillar} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className={`size-3 rounded-full ${info?.color || "bg-gray-500"}`} />
                  <span className="truncate max-w-[120px]" title={info?.name}>{info?.name || stat.pillar}</span>
                </span>
                <span className="text-muted-foreground text-xs">
                  {stat.count}
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
  )
}
