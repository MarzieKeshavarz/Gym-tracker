import React, { useMemo, useState } from 'react'
import { useUser } from '../context/UserContext.jsx'
import { usePlan } from '../context/PlanContext.jsx'
import { useLogs } from '../context/LogContext.jsx'
import {
  getDashboardStats, formatDate, formatTime, formatDateRange,
  getCalorieStats,
} from '../utils/storage.js'
import { useCountUp } from '../utils/useCountUp.js'
import WeeklyCalorieChart from './WeeklyCalorieChart.jsx'
import StepWidget from './steps/StepWidget.jsx'
import BodyWidget from './body/BodyWidget.jsx'

export default function Dashboard({
  onSelectSection,
  onGoToProgress,
  onGoToManagePlans,
  onSwitchUser,
  onEditProfile,
  onSelectSession,
}) {
  const { currentUser } = useUser()
  const { activePlan } = usePlan()
  const { logs, version } = useLogs()
  const [recentExpanded, setRecentExpanded] = useState(false)

  const stats = useMemo(
    () => activePlan ? getDashboardStats(currentUser?.id, activePlan.id) : null,
    [currentUser, activePlan, version]
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

  const calorieStats = useMemo(
    () => activePlan ? getCalorieStats(currentUser?.id, activePlan.id) : null,
    [currentUser, activePlan, version]
  )
  const showCalories = !!calorieStats?.highest

  if (!activePlan) return null

  const greeting = getGreeting()

  return (
    <div className="flex flex-col gap-6 slide-up pt-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {currentUser && (
            <button
              onClick={onEditProfile}
              className="w-12 h-12 flex items-center justify-center rounded-2xl bg-surface-2 border border-border text-2xl active:scale-95 transition-all flex-shrink-0 shadow-card"
              title="Edit profile"
            >
              {currentUser.avatar}
            </button>
          )}
          <div className="min-w-0">
            <p className="caption truncate">
              {greeting}{currentUser ? `, ${currentUser.name}` : ''}
            </p>
            <h1 className="page-title">
              Gym<span className="gradient-text">Log</span>
            </h1>
          </div>
        </div>
        <button
          onClick={onGoToManagePlans}
          className="btn-icon flex-shrink-0 mt-1"
          title="Manage plans"
        >
          <SettingsIcon />
        </button>
      </div>

      {/* Active plan banner */}
      <button
        onClick={onGoToManagePlans}
        className="card lift press-pop flex items-center gap-3 text-left overflow-hidden"
      >
        <div className="w-11 h-11 rounded-xl bg-primary-soft border border-primary/25 flex items-center justify-center flex-shrink-0">
          <BookIcon />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="caption">Active plan</p>
            <span className="active-dot" />
          </div>
          <p className="font-display font-bold text-[17px] tracking-tightish text-text-primary truncate mt-0.5">
            {activePlan.name}
          </p>
          <p className="caption mt-0.5">
            {formatDateRange(activePlan.startDate, activePlan.endDate)}
          </p>
        </div>
        <ChevronRight className="text-text-tertiary flex-shrink-0" />
      </button>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard value={stats.thisWeek} label="This Week" highlight />
        <StatCard value={stats.totalWorkouts} label="Total" />
        <StatCard
          value={stats.streak > 0 ? stats.streak : 0}
          suffix={stats.streak > 0 ? <span className="flame">🔥</span> : null}
          label="Streak"
        />
      </div>

      {/* Calorie analytics — only when at least one session has calories */}
      {showCalories && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-3">
            <StatCard value={calorieStats.weeklyTotal} label="Weekly kcal" highlight />
            <StatCard value={calorieStats.avgPerSession} label="Avg / Session" />
            <StatCard value={calorieStats.highest.calories} label="Top Burn" />
          </div>
          <WeeklyCalorieChart data={calorieStats.weeklySeries} />
        </div>
      )}

      {/* Daily steps — wellness metric, independent of workouts */}
      <StepWidget onSetGoal={onGoToManagePlans} />

      {/* Body metrics — personal transformation tracker, independent of workouts */}
      <BodyWidget onOpenProgress={onGoToProgress} />

      {/* Last workout */}
      {stats.lastWorkout && (
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-3 border border-border flex items-center justify-center flex-shrink-0">
            <ClockIcon />
          </div>
          <div className="flex-1 min-w-0">
            <p className="caption">Last session</p>
            <p className="body-md font-semibold tabular">
              {formatDate(stats.lastWorkout)} <span className="text-text-tertiary">·</span> {formatTime(stats.lastWorkout)}
            </p>
          </div>
        </div>
      )}

      {/* Sections */}
      <div>
        <div className="flex items-center justify-between mb-3 px-0.5">
          <p className="label">Start workout</p>
          <p className="caption">{activePlan.sections.length} sections</p>
        </div>
        {activePlan.sections.length === 0 ? (
          <div className="card text-center py-10">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-surface-3 border border-border flex items-center justify-center text-2xl">
              📝
            </div>
            <p className="font-display font-semibold text-base text-text-primary">No sections in this plan</p>
            <p className="body-sm mt-1">Edit the plan to add sections and exercises</p>
            <button
              onClick={onGoToManagePlans}
              className="btn-primary mt-5"
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

      {/* Recent activity — collapsed by default to keep the dashboard clean */}
      {recentLogs.length > 0 && (
        <div>
          <button
            onClick={() => setRecentExpanded(v => !v)}
            className="w-full flex items-center gap-2 mb-3 px-0.5 text-left active:opacity-80 transition-opacity"
            aria-expanded={recentExpanded}
          >
            <p className="label flex-1">Recent sessions</p>
            <span className="caption tabular text-text-tertiary">
              {recentLogs.length} {recentLogs.length === 1 ? 'session' : 'sessions'}
            </span>
            <svg
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className={`w-4 h-4 text-text-tertiary transition-transform ${recentExpanded ? 'rotate-180' : ''}`}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {recentExpanded && (
            <div className="flex flex-col gap-2 fade-in">
              {recentLogs.map(log => {
                const section = activePlan.sections.find(s => s.id === log.sectionId)
                const wasEdited = log.updatedAt && log.date &&
                  log.updatedAt - new Date(log.date).getTime() > 60_000
                return (
                  <button
                    key={log.id}
                    onClick={() => onSelectSession?.(log)}
                    className="card-flat flex items-center gap-3 text-left active:scale-[0.99] transition-all hover:border-border-strong"
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                      style={{
                        backgroundColor: hexToBg(section?.color || '#6EA8FF'),
                        border: `1px solid ${hexToBg(section?.color || '#6EA8FF', 0.25)}`,
                      }}
                    >
                      {section?.icon || '🏋️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="body-md font-semibold truncate flex items-center gap-1.5">
                        {section?.name || log.sectionName || log.sectionId}
                        {wasEdited && (
                          <span className="caption text-text-tertiary normal-case">· edited</span>
                        )}
                      </p>
                      <p className="caption tabular">
                        {formatDate(log.date)} · {log.exercises?.length || 0} exercises
                      </p>
                    </div>
                    <span className="caption tabular">{formatTime(log.date)}</span>
                  </button>
                )
              })}
              <button
                onClick={onGoToProgress}
                className="self-end text-primary text-xs font-body font-semibold uppercase tracking-label active:scale-95 transition-all mt-1"
              >
                See all in Progress →
              </button>
            </div>
          )}
        </div>
      )}

      {recentLogs.length === 0 && activePlan.sections.length > 0 && (
        <div className="card text-center py-10">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-primary-soft border border-primary/20 flex items-center justify-center text-3xl">
            🏋️
          </div>
          <p className="section-title">Ready to lift?</p>
          <p className="body-sm mt-1.5">Tap a section above to get started</p>
        </div>
      )}
    </div>
  )
}

/* ── Sub-components ────────────────────────────────────────────────────── */

function StatCard({ value, suffix, label, highlight }) {
  const display = useCountUp(typeof value === 'number' ? value : 0)
  const shown = typeof value === 'number' ? display : value
  return (
    <div
      className={`card lift text-center py-4 px-2 overflow-hidden ${
        highlight ? 'border-primary/30 bg-primary-soft shine-sweep' : ''
      }`}
    >
      <p className={`stat-value ${highlight ? 'text-primary' : 'text-text-primary'}`}>
        {shown}{suffix && <span className="ml-1 text-2xl align-middle">{suffix}</span>}
      </p>
      <p className="label mt-1.5">{label}</p>
    </div>
  )
}

function SectionCard({ section, lastLog, onClick, index }) {
  const delay = `${index * 60}ms`
  return (
    <button
      onClick={onClick}
      className="card lift press-pop text-left flex items-center gap-3 w-full slide-up group"
      style={{ animationDelay: delay }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-4deg] group-active:scale-105"
        style={{
          backgroundColor: hexToBg(section.color, 0.14),
          border: `1px solid ${hexToBg(section.color, 0.3)}`,
          boxShadow: `0 0 24px -10px ${hexToBg(section.color, 0.6)}`,
        }}
      >
        {section.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display font-bold text-[17px] tracking-tightish text-text-primary truncate">
          {section.name}
        </p>
        <p className="caption mt-0.5 tabular">
          {section.exercises.length} exercises
          {lastLog && ` · Last ${formatDate(lastLog.date)}`}
        </p>
      </div>
      <ChevronRight className="text-text-tertiary flex-shrink-0 transition-transform group-hover:translate-x-0.5" />
    </button>
  )
}

/* ── Icons ─────────────────────────────────────────────────────────────── */

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-primary">
      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5a2.5 2.5 0 0 0 0 5H20" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-text-secondary">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

function ChevronRight({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-5 h-5 ${className}`}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  )
}

/* ── Helpers ───────────────────────────────────────────────────────────── */

function getGreeting() {
  const h = new Date().getHours()
  if (h < 5) return 'Late night'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  if (h < 21) return 'Good evening'
  return 'Good night'
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
