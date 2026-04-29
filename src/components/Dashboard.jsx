import React, { useMemo } from 'react'
import { useUser } from '../context/UserContext.jsx'
import { usePlan } from '../context/PlanContext.jsx'
import { getDashboardStats, getLogs, formatDate, formatTime, formatDateRange } from '../utils/storage.js'

export default function Dashboard({
  onSelectSection,
  onGoToProgress,
  onGoToManagePlans,
  onSwitchUser,
}) {
  const { currentUser } = useUser()
  const { activePlan } = usePlan()

  const stats = useMemo(
    () => activePlan ? getDashboardStats(currentUser?.id, activePlan.id) : null,
    [currentUser, activePlan]
  )
  const logs = useMemo(
    () => activePlan ? getLogs(currentUser?.id, activePlan.id) : [],
    [currentUser, activePlan]
  )

  const lastPerSection = useMemo(() => {
    if (!activePlan) return {}
    const map = {}
    for (const section of activePlan.sections) {
      const sectionLogs = logs
        .filter(l => l.sectionId === section.id)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
      map[section.id] = sectionLogs[0] || null
    }
    return map
  }, [activePlan, logs])

  const recentLogs = useMemo(() => {
    return [...logs]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5)
  }, [logs])

  if (!activePlan) {
    // Should not be rendered without an active plan, but render a safe fallback.
    return null
  }

  return (
    <div className="flex flex-col gap-6 slide-up">
      {/* Header */}
      <div className="flex items-start justify-between pt-2 gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {currentUser && (
            <button
              onClick={onSwitchUser}
              className="w-12 h-12 flex items-center justify-center rounded-xl bg-surface2 border border-border text-2xl active:scale-95 transition-all flex-shrink-0"
              title="Switch profile"
            >
              {currentUser.avatar}
            </button>
          )}
          <div className="min-w-0">
            <p className="label mb-1 truncate">
              {currentUser ? `Hi, ${currentUser.name}` : 'Welcome back'}
            </p>
            <h1 className="font-display font-black text-4xl uppercase tracking-tight text-text leading-none">
              Gym<span className="text-accent">Log</span>
            </h1>
          </div>
        </div>
        <button
          onClick={onGoToManagePlans}
          className="mt-1 w-10 h-10 flex items-center justify-center rounded-lg bg-surface2 border border-border text-muted active:scale-95 transition-all flex-shrink-0"
          title="Manage plans"
        >
          <span className="text-lg">⚙️</span>
        </button>
      </div>

      {/* Active plan banner */}
      <button
        onClick={onGoToManagePlans}
        className="card flex items-center gap-3 active:scale-[0.99] transition-all text-left"
      >
        <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center flex-shrink-0">
          <span className="text-base">📋</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="label">Active plan</p>
          <p className="text-text font-display font-bold text-lg uppercase tracking-wide truncate">
            {activePlan.name}
          </p>
          <p className="text-muted text-xs mt-0.5">
            {formatDateRange(activePlan.startDate, activePlan.endDate)}
          </p>
        </div>
        <span className="text-muted text-lg flex-shrink-0">›</span>
      </button>

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

      {/* Sections */}
      <div>
        <p className="label mb-3">Start Workout</p>
        {activePlan.sections.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-3xl mb-2">📝</p>
            <p className="text-text font-body font-medium">No sections in this plan</p>
            <p className="text-muted text-sm mt-1">Edit the plan to add sections and exercises</p>
            <button
              onClick={onGoToManagePlans}
              className="btn-primary mt-4 px-5 py-2 text-sm"
            >
              Edit Plan
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {activePlan.sections.map((section, i) => (
              <SectionCard
                key={section.id}
                section={section}
                lastLog={lastPerSection[section.id]}
                index={i}
                onClick={() => onSelectSection(section)}
              />
            ))}
          </div>
        )}
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
              const section = activePlan.sections.find(s => s.id === log.sectionId)
              return (
                <div key={log.id} className="card flex items-center gap-3 py-3">
                  <span className="text-xl">{section?.icon || '🏋️'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-text font-body font-medium text-sm truncate">
                      {section?.name || log.sectionName || log.sectionId}
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

      {recentLogs.length === 0 && activePlan.sections.length > 0 && (
        <div className="card text-center py-10">
          <p className="text-4xl mb-3">🏋️</p>
          <p className="text-text font-display font-bold text-xl uppercase">Ready to lift?</p>
          <p className="text-muted text-sm mt-1">Tap a section above to get started</p>
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

function SectionCard({ section, lastLog, onClick, index }) {
  const delay = `${index * 50}ms`

  return (
    <button
      onClick={onClick}
      className="card text-left flex items-center gap-4 active:scale-[0.98] transition-all w-full"
      style={{ animationDelay: delay }}
    >
      <div
        className="w-1 self-stretch rounded-full flex-shrink-0"
        style={{ backgroundColor: section.color }}
      />
      <span className="text-3xl">{section.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-display font-bold text-xl uppercase text-text tracking-wide">
          {section.name}
        </p>
        <p className="text-muted text-xs mt-0.5">
          {section.exercises.length} exercises
          {lastLog && ` · Last: ${formatDate(lastLog.date)}`}
        </p>
      </div>
      <span className="text-muted text-lg flex-shrink-0">›</span>
    </button>
  )
}
