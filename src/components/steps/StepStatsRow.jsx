import React from 'react'
import { useCountUp } from '../../utils/useCountUp.js'

export default function StepStatsRow({ stats }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard
        value={stats.avgDaily}
        label="Avg / day"
        highlight
      />
      <StatCard
        value={stats.currentStreak}
        suffix={stats.currentStreak > 0 ? <span className="flame">🔥</span> : null}
        label="Step streak"
      />
      <StatCard
        value={stats.highestDay?.steps || 0}
        label="Best day"
      />
      <StatCard
        value={stats.weeklyTotal}
        label="Weekly total"
      />
    </div>
  )
}

function StatCard({ value, suffix, label, highlight }) {
  const display = useCountUp(typeof value === 'number' ? value : 0)
  return (
    <div
      className={`card lift text-center py-4 px-2 overflow-hidden ${
        highlight ? 'border-primary/30 bg-primary-soft' : ''
      }`}
    >
      <p className={`stat-value ${highlight ? 'text-primary' : 'text-text-primary'}`}>
        {display.toLocaleString()}
        {suffix && <span className="ml-1 text-2xl align-middle">{suffix}</span>}
      </p>
      <p className="label mt-1.5">{label}</p>
    </div>
  )
}
