"use client"

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"

interface BarChartProps {
  data: any[]
  xAxisKey: string
  barKeys: { key: string; color: string; name: string }[]
  height?: number
}

export function BarChart({ data, xAxisKey, barKeys, height = 300 }: BarChartProps) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <RechartsBarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey={xAxisKey} 
            className="text-xs text-muted-foreground" 
            tick={{ fill: "currentColor" }}
          />
          <YAxis 
            className="text-xs text-muted-foreground" 
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
          <Legend />
          {barKeys.map((bar) => (
            <Bar 
              key={bar.key} 
              dataKey={bar.key} 
              fill={bar.color} 
              name={bar.name} 
              radius={[4, 4, 0, 0]} 
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  )
}

interface RadarChartProps {
  data: any[]
  dataKey: string
  gridKey: string
  height?: number
  onClick?: (data: any) => void
}

export function RadarChart({ data, dataKey, gridKey, height = 300, onClick }: RadarChartProps) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <RechartsRadarChart 
          cx="50%" 
          cy="50%" 
          outerRadius="80%" 
          data={data}
          onClick={(data: any) => {
            if (onClick && data && data.activePayload && data.activePayload.length > 0) {
              const payload = data.activePayload[0].payload
              onClick(payload)
            }
          }}
          style={{ cursor: onClick ? "pointer" : "default" }}
        >
          <PolarGrid className="stroke-muted" />
          <PolarAngleAxis 
            dataKey={gridKey} 
            tick={{ fill: "currentColor", fontSize: 12 }} 
          />
          <PolarRadiusAxis angle={30} domain={[0, 5]} />
          <Radar
            name="Score"
            dataKey={dataKey}
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.6}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "hsl(var(--card))", 
              borderColor: "hsl(var(--border))",
              borderRadius: "0.5rem",
              color: "hsl(var(--foreground))"
            }}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  )
}
