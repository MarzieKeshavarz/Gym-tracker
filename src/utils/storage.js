import { DEFAULT_PLAN_TEMPLATE } from '../data/defaultPlan.js'

const USERS_KEY            = 'gymlog_users'
const PLANS_KEY            = 'gymlog_plans'
const LOGS_KEY             = 'gymlog_logs'
const STEP_LOGS_KEY        = 'gymlog_step_logs'
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

// ─── Sync hook ───────────────────────────────────────────────────────────────
// The sync manager registers a listener here; storage calls notifyChange()
// after any local mutation so sync can debounce and push.

let changeListener = null

export function registerChangeListener(fn) {
  changeListener = fn
}

function notifyChange() {
  if (changeListener) {
    try { changeListener() } catch { /* ignore */ }
  }
  notifyDataChange('local')
}

// Data-change broadcast — fired on any local mutation AND after the sync
// manager pulls a remote snapshot. React contexts subscribe to this to keep
// every screen in sync without forcing a reload.
const dataListeners = new Set()

export function subscribeDataChange(fn) {
  dataListeners.add(fn)
  return () => dataListeners.delete(fn)
}

export function notifyDataChange(source = 'remote') {
  for (const fn of dataListeners) {
    try { fn(source) } catch { /* ignore */ }
  }
}

// ─── Migration ───────────────────────────────────────────────────────────────

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

  const now = Date.now()
  const user = { id: genId(), name: 'You', avatar: '🏋️', updatedAt: now }
  const plan = {
    id: genId(),
    userId: user.id,
    name: 'My Plan',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: null,
    isActive: true,
    sections,
    updatedAt: now,
  }

  const migratedLogs = legacyLogs.map(l => ({
    ...l,
    userId: user.id,
    planId: plan.id,
    sectionId: l.sectionId ?? l.dayId,
    sectionName: l.sectionName ?? l.dayName,
    updatedAt: l.updatedAt ?? new Date(l.date).getTime(),
  }))

  writeJSON(USERS_KEY, [user])
  writeJSON(PLANS_KEY, [plan])
  writeJSON(LOGS_KEY, migratedLogs)
  localStorage.setItem(CURRENT_USER_KEY, user.id)
  localStorage.removeItem(LEGACY_PLAN_KEY)
  localStorage.setItem(MIGRATION_FLAG_KEY, '1')
}

// ─── Tombstone-aware reading ─────────────────────────────────────────────────
// Internal getters return *living* entities only (deletedAt undefined). The
// sync layer needs raw access (including tombstones) — it uses getRaw*().

const isLive = (e) => !e.deletedAt

function stamp(entity) {
  return { ...entity, updatedAt: Date.now() }
}

// ─── Users ───────────────────────────────────────────────────────────────────

export function getUsers() {
  return readJSON(USERS_KEY, []).filter(isLive)
}

export function getRawUsers() {
  return readJSON(USERS_KEY, [])
}

export function setRawUsers(users) {
  writeJSON(USERS_KEY, users)
}

export function addUser({ name, avatar }) {
  const users = readJSON(USERS_KEY, [])
  const user = stamp({ id: genId(), name: name.trim() || 'User', avatar: avatar || '🏋️' })
  users.push(user)
  writeJSON(USERS_KEY, users)
  notifyChange()
  return user
}

export function updateUser(userId, patch) {
  const users = readJSON(USERS_KEY, [])
  const idx = users.findIndex(u => u.id === userId)
  if (idx === -1) return null
  const cleanPatch = {}
  if (typeof patch.name === 'string') cleanPatch.name = patch.name.trim() || users[idx].name
  if (typeof patch.avatar === 'string' && patch.avatar) cleanPatch.avatar = patch.avatar
  users[idx] = stamp({ ...users[idx], ...cleanPatch })
  writeJSON(USERS_KEY, users)
  notifyChange()
  return users[idx]
}

export function getUserCascadeCounts(userId) {
  const plans = readJSON(PLANS_KEY, []).filter(p => isLive(p) && p.userId === userId)
  const logs  = readJSON(LOGS_KEY,  []).filter(l => isLive(l) && l.userId === userId)
  return { plans: plans.length, logs: logs.length }
}

