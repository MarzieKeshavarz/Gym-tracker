import React from 'react'
import { formatWeightDelta } from '../../utils/bodyAnalytics.js'

export default function BodyStatsRow({ stats }) {
  const tone = (delta) =>
    delta == null || delta === 0 ? 'neutral'
    : delta < 0 ? 'success'
    : 'warning'

  return (
    <div className="grid grid-cols-2 gap-3">
      <Tile
        value={`${stats.latest?.weight ?? '—'}`}
        unit="kg"
        label="Current"
        highlight
      />
      <Tile
        value={stats.delta7d ? formatWeightDelta(stats.delta7d.delta) : '—'}
        label="Change · 7d"
        tone={stats.delta7d ? tone(stats.delta7d.delta) : 'neutral'}
      />
      <Tile
        value={stats.delta30d ? formatWeightDelta(stats.delta30d.delta) : '—'}
        label="Change · 30d"
        tone={stats.delta30d ? tone(stats.delta30d.delta) : 'neutral'}
      />
      <Tile
        value={`${stats.lowest?.weight ?? '—'}`}
        unit="kg"
        label="All-time low"
      />
    </div>
  )
}

function Tile({ value, unit, label, highlight, tone }) {
  const color = tone === 'success'
    ? 'text-success'
    : tone === 'warning'
    ? 'text-warning'
    : tone === 'danger'
    ? 'text-danger'
    : highlight
    ? 'text-primary'
    : 'text-text-primary'

  return (
    <div className={`card text-center py-4 px-2 ${highlight ? 'border-primary/30 bg-primary-soft' : ''}`}>
      <p className="leading-none">
        <span className={`font-display font-bold text-[26px] tabular tracking-tighter2 ${color}`}>
          {value}
        </span>
        {unit && <span className="font-body font-semibold text-base text-text-secondary ml-0.5">{unit}</span>}
      </p>
      <p className="label mt-2">{label}</p>
    </div>
  )
}
