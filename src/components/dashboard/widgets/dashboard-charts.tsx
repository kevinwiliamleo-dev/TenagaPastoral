"use client"

import { useState } from "react"
import { BarChart, RadarChart } from "@/components/ui/charts"
import { PillarDetailModal } from "@/components/dashboard/pillar-detail-modal"

interface DashboardChartsWidgetProps {
  activePeriodName: string
  activePeriodId: string
  barData: any[]
  radarData: any[]
}

export function DashboardChartsWidget({ 
  activePeriodName, 
  activePeriodId,
  barData, 
  radarData 
}: DashboardChartsWidgetProps) {
  const [selectedPillar, setSelectedPillar] = useState<string | null>(null)

  const handlePillarClick = (data: any) => {
    // data is the payload from Recharts
    // For RadarChart, it should contain 'category'
    if (data && data.category) {
      setSelectedPillar(data.category)
    }
  }

  return (
    <>
    <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
      <h2 className="text-lg font-bold text-foreground mb-4">Distribusi Nilai - {activePeriodName}</h2>
      {barData.length > 0 ? (
        <BarChart 
          data={barData} 
          xAxisKey="name" 
          barKeys={[{ key: "count", color: "#3bf6ff", name: "Jumlah Staff" }]}
          height={300}
        />
      ) : (
        <div className="h-[300px] flex items-center justify-center text-muted-foreground bg-accent/20 rounded-lg">
          <p>Belum ada data evaluasi</p>
        </div>
      )}
    </div>
    
    <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-foreground">Performa per Kategori - {activePeriodName}</h2>
        {radarData.length > 0 && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Klik pilar untuk detail</span>
        )}
      </div>
      
      {radarData.length > 0 ? (
        <RadarChart 
          data={radarData} 
          dataKey="score" 
          gridKey="category" 
          height={300}
          onClick={handlePillarClick}
        />
      ) : (
        <div className="h-[300px] flex items-center justify-center text-muted-foreground bg-accent/20 rounded-lg">
          <p>Belum ada data evaluasi</p>
        </div>
      )}
    </div>

    {selectedPillar && (
      <PillarDetailModal 
        isOpen={!!selectedPillar} 
        onClose={() => setSelectedPillar(null)} 
        category={selectedPillar} 
        periodId={activePeriodId}
      />
    )}
    </>
  )
}
