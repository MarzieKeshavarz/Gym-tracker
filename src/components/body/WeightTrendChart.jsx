import React from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'

const PRIMARY = '#FF6A3D'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="card-flat shadow-elev">
      <p className="caption mb-0.5">{label}</p>
      <p className="font-display font-bold text-lg tabular tracking-tightish" style={{ color: PRIMARY }}>
        {payload[0].value}
        <span className="text-text-secondary text-sm font-body font-medium ml-0.5">kg</span>
      </p>
    </div>
  )
}

export default function WeightTrendChart({ data }) {
  if (!data?.length) return null

  // recharts auto-scales; nudge bounds so the line doesn't graze the edges.
  const weights = data.map(d => d.weight)
  const lo = Math.floor(Math.min(...weights) - 1)
  const hi = Math.ceil(Math.max(...weights) + 1)

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <p className="label">⚖️ Weight trend</p>
        <span className="chip-accent">
          <span className="tabular">{data.length}</span> entries
        </span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id="weightArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.35} />
              <stop offset="100%" stopColor={PRIMARY} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E222B" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: '#6B7280', fontSize: 11, fontFamily: 'Inter' }}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <YAxis
            tick={{ fill: '#6B7280', fontSize: 11, fontFamily: 'Inter' }}
            tickLine={false}
            axisLine={false}
            domain={[lo, hi]}
            unit="kg"
            width={48}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#2A2F3A', strokeDasharray: '3 3' }} />
          <Area
            type="monotone"
            dataKey="weight"
            stroke={PRIMARY}
            strokeWidth={2.5}
            fill="url(#weightArea)"
            dot={{ fill: PRIMARY, strokeWidth: 0, r: 4 }}
            activeDot={{ fill: PRIMARY, stroke: '#FFB388', strokeWidth: 3, r: 6 }}
            isAnimationActive
            animationDuration={650}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
