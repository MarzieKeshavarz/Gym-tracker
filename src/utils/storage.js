import { DEFAULT_PLAN_TEMPLATE } from '../data/defaultPlan.js'

const USERS_KEY            = 'gymlog_users'
const PLANS_KEY            = 'gymlog_plans'
const LOGS_KEY             = 'gymlog_logs'
const CURRENT_USER_KEY     = 'gymlog_currentUserId'

// Legacy keys (pre-multi-user / multi-plan)
const LEGACY_PLAN_KEY      = 'gymlog_plan'
const MIGRATION_FLAG_KEY   = 'gymlog_migrated_v2'

// ─── Generic helpers ─────────────────────────────────────────────────────────

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

// ─── Migration ───────────────────────────────────────────────────────────────

/**
 * One-shot migration from the single-user / single-plan schema to the new
 * multi-user / multi-plan schema. Idempotent — safe to call on every load.
 */
export function migrateLegacyData() {
  if (localStorage.getItem(MIGRATION_FLAG_KEY)) return

  const hasLegacyPlan = !!localStorage.getItem(LEGACY_PLAN_KEY)
  const legacyLogs    = readJSON(LOGS_KEY, [])
  const hasLegacyLogs = legacyLogs.length > 0 && legacyLogs[0]?.dayId !== undefined

  if (!hasLegacyPlan && !hasLegacyLogs) {
    localStorage.setItem(MIGRATION_FLAG_KEY, '1')
    return
  }

  const legacyPlan = readJSON(LEGACY_PLAN_KEY, null)
  const sections = (legacyPlan?.days || DEFAULT_PLAN_TEMPLATE.sections).map(d => ({
    id: d.id,
    name: d.name,
    icon: d.icon || '🏋️',
    color: d.color || '#c8ff00',
    exercises: d.exercises || [],
  }))

  const user = { id: genId(), name: 'You', avatar: '🏋️' }
  const plan = {
    id: genId(),
    userId: user.id,
    name: 'My Plan',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: null,
    isActive: true,
    sections,
  }

  const migratedLogs = legacyLogs.map(l => ({
    ...l,
    userId: user.id,
    planId: plan.id,
    sectionId: l.sectionId ?? l.dayId,
    sectionName: l.sectionName ?? l.dayName,
  }))

  writeJSON(USERS_KEY, [user])
  writeJSON(PLANS_KEY, [plan])
  writeJSON(LOGS_KEY, migratedLogs)
  localStorage.setItem(CURRENT_USER_KEY, user.id)
  localStorage.removeItem(LEGACY_PLAN_KEY)
  localStorage.setItem(MIGRATION_FLAG_KEY, '1')
}

// ─── Users ───────────────────────────────────────────────────────────────────

export function getUsers() {
  return readJSON(USERS_KEY, [])
}

export function saveUsers(users) {
  writeJSON(USERS_KEY, users)
}

export function addUser({ name, avatar }) {
  const users = getUsers()
  const user = { id: genId(), name: name.trim() || 'User', avatar: avatar || '🏋️' }
  users.push(user)
  saveUsers(users)
  return user
}

export function deleteUser(userId) {
  saveUsers(getUsers().filter(u => u.id !== userId))
  // Cascade: drop plans + logs for that user
  writeJSON(PLANS_KEY, getAllPlans().filter(p => p.userId !== userId))
  writeJSON(LOGS_KEY, getAllLogs().filter(l => l.userId !== userId))
  if (getCurrentUserId() === userId) {
    localStorage.removeItem(CURRENT_USER_KEY)
  }
}

export function getCurrentUserId() {
  return localStorage.getItem(CURRENT_USER_KEY) || null
}

export function setCurrentUserId(userId) {
  if (userId) localStorage.setItem(CURRENT_USER_KEY, userId)
  else localStorage.removeItem(CURRENT_USER_KEY)
}

export function getCurrentUser() {
  const id = getCurrentUserId()
  if (!id) return null
  return getUsers().find(u => u.id === id) || null
}

