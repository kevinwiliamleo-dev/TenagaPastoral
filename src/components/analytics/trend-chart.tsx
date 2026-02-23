"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface TrendChartProps {
  data: { name: string; avg: number }[]
}

export function TrendChart({ data }: TrendChartProps) {
  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="name" 
            className="text-xs text-muted-foreground" 
            tick={{ fill: "currentColor" }}
          />
          <YAxis 
            className="text-xs text-muted-foreground" 
            domain={[0, 5]}
            tick={{ fill: "currentColor" }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "hsl(var(--card))", 
              borderColor: "hsl(var(--border))",
              borderRadius: "0.5rem",
              color: "hsl(var(--foreground))"
            }}
          />
          <Line 
            type="monotone" 
            dataKey="avg" 
            stroke="hsl(var(--primary))" 
            strokeWidth={2}
            activeDot={{ r: 8 }} 
            name="Rata-rata Nilai"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
