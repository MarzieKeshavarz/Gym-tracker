import { DEFAULT_PLAN } from '../data/defaultPlan.js'

const PLAN_KEY = 'gymlog_plan'
const LOGS_KEY = 'gymlog_logs'

// ─── Plan ────────────────────────────────────────────────────────────────────

export function getPlan() {
  try {
    const raw = localStorage.getItem(PLAN_KEY)
    if (!raw) return DEFAULT_PLAN
    return JSON.parse(raw)
  } catch {
    return DEFAULT_PLAN
  }
}

export function savePlan(plan) {
  localStorage.setItem(PLAN_KEY, JSON.stringify(plan))
}

export function resetPlan() {
  localStorage.setItem(PLAN_KEY, JSON.stringify(DEFAULT_PLAN))
}

// ─── Logs ────────────────────────────────────────────────────────────────────

export function getLogs() {
  try {
    const raw = localStorage.getItem(LOGS_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export function saveLog(log) {
  const logs = getLogs()
  logs.push(log)
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs))
}

export function updateLog(updatedLog) {
  const logs = getLogs()
  const idx = logs.findIndex(l => l.id === updatedLog.id)
  if (idx !== -1) {
    logs[idx] = updatedLog
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs))
  }
}

export function deleteLog(logId) {
  const logs = getLogs().filter(l => l.id !== logId)
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs))
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Get the last workout log for a given day (before today or on same day session)
 */
export function getLastLogForDay(dayId) {
  const logs = getLogs()
    .filter(l => l.dayId === dayId)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
  return logs[0] || null
}

/**
 * Get the last workout log for a specific exercise (across all sessions)
 */
export function getLastLogForExercise(exerciseId) {
  const logs = getLogs()
  let lastEntry = null
  let lastDate = null

  for (const log of logs) {
    const ex = log.exercises?.find(e => e.exerciseId === exerciseId)
    if (ex) {
      const d = new Date(log.date)
      if (!lastDate || d > lastDate) {
        lastDate = d
        lastEntry = { sets: ex.sets, date: log.date }
      }
    }
  }
  return lastEntry
}

/**
 * Get all history entries for an exercise (for progress chart)
 */
export function getExerciseHistory(exerciseId) {
  const logs = getLogs()
  const history = []

  for (const log of logs) {
    const ex = log.exercises?.find(e => e.exerciseId === exerciseId)
    if (ex && ex.sets?.length > 0) {
      // Use max weight from that session as the data point
      const weights = ex.sets.map(s => Number(s.weight)).filter(w => w > 0)
      const maxWeight = weights.length ? Math.max(...weights) : 0
      const avgWeight = weights.length ? weights.reduce((a, b) => a + b, 0) / weights.length : 0
      const totalVolume = ex.sets.reduce((sum, s) => sum + (Number(s.weight) || 0) * (Number(s.reps) || 0), 0)

      history.push({
        date: log.date,
        dateLabel: new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        maxWeight: Math.round(maxWeight * 10) / 10,
        avgWeight: Math.round(avgWeight * 10) / 10,
        totalVolume: Math.round(totalVolume),
        sets: ex.sets,
      })
    }
  }

  return history.sort((a, b) => new Date(a.date) - new Date(b.date))
}

/**
 * Get stats for dashboard
 */
export function getDashboardStats() {
  const logs = getLogs()
  const now = new Date()

  // Total workouts this week (Mon–Sun)
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  monday.setHours(0, 0, 0, 0)

  const thisWeek = logs.filter(l => new Date(l.date) >= monday)

  // Last workout date
  const sorted = [...logs].sort((a, b) => new Date(b.date) - new Date(a.date))
  const lastLog = sorted[0]

  // Streak (consecutive days with a workout)
  const uniqueDays = [...new Set(logs.map(l => l.date.slice(0, 10)))].sort().reverse()
  let streak = 0
  let check = new Date()
  check.setHours(0, 0, 0, 0)

  for (const day of uniqueDays) {
    const d = new Date(day)
    const diff = Math.floor((check - d) / 86400000)
    if (diff <= 1) {
      streak++
      check = d
    } else break
  }

  return {
    totalWorkouts: logs.length,
    thisWeek: thisWeek.length,
    lastWorkout: lastLog ? lastLog.date : null,
    streak,
  }
}

/**
 * Generate a unique ID without external lib
 */
export function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

/**
 * Format date nicely
 */
export function formatDate(isoString) {
  if (!isoString) return '—'
  const d = new Date(isoString)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

/**
 * Format time
 */
export function formatTime(isoString) {
  if (!isoString) return ''
  return new Date(isoString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}
