import React, { useMemo } from 'react'
import { getDashboardStats, getLogs, formatDate, formatTime } from '../utils/storage.js'

export default function Dashboard({ plan, onSelectDay, onGoToProgress, onGoToSetup }) {
  const stats = useMemo(() => getDashboardStats(), [])
  const logs = useMemo(() => getLogs(), [])

  // Get last log per day for quick display
  const lastPerDay = useMemo(() => {
    const map = {}
    for (const day of plan.days) {
      const dayLogs = logs
        .filter(l => l.dayId === day.id)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
      map[day.id] = dayLogs[0] || null
    }
    return map
  }, [plan, logs])

  const recentLogs = useMemo(() => {
    return [...logs]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5)
  }, [logs])

  return (
    <div className="flex flex-col gap-6 slide-up">
      {/* Header */}
      <div className="flex items-start justify-between pt-2">
        <div>
          <p className="label mb-1">Welcome back</p>
          <h1 className="font-display font-black text-5xl uppercase tracking-tight text-text">
            Gym<span className="text-accent">Log</span>
          </h1>
        </div>
        <button
          onClick={onGoToSetup}
          className="mt-2 w-10 h-10 flex items-center justify-center rounded-lg bg-surface2 border border-border text-muted active:scale-95 transition-all"
          title="Edit plan"
        >
          <span className="text-lg">⚙️</span>
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard value={stats.thisWeek} label="This Week" accent />
        <StatCard value={stats.totalWorkouts} label="Total" />
        <StatCard value={stats.streak > 0 ? `${stats.streak}🔥` : '0'} label="Streak" />
      </div>

      {/* Last workout */}
      {stats.lastWorkout && (
        <div className="card flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-sm">📅</div>
          <div>
            <p className="label">Last session</p>
            <p className="text-text font-body font-medium">
              {formatDate(stats.lastWorkout)} · {formatTime(stats.lastWorkout)}
            </p>
          </div>
        </div>
      )}

      {/* Workout days */}
      <div>
        <p className="label mb-3">Start Workout</p>
        <div className="grid grid-cols-1 gap-3">
          {plan.days.map((day, i) => {
            const last = lastPerDay[day.id]
            return (
              <DayCard
                key={day.id}
                day={day}
                lastLog={last}
                index={i}
                onClick={() => onSelectDay(day)}
              />
            )
          })}
        </div>
      </div>

      {/* Recent activity */}
      {recentLogs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="label">Recent Sessions</p>
            <button
              onClick={onGoToProgress}
              className="text-accent text-xs font-body font-medium uppercase tracking-wider"
            >
              Progress →
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {recentLogs.map(log => {
              const day = plan.days.find(d => d.id === log.dayId)
              return (
                <div key={log.id} className="card flex items-center gap-3 py-3">
                  <span className="text-xl">{day?.icon || '🏋️'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-text font-body font-medium text-sm truncate">
                      {day?.name || log.dayId}
                    </p>
                    <p className="text-muted text-xs">
                      {formatDate(log.date)} · {log.exercises?.length || 0} exercises
                    </p>
                  </div>
                  <span className="text-muted text-xs">{formatTime(log.date)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {recentLogs.length === 0 && (
        <div className="card text-center py-10">
          <p className="text-4xl mb-3">🏋️</p>
          <p className="text-text font-display font-bold text-xl uppercase">Ready to lift?</p>
          <p className="text-muted text-sm mt-1">Tap a workout day above to get started</p>
        </div>
      )}
    </div>
  )
}

function StatCard({ value, label, accent }) {
  return (
    <div className={`card text-center py-4 ${accent ? 'border-accent/30 bg-accent/5' : ''}`}>
      <p className={`font-display font-black text-3xl ${accent ? 'text-accent' : 'text-text'}`}>
        {value}
      </p>
      <p className="label mt-1">{label}</p>
    </div>
  )
}

function DayCard({ day, lastLog, onClick, index }) {
  const delay = `${index * 50}ms`

  return (
    <button
      onClick={onClick}
      className="card text-left flex items-center gap-4 active:scale-[0.98] transition-all w-full"
      style={{ animationDelay: delay }}
    >
      {/* Color strip */}
      <div
        className="w-1 self-stretch rounded-full flex-shrink-0"
        style={{ backgroundColor: day.color }}
      />

      {/* Icon */}
      <span className="text-3xl">{day.icon}</span>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-display font-bold text-xl uppercase text-text tracking-wide">
          {day.name}
        </p>
        <p className="text-muted text-xs mt-0.5">
          {day.exercises.length} exercises
          {lastLog && ` · Last: ${formatDate(lastLog.date)}`}
        </p>
      </div>

      {/* Arrow */}
      <span className="text-muted text-lg flex-shrink-0">›</span>
    </button>
  )
}
