import React from 'react'
import {
  ComposedChart, Bar, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts'

const PRIMARY = '#FF6A3D'
const MUTED = '#3A4150'

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const { label, steps, target, hit } = payload[0].payload
  return (
    <div className="card-flat shadow-elev">
      <p className="caption mb-0.5">{label}</p>
      <p className="font-display font-bold text-lg tabular tracking-tightish" style={{ color: PRIMARY }}>
        {steps.toLocaleString()} <span className="text-text-tertiary text-sm font-body font-medium">steps</span>
      </p>
      {target > 0 && (
        <p className="caption mt-0.5 tabular">
          Goal {target.toLocaleString()} {hit ? '· ✓' : ''}
        </p>
      )}
    </div>
  )
}

export default function WeeklyStepChart({ data, target = 0 }) {
  return (
    <div className="card">
      <p className="label mb-4">👣 Last 7 days</p>
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
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
            tickFormatter={(v) => v >= 1000 ? `${Math.round(v / 1000)}k` : v}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,106,61,0.06)' }} />
          {target > 0 && (
            <ReferenceLine
              y={target}
              stroke={PRIMARY}
              strokeDasharray="4 4"
              strokeOpacity={0.55}
            />
          )}
          <Bar dataKey="steps" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={500}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.hit ? PRIMARY : MUTED} />
            ))}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