export function deleteUser(userId) {
  // Tombstone the user
  const users = readJSON(USERS_KEY, []).map(u =>
    u.id === userId ? { ...u, deletedAt: Date.now(), updatedAt: Date.now() } : u
  )
  writeJSON(USERS_KEY, users)

  // Cascade: tombstone every plan and log for that user
  const now = Date.now()
  const plans = readJSON(PLANS_KEY, []).map(p =>
    p.userId === userId ? { ...p, deletedAt: now, updatedAt: now } : p
  )
  writeJSON(PLANS_KEY, plans)

  const logs = readJSON(LOGS_KEY, []).map(l =>
    l.userId === userId ? { ...l, deletedAt: now, updatedAt: now } : l
  )
  writeJSON(LOGS_KEY, logs)

  const stepLogs = readJSON(STEP_LOGS_KEY, []).map(s =>
    s.userId === userId ? { ...s, deletedAt: now, updatedAt: now } : s
  )
  writeJSON(STEP_LOGS_KEY, stepLogs)

  if (getCurrentUserId() === userId) {
    localStorage.removeItem(CURRENT_USER_KEY)
  }
  notifyChange()
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
  return readJSON(PLANS_KEY, []).filter(isLive)
}

export function getRawPlans() {
  return readJSON(PLANS_KEY, [])
}

export function setRawPlans(plans) {
  writeJSON(PLANS_KEY, plans)
}

export function getPlans(userId) {
  if (!userId) return []
  return getAllPlans().filter(p => p.userId === userId)
}

export function getActivePlan(userId) {
  if (!userId) return null
  return getPlans(userId).find(p => p.isActive) || null
}

export function savePlan(plan) {
  const all = readJSON(PLANS_KEY, [])
  const idx = all.findIndex(p => p.id === plan.id)
  const stamped = stamp(plan)
  if (idx === -1) all.push(stamped)
  else all[idx] = stamped
  writeJSON(PLANS_KEY, all)
  notifyChange()
  return stamped
}

export function deletePlan(planId) {
  const now = Date.now()
  const all = readJSON(PLANS_KEY, []).map(p =>
    p.id === planId ? { ...p, deletedAt: now, updatedAt: now } : p
  )
  writeJSON(PLANS_KEY, all)
  // Tombstone child logs too
  const logs = readJSON(LOGS_KEY, []).map(l =>
    l.planId === planId ? { ...l, deletedAt: now, updatedAt: now } : l
  )
  writeJSON(LOGS_KEY, logs)
  const stepLogs = readJSON(STEP_LOGS_KEY, []).map(s =>
    s.planId === planId ? { ...s, deletedAt: now, updatedAt: now } : s
  )
  writeJSON(STEP_LOGS_KEY, stepLogs)
  notifyChange()
}

export function activatePlan(planId) {
  const all = readJSON(PLANS_KEY, [])
  const target = all.find(p => p.id === planId)
  if (!target) return
  const now = Date.now()
  const updated = all.map(p => {
    if (p.userId !== target.userId) return p
    const shouldBeActive = p.id === planId
    if (p.isActive === shouldBeActive) return p
    return { ...p, isActive: shouldBeActive, updatedAt: now }
  })
  writeJSON(PLANS_KEY, updated)
  notifyChange()
}

// ─── Logs ────────────────────────────────────────────────────────────────────

function getAllLogs() {
  return readJSON(LOGS_KEY, []).filter(isLive)
}

export function getRawLogs() {
  return readJSON(LOGS_KEY, [])
}

export function setRawLogs(logs) {
  writeJSON(LOGS_KEY, logs)
}

export function getLogs(userId, planId) {
  return getAllLogs().filter(l =>
    (!userId || l.userId === userId) &&
    (!planId || l.planId === planId)
  )
}

export function saveLog(log) {
  const logs = readJSON(LOGS_KEY, [])
  logs.push(stamp(log))
  writeJSON(LOGS_KEY, logs)
  notifyChange()
}

export function updateLog(log) {
  if (!log?.id) return null
  const logs = readJSON(LOGS_KEY, [])
  const idx = logs.findIndex(l => l.id === log.id)
  if (idx === -1) return null
  // Preserve identity fields, drop tombstone if any (an edit revives the log).
  const merged = stamp({ ...logs[idx], ...log, deletedAt: undefined })
  delete merged.deletedAt
  logs[idx] = merged
  writeJSON(LOGS_KEY, logs)
  notifyChange()
  return merged
}

export function deleteLog(logId) {
  const now = Date.now()
  const logs = readJSON(LOGS_KEY, []).map(l =>
    l.id === logId ? { ...l, deletedAt: now, updatedAt: now } : l
  )
  writeJSON(LOGS_KEY, logs)
  notifyChange()
}

