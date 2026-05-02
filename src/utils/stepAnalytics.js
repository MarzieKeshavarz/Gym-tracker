import { getStepLogs, getStepLogForDate } from './storage.js'

// Local-date 'YYYY-MM-DD' for a JS Date, avoiding UTC-offset off-by-ones from
// toISOString() which would shift the day backwards in negative timezones.
export function localDateKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayKey() {
  return localDateKey(new Date())
}

function dateAtKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

function shiftKey(key, deltaDays) {
  const d = dateAtKey(key)
  d.setDate(d.getDate() + deltaDays)
  return localDateKey(d)
}

function effectiveTarget(stepLog, currentTarget) {
  // Historical days use the target snapshot from when they were logged so a
  // later goal change doesn't retroactively rewrite "did I hit my goal?".
  if (!stepLog) return currentTarget || 0
  return stepLog.targetAtTime ?? currentTarget ?? 0
}

export function getTodayStepProgress(userId, planId, currentTarget) {
  const log = userId && planId ? getStepLogForDate(userId, planId, todayKey()) : null
  const steps = log?.steps || 0
  const target = currentTarget || 0
  const percent = target > 0 ? Math.min(100, Math.round((steps / target) * 100)) : 0
  const remaining = target > 0 ? Math.max(0, target - steps) : 0
  return { steps, target, percent, remaining, hasTarget: target > 0, log }
}

export function getWeeklySteps(userId, planId, currentTarget) {
  const today = todayKey()
  const days = []
  for (let i = 6; i >= 0; i--) {
    const key = shiftKey(today, -i)
    const d = dateAtKey(key)
    days.push({
      date: key,
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      steps: 0,
      target: currentTarget || 0,
      hit: false,
    })
  }
  if (!userId || !planId) return days

  const byDate = new Map(days.map(d => [d.date, d]))
  for (const log of getStepLogs(userId, planId)) {
    const bucket = byDate.get(log.date)
    if (!bucket) continue
    bucket.steps = log.steps || 0
    bucket.target = effectiveTarget(log, currentTarget)
    bucket.hit = bucket.target > 0 && bucket.steps >= bucket.target
  }
  return days
}

export function getStepStats(userId, planId, currentTarget) {
  const all = userId && planId ? getStepLogs(userId, planId) : []
  const week = getWeeklySteps(userId, planId, currentTarget)

  const weeklyTotal = week.reduce((sum, d) => sum + d.steps, 0)
  const weeklyHits = week.filter(d => d.hit).length
  const weeklyCompletionRate = Math.round((weeklyHits / 7) * 100)

  const loggedDays = all.filter(s => (s.steps || 0) > 0)
  const avgDaily = loggedDays.length
    ? Math.round(loggedDays.reduce((s, l) => s + l.steps, 0) / loggedDays.length)
    : 0

  let highestDay = null
  for (const l of loggedDays) {
    if (!highestDay || l.steps > highestDay.steps) {
      highestDay = { date: l.date, steps: l.steps }
    }
  }

  // Streak: consecutive days back from today (or yesterday if today empty)
  // where steps >= effectiveTarget for that day. Days with no log break it.
  const byDate = new Map(all.map(l => [l.date, l]))
  let cursor = todayKey()
  const todayLog = byDate.get(cursor)
  if (!todayLog) cursor = shiftKey(cursor, -1)

  let currentStreak = 0
  for (let safety = 0; safety < 3650; safety++) {
    const log = byDate.get(cursor)
    if (!log) break
    const t = effectiveTarget(log, currentTarget)
    if (t <= 0 || (log.steps || 0) < t) break
    currentStreak++
    cursor = shiftKey(cursor, -1)
  }

  return {
    avgDaily,
    weeklyTotal,
    weeklyCompletionRate,
    highestDay,
    currentStreak,
    weeklySeries: week,
    hasAnyLogs: loggedDays.length > 0,
  }
}

export function getStepHistory(userId, planId) {
  if (!userId || !planId) return []
  return [...getStepLogs(userId, planId)]
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}

export function isFutureDate(dateKey) {
  return dateKey > todayKey()
}
