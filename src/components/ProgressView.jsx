import React, { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { useUser } from '../context/UserContext.jsx'
import { usePlan } from '../context/PlanContext.jsx'
import { getExerciseHistory, formatDate } from '../utils/storage.js'

export default function ProgressView({ onBack }) {
  const { currentUser } = useUser()
  const { activePlan } = usePlan()

  const [selectedSectionId, setSelectedSectionId] = useState(activePlan?.sections[0]?.id)
  const [selectedExerciseId, setSelectedExerciseId] = useState(null)

  if (!activePlan || activePlan.sections.length === 0) {
    return (
      <div className="flex flex-col gap-5 slide-up pb-8">
        <div className="flex items-center gap-4 pt-2">
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface2 border border-border text-muted active:scale-95 transition-all flex-shrink-0"
          >
            ‹
          </button>
          <div>
            <p className="label mb-0.5">Progress Tracker</p>
            <h1 className="font-display font-black text-3xl uppercase tracking-tight text-text">
              Analytics
            </h1>
          </div>
        </div>
        <div className="card text-center py-10">
          <p className="text-4xl mb-3">📊</p>
          <p className="text-text font-display font-bold text-xl uppercase">Nothing to show</p>
          <p className="text-muted text-sm mt-1">Add sections and exercises to your plan first</p>
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
  }, [exerciseId, currentUser, activePlan])

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
      <div className="bg-surface2 border border-border rounded-lg p-3 shadow-xl">
        <p className="text-muted text-xs mb-1">{label}</p>
        <p className="text-accent font-display font-bold text-lg">{payload[0].value}kg</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 slide-up pb-8">
      <div className="flex items-center gap-4 pt-2">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface2 border border-border text-muted active:scale-95 transition-all flex-shrink-0"
        >
          ‹
        </button>
        <div className="min-w-0">
          <p className="label mb-0.5 truncate">{activePlan.name}</p>
          <h1 className="font-display font-black text-3xl uppercase tracking-tight text-text">
            Progress
          </h1>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 no-scrollbar">
        {activePlan.sections.map(section => (
          <button
            key={section.id}
            onClick={() => { setSelectedSectionId(section.id); setSelectedExerciseId(null) }}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-display font-bold uppercase tracking-wide transition-all active:scale-95 ${
              selectedSection?.id === section.id
                ? 'text-base'
                : 'bg-surface2 border border-border text-muted'
            }`}
            style={selectedSection?.id === section.id ? { backgroundColor: section.color, color: '#0a0a0a' } : {}}
          >
            {section.icon} {section.name}
          </button>
        ))}
      </div>

      {selectedSection && (
        <div className="flex flex-col gap-2">
          <p className="label">Exercise</p>
          {selectedSection.exercises.length === 0 ? (
            <div className="card text-center py-6">
              <p className="text-muted text-sm">This section has no exercises</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {selectedSection.exercises.map(ex => {
                const hist = currentUser
                  ? getExerciseHistory(currentUser.id, activePlan.id, ex.id)
                  : []
                const hasData = hist.length > 0
                return (
                  <button
                    key={ex.id}
                    onClick={() => setSelectedExerciseId(ex.id)}
                    className={`card text-left py-3 px-3 transition-all active:scale-95 ${
                      exerciseId === ex.id ? 'border-accent/50 bg-accent/5' : ''
                    }`}
                  >
                    <p className={`font-body font-semibold text-sm leading-tight ${exerciseId === ex.id ? 'text-accent' : 'text-text'}`}>
                      {ex.name}
                    </p>
                    <p className="text-muted text-xs mt-1">
                      {hasData ? `${hist.length} session${hist.length !== 1 ? 's' : ''}` : 'No data'}
                    </p>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {stats && exercise && (
        <div className="flex flex-col gap-3">
          <p className="label">{exercise.name} — Stats</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="card text-center">
              <p className="font-display font-black text-3xl text-accent">{stats.max}kg</p>
              <p className="label mt-1">All-time max</p>
            </div>
            <div className="card text-center">
              <p className={`font-display font-black text-3xl ${Number(stats.improvement) >= 0 ? 'text-accent' : 'text-red-400'}`}>
                {Number(stats.improvement) >= 0 ? '+' : ''}{stats.improvement}%
              </p>
              <p className="label mt-1">Improvement</p>
            </div>
            <div className="card text-center">
              <p className="font-display font-black text-3xl text-text">{stats.last}kg</p>
              <p className="label mt-1">Last session</p>
            </div>
            <div className="card text-center">
              <p className="font-display font-black text-3xl text-text">{stats.sessions}</p>
              <p className="label mt-1">Sessions</p>
            </div>
          </div>
        </div>
      )}

      {history.length >= 2 && (
        <div className="card">
          <p className="label mb-4">Weight Progression</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={history} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis
                dataKey="dateLabel"
                tick={{ fill: '#666', fontSize: 10, fontFamily: 'Barlow' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fill: '#666', fontSize: 10, fontFamily: 'Barlow' }}
                tickLine={false}
                axisLine={false}
                unit="kg"
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="maxWeight"
                stroke="#c8ff00"
                strokeWidth={2.5}
                dot={{ fill: '#c8ff00', strokeWidth: 0, r: 4 }}
                activeDot={{ fill: '#c8ff00', strokeWidth: 0, r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {history.length === 1 && (
        <div className="card text-center py-6">
          <p className="text-muted text-sm">Log at least 2 sessions to see your progress chart</p>
        </div>
      )}

      {history.length > 0 && (
        <div>
          <p className="label mb-3">Session History</p>
          <div className="flex flex-col gap-2">
            {[...history].reverse().map((entry, i) => (
              <div key={i} className="card">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-text font-body font-medium text-sm">{formatDate(entry.date)}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-accent font-display font-bold">
                      {entry.maxWeight}kg
                    </span>
                    <span className="text-muted text-xs">max</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {entry.sets.map((s, j) => (
                    <span key={j} className="bg-surface2 rounded px-2 py-0.5 text-xs text-muted font-body">
                      {s.weight || '—'}{s.weight ? 'kg' : ''} × {s.reps || '—'}
                    </span>
                  ))}
                </div>
                <p className="text-muted text-xs mt-2">Total volume: {entry.totalVolume}kg</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {history.length === 0 && exercise && (
        <div className="card text-center py-8">
          <p className="text-3xl mb-2">📊</p>
          <p className="text-text font-body font-medium">No data yet for {exercise.name}</p>
          <p className="text-muted text-sm mt-1">Log a workout to see progress</p>
        </div>
      )}
    </div>
  )
}