export function restoreLog(logId) {
  const logs = readJSON(LOGS_KEY, [])
  const idx = logs.findIndex(l => l.id === logId)
  if (idx === -1) return null
  const { deletedAt, ...rest } = logs[idx]
  if (!deletedAt) return logs[idx]
  logs[idx] = stamp(rest)
  writeJSON(LOGS_KEY, logs)
  notifyChange()
  return logs[idx]
}

// ─── Step logs ───────────────────────────────────────────────────────────────
// Step tracking is intentionally separate from workout logs. One live entry
// per (userId, planId, date); re-saving the same date upserts.

function getAllStepLogs() {
  return readJSON(STEP_LOGS_KEY, []).filter(isLive)
}

export function getRawStepLogs() {
  return readJSON(STEP_LOGS_KEY, [])
}

export function setRawStepLogs(stepLogs) {
  writeJSON(STEP_LOGS_KEY, stepLogs)
}

export function getStepLogs(userId, planId) {
  return getAllStepLogs().filter(s =>
    (!userId || s.userId === userId) &&
    (!planId || s.planId === planId)
  )
}

export function getStepLogForDate(userId, planId, date) {
  return getAllStepLogs().find(s =>
    s.userId === userId && s.planId === planId && s.date === date
  ) || null
}

export function saveStepLog({ userId, planId, date, steps, targetAtTime }) {
  const all = readJSON(STEP_LOGS_KEY, [])
  const now = Date.now()
  const safeSteps = Math.max(0, Math.round(Number(steps) || 0))

  // Upsert by (userId, planId, date), reviving any tombstoned row for the same key.
  const idx = all.findIndex(s =>
    s.userId === userId && s.planId === planId && s.date === date
  )
  if (idx === -1) {
    const entry = {
      id: genId(),
      userId,
      planId,
      date,
      steps: safeSteps,
      targetAtTime: targetAtTime ?? null,
      createdAt: now,
      updatedAt: now,
    }
    all.push(entry)
    writeJSON(STEP_LOGS_KEY, all)
    notifyChange()
    return entry
  }
  const merged = {
    ...all[idx],
    steps: safeSteps,
    targetAtTime: targetAtTime ?? all[idx].targetAtTime ?? null,
    updatedAt: now,
  }
  delete merged.deletedAt
  all[idx] = merged
  writeJSON(STEP_LOGS_KEY, all)
  notifyChange()
  return merged
}

export function deleteStepLog(stepLogId) {
  const now = Date.now()
  const all = readJSON(STEP_LOGS_KEY, []).map(s =>
    s.id === stepLogId ? { ...s, deletedAt: now, updatedAt: now } : s
  )
  writeJSON(STEP_LOGS_KEY, all)
  notifyChange()
}

// ─── Last-workout / progress helpers (scoped) ───────────────────────────────

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

// ─── Calorie / session-metric helpers ────────────────────────────────────────
// Logs may carry an optional `sessionMetrics: { caloriesBurned, ... }`. Old
// logs without this object behave as "no calories" for every helper below.

function logCalories(log) {
  const c = log?.sessionMetrics?.caloriesBurned
  return typeof c === 'number' && c > 0 ? c : 0
}

export function hasAnyCalorieData(userId, planId) {
  return getLogs(userId, planId).some(l => logCalories(l) > 0)
}

// Returns 7 entries [oldest … today], each { date: 'YYYY-MM-DD', label, calories }.
export function getWeeklyCalories(userId, planId) {
  const logs = getLogs(userId, planId)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    days.push({
      date: key,
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      calories: 0,
    })
  }

  const byDate = new Map(days.map(d => [d.date, d]))
  for (const log of logs) {
    const key = (log.date || '').slice(0, 10)
    const bucket = byDate.get(key)
    if (bucket) bucket.calories += logCalories(log)
  }
  return days
}

export function getCalorieStats(userId, planId) {
  const logs = getLogs(userId, planId)
  const week = getWeeklyCalories(userId, planId)
  const weeklyTotal = week.reduce((sum, d) => sum + d.calories, 0)

  const sessionsWithCals = logs.filter(l => logCalories(l) > 0)
  const avgPerSession = sessionsWithCals.length
    ? Math.round(sessionsWithCals.reduce((s, l) => s + logCalories(l), 0) / sessionsWithCals.length)
    : 0

  let highest = null
  for (const l of sessionsWithCals) {
    const c = logCalories(l)
    if (!highest || c > highest.calories) {
      highest = { calories: c, date: l.date, sectionName: l.sectionName }
    }
  }

  return {
    weeklyTotal,
    avgPerSession,
    highest,
    weeklySeries: week,
  }
}

// ─── Plan template helpers ───────────────────────────────────────────────────

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
