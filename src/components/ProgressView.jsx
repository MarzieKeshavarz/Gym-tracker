import React, { useState, useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { useUser } from '../context/UserContext.jsx'
import { usePlan } from '../context/PlanContext.jsx'
import { useLogs } from '../context/LogContext.jsx'
import { getExerciseHistory, formatDate } from '../utils/storage.js'

export default function ProgressView({ onBack }) {
  const { currentUser } = useUser()
  const { activePlan } = usePlan()
  const { version } = useLogs()

  const [selectedSectionId, setSelectedSectionId] = useState(activePlan?.sections[0]?.id)
  const [selectedExerciseId, setSelectedExerciseId] = useState(null)

  if (!activePlan || activePlan.sections.length === 0) {
    return (
      <div className="flex flex-col gap-5 slide-up pt-5 pb-8">
        <Header onBack={onBack} eyebrow="Progress tracker" title="Analytics" />
        <div className="card text-center py-12">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-surface-3 border border-border flex items-center justify-center text-3xl">
            📊
          </div>
          <p className="section-title">Nothing to show</p>
          <p className="body-sm mt-1.5">Add sections and exercises to your plan first</p>
        </div>
      </div>
    )
  }

  const selectedSection = activePlan.sections.find(s => s.id === selectedSectionId)
    || activePlan.sections[0]

  const exerciseId = selectedExerciseId || selectedSection?.exercises[0]?.id
  const exercise = selectedSection?.exercises.find(e => e.id === exerciseId)

  const history = useMemo(() => {
    if (!exerciseId || !currentUser) return []
    return getExerciseHistory(currentUser.id, activePlan.id, exerciseId)
  }, [exerciseId, currentUser, activePlan, version])

  const stats = useMemo(() => {
    if (!history.length) return null
    const weights = history.map(h => h.maxWeight).filter(w => w > 0)
    if (!weights.length) return null
    return {
      max: Math.max(...weights),
      first: weights[0],
      last: weights[weights.length - 1],
      improvement: weights.length > 1
        ? ((weights[weights.length - 1] - weights[0]) / weights[0] * 100).toFixed(1)
        : 0,
      sessions: history.length,
    }
  }, [history])

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-surface-2 border border-border-strong rounded-xl p-3 shadow-elev">
        <p className="caption mb-0.5">{label}</p>
        <p className="font-display font-bold text-lg tabular tracking-tightish text-primary">
          {payload[0].value}<span className="text-text-secondary text-sm font-medium ml-0.5">kg</span>
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 slide-up pt-5">
      <Header onBack={onBack} eyebrow={activePlan.name} title="Progress" />

      {/* Section tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5 no-scrollbar">
        {activePlan.sections.map(section => {
          const active = selectedSection?.id === section.id
          return (
            <button
              key={section.id}
              onClick={() => { setSelectedSectionId(section.id); setSelectedExerciseId(null) }}
              className={`flex-shrink-0 px-4 h-10 rounded-xl text-sm font-display font-semibold tracking-tightish transition-all active:scale-95 inline-flex items-center gap-1.5 ${
                active
                  ? 'text-text-primary border'
                  : 'bg-surface-2 border border-border text-text-secondary hover:text-text-primary'
              }`}
              style={active ? {
                backgroundColor: hexToBg(section.color, 0.16),
                borderColor: hexToBg(section.color, 0.4),
                color: section.color,
              } : {}}
            >
              <span>{section.icon}</span>
              {section.name}
            </button>
          )
        })}
      </div>

      {/* Exercise picker */}
      {selectedSection && (
        <div className="flex flex-col gap-2.5">
          <p className="label">Exercise</p>
          {selectedSection.exercises.length === 0 ? (
            <div className="card text-center py-6">
              <p className="body-sm">This section has no exercises</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {selectedSection.exercises.map(ex => {
                const hist = currentUser
                  ? getExerciseHistory(currentUser.id, activePlan.id, ex.id)
                  : []
                const hasData = hist.length > 0
                const active = exerciseId === ex.id
                return (
                  <button
                    key={ex.id}
                    onClick={() => setSelectedExerciseId(ex.id)}
                    className={`card text-left py-3 px-3 transition-all active:scale-[0.98] ${
                      active ? 'border-primary/50 bg-primary-soft' : ''
                    }`}
                  >
                    <p className={`font-body font-semibold text-sm leading-snug ${active ? 'text-primary' : 'text-text-primary'}`}>
                      {ex.name}
                    </p>
                    <p className="caption mt-1 tabular">
                      {hasData ? `${hist.length} session${hist.length !== 1 ? 's' : ''}` : 'No data'}
                    </p>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      {stats && exercise && (
        <div className="flex flex-col gap-3">
          <p className="label">{exercise.name} · stats</p>
          <div className="grid grid-cols-2 gap-3">
            <StatTile value={`${stats.max}`} unit="kg" label="All-time max" highlight />
            <StatTile
              value={`${Number(stats.improvement) >= 0 ? '+' : ''}${stats.improvement}`}
              unit="%"
              label="Improvement"
              tone={Number(stats.improvement) >= 0 ? 'success' : 'danger'}
            />
            <StatTile value={`${stats.last}`} unit="kg" label="Last session" />
            <StatTile value={`${stats.sessions}`} label="Sessions" />
          </div>
        </div>
      )}

      {/* Chart */}
      {history.length >= 2 && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <p className="label">Weight progression</p>
            <span className="chip-accent">
              <span className="tabular">{history.length}</span> sessions
            </span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={history} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
              <defs>
                <linearGradient id="primaryArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF6A3D" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#FF6A3D" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E222B" vertical={false} />
              <XAxis
                dataKey="dateLabel"
                tick={{ fill: '#6B7280', fontSize: 11, fontFamily: 'Inter' }}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                tick={{ fill: '#6B7280', fontSize: 11, fontFamily: 'Inter' }}
                tickLine={false}
                axisLine={false}
                unit="kg"
                width={48}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#2A2F3A', strokeDasharray: '3 3' }} />
              <Area
                type="monotone"
                dataKey="maxWeight"
                stroke="#FF6A3D"
                strokeWidth={2.5}
                fill="url(#primaryArea)"
                dot={{ fill: '#FF6A3D', strokeWidth: 0, r: 4 }}
                activeDot={{ fill: '#FF6A3D', stroke: '#FFB388', strokeWidth: 3, r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {history.length === 1 && (
        <div className="card text-center py-6">
          <p className="body-sm">Log at least 2 sessions to see your progress chart</p>
        </div>
      )}

      {/* Session history */}
      {history.length > 0 && (
        <div className="pb-2">
          <p className="label mb-3">Session history</p>
          <div className="flex flex-col gap-2">
            {[...history].reverse().map((entry, i) => (
              <div key={i} className="card-flat">
                <div className="flex items-center justify-between mb-2">
                  <p className="body-md font-semibold tabular">{formatDate(entry.date)}</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-display font-bold text-lg tabular tracking-tightish text-primary">
                      {entry.maxWeight}
                    </span>
                    <span className="caption">kg max</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {entry.sets.map((s, j) => (
                    <span key={j} className="chip">
                      <span className="tabular text-text-primary font-semibold">{s.weight || '—'}</span>
                      {s.weight ? <span className="text-text-tertiary">kg</span> : null}
                      <span className="text-text-tertiary">×</span>
                      <span className="tabular text-text-primary font-semibold">{s.reps || '—'}</span>
                    </span>
                  ))}
                </div>
                <p className="caption mt-2 tabular">Total volume <span className="text-text-secondary">{entry.totalVolume} kg</span></p>
              </div>
            ))}
          </div>
        </div>
      )}

      {history.length === 0 && exercise && (
        <div className="card text-center py-10">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-surface-3 border border-border flex items-center justify-center text-2xl">
            📊
          </div>
          <p className="font-display font-semibold text-base text-text-primary">No data yet for {exercise.name}</p>
          <p className="body-sm mt-1">Log a workout to see progress</p>
        </div>
      )}
    </div>
  )
}

function Header({ onBack, eyebrow, title }) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onBack}
        className="btn-icon flex-shrink-0"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="m15 6-6 6 6 6" />
        </svg>
      </button>
      <div className="min-w-0">
        <p className="caption truncate">{eyebrow}</p>
        <h1 className="font-display font-bold text-[28px] leading-[1.1] tracking-tighter2 text-text-primary">
          {title}
        </h1>
      </div>
    </div>
  )
}

function StatTile({ value, unit, label, highlight, tone }) {
  const color = tone === 'danger'
    ? 'text-danger'
    : tone === 'success'
    ? 'text-success'
    : highlight
    ? 'text-primary'
    : 'text-text-primary'

  return (
    <div className={`card text-center py-4 px-2 ${highlight ? 'border-primary/30 bg-primary-soft' : ''}`}>
      <p className="leading-none">
        <span className={`font-display font-bold text-[28px] tabular tracking-tighter2 ${color}`}>{value}</span>
        {unit && <span className="font-body font-semibold text-base text-text-secondary ml-0.5">{unit}</span>}
      </p>
      <p className="label mt-2">{label}</p>
    </div>
  )
}

function hexToBg(hex, alpha = 0.12) {
  if (!hex) return `rgba(110,168,255,${alpha})`
  const m = hex.replace('#', '')
  const v = m.length === 3
    ? m.split('').map(c => c + c).join('')
    : m
  const r = parseInt(v.slice(0, 2), 16)
  const g = parseInt(v.slice(2, 4), 16)
  const b = parseInt(v.slice(4, 6), 16)
  if ([r, g, b].some(n => Number.isNaN(n))) return `rgba(110,168,255,${alpha})`
  return `rgba(${r},${g},${b},${alpha})`
}
