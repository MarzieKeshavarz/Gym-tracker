import React from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'

const PRIMARY = '#FF6A3D'

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const { label, calories } = payload[0].payload
  return (
    <div className="card-flat shadow-elev">
      <p className="caption mb-0.5">{label}</p>
      <p className="font-display font-bold text-lg tabular tracking-tightish" style={{ color: PRIMARY }}>
        {calories} <span className="text-text-tertiary text-sm font-body font-medium">kcal</span>
      </p>
    </div>
  )
}

export default function WeeklyCalorieChart({ data }) {
  return (
    <div className="card">
      <p className="label mb-4">🔥 Last 7 days</p>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2A2F3A" />
          <XAxis
            dataKey="label"
            tick={{ fill: '#8A93A6', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: '#8A93A6', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3A4150', strokeWidth: 1 }} />
          <Line
            type="monotone"
            dataKey="calories"
            stroke={PRIMARY}
            strokeWidth={2.5}
            dot={{ fill: PRIMARY, strokeWidth: 0, r: 3 }}
            activeDot={{ fill: PRIMARY, strokeWidth: 0, r: 6 }}
            isAnimationActive
            animationDuration={500}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
