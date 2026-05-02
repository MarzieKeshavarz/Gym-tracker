import React from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const { label, calories } = payload[0].payload
  return (
    <div className="bg-surface2 border border-border rounded-lg p-3 shadow-xl">
      <p className="text-muted text-xs mb-1">{label}</p>
      <p className="text-accent font-display font-bold text-lg">{calories} kcal</p>
    </div>
  )
}

export default function WeeklyCalorieChart({ data }) {
  return (
    <div className="card">
      <p className="label mb-4">🔥 Last 7 Days</p>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
          <XAxis
            dataKey="label"
            tick={{ fill: '#666', fontSize: 10, fontFamily: 'Barlow' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: '#666', fontSize: 10, fontFamily: 'Barlow' }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3a3a3a', strokeWidth: 1 }} />
          <Line
            type="monotone"
            dataKey="calories"
            stroke="#c8ff00"
            strokeWidth={2.5}
            dot={{ fill: '#c8ff00', strokeWidth: 0, r: 3 }}
            activeDot={{ fill: '#c8ff00', strokeWidth: 0, r: 6 }}
            isAnimationActive
            animationDuration={500}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