// ─── Plans ───────────────────────────────────────────────────────────────────

function getAllPlans() {
  return readJSON(PLANS_KEY, [])
}

export function getPlans(userId) {
  if (!userId) return []
  return getAllPlans().filter(p => p.userId === userId)
}

export function getActivePlan(userId) {
  if (!userId) return null
  return getPlans(userId).find(p => p.isActive) || null
}

/**
 * Insert or update a plan. Returns the saved plan.
 */
export function savePlan(plan) {
  const all = getAllPlans()
  const idx = all.findIndex(p => p.id === plan.id)
  if (idx === -1) all.push(plan)
  else all[idx] = plan
  writeJSON(PLANS_KEY, all)
  return plan
}

export function deletePlan(planId) {
  writeJSON(PLANS_KEY, getAllPlans().filter(p => p.id !== planId))
  writeJSON(LOGS_KEY, getAllLogs().filter(l => l.planId !== planId))
}

/**
 * Activates one plan and deactivates every other plan for the same user.
 */
export function activatePlan(planId) {
  const all = getAllPlans()
  const target = all.find(p => p.id === planId)
  if (!target) return
  const updated = all.map(p =>
    p.userId !== target.userId ? p : { ...p, isActive: p.id === planId }
  )
  writeJSON(PLANS_KEY, updated)
}

// ─── Logs ────────────────────────────────────────────────────────────────────

function getAllLogs() {
  return readJSON(LOGS_KEY, [])
}

export function getLogs(userId, planId) {
  return getAllLogs().filter(l =>
    (!userId || l.userId === userId) &&
    (!planId || l.planId === planId)
  )
}

export function saveLog(log) {
  const logs = getAllLogs()
  logs.push(log)
  writeJSON(LOGS_KEY, logs)
}

export function deleteLog(logId) {
  writeJSON(LOGS_KEY, getAllLogs().filter(l => l.id !== logId))
}

// ─── Last-workout / progress helpers (scoped) ───────────────────────────────

/**
 * Get the most recent set data for a given exercise, scoped to user + plan.
 */
export function getLastLogForExercise(userId, planId, exerciseId) {
  const logs = getLogs(userId, planId)
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

export function getExerciseHistory(userId, planId, exerciseId) {
  const logs = getLogs(userId, planId)
  const history = []

  for (const log of logs) {
    const ex = log.exercises?.find(e => e.exerciseId === exerciseId)
    if (ex && ex.sets?.length > 0) {
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

export function getDashboardStats(userId, planId) {
  const logs = getLogs(userId, planId)
  const now = new Date()

  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  monday.setHours(0, 0, 0, 0)

  const thisWeek = logs.filter(l => new Date(l.date) >= monday)

  const sorted = [...logs].sort((a, b) => new Date(b.date) - new Date(a.date))
  const lastLog = sorted[0]

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

// ─── Plan template helpers ───────────────────────────────────────────────────

/**
 * Build a fresh plan object pre-filled with the default template.
 * Each section/exercise gets a unique id so it doesn't collide with other plans.
 */
export function buildPlanFromTemplate(userId, name = 'My Plan') {
  return {
    id: genId(),
    userId,
    name,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: null,
    isActive: false,
    sections: DEFAULT_PLAN_TEMPLATE.sections.map(s => ({
      ...s,
      id: genId(),
      exercises: s.exercises.map(e => ({ ...e, id: genId() })),
    })),
  }
}

export function buildBlankPlan(userId, name = 'New Plan') {
  return {
    id: genId(),
    userId,
    name,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: null,
    isActive: false,
    sections: [],
  }
}

// ─── Formatting helpers ──────────────────────────────────────────────────────

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

export function formatTime(isoString) {
  if (!isoString) return ''
  return new Date(isoString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export function formatDateRange(startDate, endDate) {
  if (!startDate) return ''
  const start = new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  if (!endDate) return `Since ${start}`
  const end = new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${start} – ${end}`
}
