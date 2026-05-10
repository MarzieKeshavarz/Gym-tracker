import React, { useState, useEffect, useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { useUser } from '../../context/UserContext.jsx'
import { useBodyMetricsCtx } from '../../context/BodyMetricsContext.jsx'
import {
  getMeasurementSeries,
  MEASUREMENT_META,
} from '../../utils/bodyAnalytics.js'

function CustomTooltip({ active, payload, label, color }) {
  if (!active || !payload?.length) return null
  return (
    <div className="card-flat shadow-elev">
      <p className="caption mb-0.5">{label}</p>
      <p className="font-display font-bold text-lg tabular tracking-tightish" style={{ color }}>
        {payload[0].value}
        <span className="text-text-secondary text-sm font-body font-medium ml-0.5">cm</span>
      </p>
    </div>
  )
}

export default function MeasurementChart({ available, stats }) {
  const { currentUser } = useUser()
  const { version } = useBodyMetricsCtx()
  const [selected, setSelected] = useState(available[0] || null)

  // Reset selection if the available list changes (e.g. user just added the
  // first measurement of a kind that wasn't tracked before).
  useEffect(() => {
    if (!selected || !available.includes(selected)) {
      setSelected(available[0] || null)
    }
  }, [available, selected])

  const series = useMemo(() => {
    if (!currentUser?.id || !selected) return []
    return getMeasurementSeries(currentUser.id, selected)
  }, [currentUser?.id, selected, version])

  if (!available.length) return null

  const meta = selected ? MEASUREMENT_META[selected] : null
  const stat = selected ? stats?.[selected] : null

  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="label">📐 Measurements</p>
        {stat && (
          <span className="caption tabular">
            {stat.points} {stat.points === 1 ? 'entry' : 'entries'}
          </span>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
        {available.map(k => {
          const m = MEASUREMENT_META[k]
          const active = selected === k
          return (
            <button
              key={k}
              onClick={() => setSelected(k)}
              className={`flex-shrink-0 px-4 h-9 rounded-xl text-sm font-display font-semibold tracking-tightish transition-all active:scale-95 inline-flex items-center gap-1.5 border ${
                active ? '' : 'bg-surface-2 border-border text-text-secondary hover:text-text-primary'
              }`}
              style={active ? {
                backgroundColor: `${m.color}1F`,
                borderColor: `${m.color}55`,
                color: m.color,
              } : {}}
            >
              <span>{m.icon}</span>
              {m.label}
            </button>
          )
        })}
      </div>

      {series.length >= 2 && meta && (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
            <defs>
              <linearGradient id={`measArea-${selected}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={meta.color} stopOpacity={0.32} />
                <stop offset="100%" stopColor={meta.color} stopOpacity={0} />
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
              unit="cm"
              width={48}
            />
            <Tooltip
              content={<CustomTooltip color={meta.color} />}
              cursor={{ stroke: '#2A2F3A', strokeDasharray: '3 3' }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={meta.color}
              strokeWidth={2.5}
              fill={`url(#measArea-${selected})`}
              dot={{ fill: meta.color, strokeWidth: 0, r: 4 }}
              activeDot={{ fill: meta.color, stroke: '#FFFFFF22', strokeWidth: 3, r: 6 }}
              isAnimationActive
              animationDuration={550}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}

      {series.length === 1 && (
        <p className="body-sm text-center py-3">
          Log {meta.label.toLowerCase()} again to see how it changes
        </p>
      )}
    </div>
  )
}
