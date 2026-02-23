"use client"

import { useEffect, useState } from "react"

interface ScoreProgressBarProps {
  value: number
  max?: number
  label: string
  weight: number
  color: string
  icon: string
  delay?: number
}

export function ScoreProgressBar({ 
  value, 
  max = 100, 
  label, 
  weight, 
  color, 
  icon,
  delay = 0 
}: ScoreProgressBarProps) {
  const [animatedWidth, setAnimatedWidth] = useState(0)
  const percentage = Math.min((value / max) * 100, 100)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedWidth(percentage)
    }, delay)
    return () => clearTimeout(timer)
  }, [percentage, delay])

  return (
    <div className="flex items-center gap-3 group">
      <div className="flex-shrink-0 w-6 text-center">
        <span className="text-base">{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-1">
          <span className="text-sm font-medium text-foreground truncate">{label}</span>
          <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
            {value}/{max} <span className="opacity-60">({weight}%)</span>
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-muted/50 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${animatedWidth}%`,
              background: `linear-gradient(90deg, ${color}88, ${color})`,
              boxShadow: `0 0 8px ${color}40`,
            }}
          />
        </div>
      </div>
    </div>
  )
}
