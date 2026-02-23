"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from "recharts"

interface TrendData {
  period: string
  score: number
}

interface TrendChartProps {
  data: TrendData[]
  className?: string
}

export function TrendChart({ data, className }: TrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-muted/20 border border-dashed border-muted rounded-xl p-8 ${className}`}>
        <p className="text-muted-foreground text-sm">Belum ada data trend yang tersedia</p>
      </div>
    )
  }

  // Calculate generic performance zones
  const maxScore = 5

  return (
    <div className={`w-full h-[300px] ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 10, right: 30, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
          <XAxis 
            dataKey="period" 
            tick={{ fontSize: 12, fill: "#888" }} 
            axisLine={false}
            tickLine={false}
            dy={10}
          />
          <YAxis 
            domain={[0, 5]} 
            ticks={[0, 1, 2, 3, 4, 5]}
            tick={{ fontSize: 12, fill: "#888" }} 
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
            cursor={{ stroke: "#888", strokeWidth: 1, strokeDasharray: "3 3" }}
          />
          
          {/* Performance Zones Reference Lines */}
          <ReferenceLine y={3} stroke="#ff9800" strokeDasharray="3 3" label={{ position: 'right', value: 'Min', fill: '#ff9800', fontSize: 10 }} />
          <ReferenceLine y={4} stroke="#4caf50" strokeDasharray="3 3" label={{ position: 'right', value: 'Good', fill: '#4caf50', fontSize: 10 }} />
          
          <Line
            type="monotone"
            dataKey="score"
            stroke="hsl(var(--primary))"
            strokeWidth={3}
            dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "#fff" }}
            activeDot={{ r: 6, strokeWidth: 0 }}
            animationDuration={1500}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
