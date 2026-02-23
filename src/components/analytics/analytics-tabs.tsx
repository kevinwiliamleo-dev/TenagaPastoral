"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"

const tabs = [
  { value: "overview", label: "Overview" },
  { value: "productivity", label: "Productivity" },
  { value: "staffPerformance", label: "Staff Performance" },
  { value: "scoreboard", label: "Scoreboard" },
  { value: "developmentPlan", label: "Development Plan" },
]

export function AnalyticsTabs() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get("tab") || "overview"

  function handleTabChange(value: string) {
    const params = new URLSearchParams(searchParams)
    params.set("tab", value)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="border-b border-border">
      <div className="flex -mb-px overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value)}
            className={cn(
              "whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-colors",
              currentTab === tab.value
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}
