import { getBodyMetrics, getBodyMetricForDate } from './storage.js'
import { localDateKey, todayKey } from './stepAnalytics.js'

export const MEASUREMENT_KEYS = ['waist', 'hips', 'chest', 'arms', 'thighs']

export const MEASUREMENT_META = {
  waist:  { label: 'Waist',  icon: '📏', color: '#FF6A3D' },
  hips:   { label: 'Hips',   icon: '🍑', color: '#A78BFA' },
  chest:  { label: 'Chest',  icon: '💪', color: '#6EA8FF' },
  arms:   { label: 'Arms',   icon: '💪', color: '#34D399' },
  thighs: { label: 'Thighs', icon: '🦵', color: '#FBBF24' },
}

const dayMs = 86_400_000

function dateAtKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

function daysBetween(aKey, bKey) {
  return Math.round((dateAtKey(bKey) - dateAtKey(aKey)) / dayMs)
}

function sortAsc(entries) {
  return [...entries].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
}

export function getSortedBodyMetrics(userId) {
  if (!userId) return []
  return sortAsc(getBodyMetrics(userId))
}

export function getBodyMetricsForToday(userId) {
  if (!userId) return null
  return getBodyMetricForDate(userId, todayKey())
}

export function getLatestBodyMetric(userId) {
  const all = getSortedBodyMetrics(userId)
  return all.length ? all[all.length - 1] : null
}

// Newest entry strictly older than `referenceDate`, within `windowDays`.
function findReferenceEntry(sorted, referenceDate, windowDays) {
  if (!sorted.length) return null
  const refTime = dateAtKey(referenceDate).getTime()
  const cutoff  = refTime - windowDays * dayMs
  let best = null
  for (let i = sorted.length - 1; i >= 0; i--) {
    const t = dateAtKey(sorted[i].date).getTime()
    if (t >= refTime) continue
    if (t < cutoff) break
    if (!best || t > dateAtKey(best.date).getTime()) best = sorted[i]
  }
  return best
}

function deltaWithinWindow(sorted, latest, windowDays) {
  if (!latest) return null
  const ref = findReferenceEntry(sorted, latest.date, windowDays)
  if (!ref) return null
  return {
    delta: Math.round((latest.weight - ref.weight) * 10) / 10,
    refWeight: ref.weight,
    refDate: ref.date,
    spanDays: daysBetween(ref.date, latest.date),
  }
}

// Linear-regression slope on (dayIndex, weight) — returns kg/week or null when
// fewer than two entries or the span is < 7 days.
function avgWeeklyChange(sorted) {
  if (sorted.length < 2) return null
  const t0 = dateAtKey(sorted[0].date).getTime()
  const points = sorted.map(e => ({
    x: (dateAtKey(e.date).getTime() - t0) / dayMs,
    y: e.weight,
  }))
  const lastX = points[points.length - 1].x
  if (lastX < 7) return null

  const n = points.length
  const sumX = points.reduce((s, p) => s + p.x, 0)
  const sumY = points.reduce((s, p) => s + p.y, 0)
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0)
  const sumXX = points.reduce((s, p) => s + p.x * p.x, 0)
  const denom = n * sumXX - sumX * sumX
  if (denom === 0) return null
  const slopePerDay = (n * sumXY - sumX * sumY) / denom
  return Math.round(slopePerDay * 7 * 100) / 100
}

export function getWeightStats(userId) {
  const sorted = getSortedBodyMetrics(userId)
  if (!sorted.length) {
    return {
      hasAny: false,
      latest: null,
      previous: null,
      delta7d: null,
      delta30d: null,
      lowest: null,
      highest: null,
      avgWeeklyChange: null,
      totalEntries: 0,
      firstDate: null,
    }
  }
  const latest = sorted[sorted.length - 1]
  const previous = sorted.length > 1 ? sorted[sorted.length - 2] : null
  const lowest = sorted.reduce((acc, e) => !acc || e.weight < acc.weight ? e : acc, null)
  const highest = sorted.reduce((acc, e) => !acc || e.weight > acc.weight ? e : acc, null)

  return {
    hasAny: true,
    latest,
    previous,
    delta7d:  deltaWithinWindow(sorted, latest, 7),
    delta30d: deltaWithinWindow(sorted, latest, 30),
    lowest,
    highest,
    avgWeeklyChange: avgWeeklyChange(sorted),
    totalEntries: sorted.length,
    firstDate: sorted[0].date,
  }
}

// Series shaped for recharts; one entry per logged day (sparse, no fill-in).
export function getWeightSeries(userId) {
  const sorted = getSortedBodyMetrics(userId)
  return sorted.map(e => ({
    date: e.date,
    label: dateAtKey(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weight: e.weight,
  }))
}

export function getMeasurementSeries(userId, key) {
  const sorted = getSortedBodyMetrics(userId)
  return sorted
    .filter(e => Number.isFinite(e.measurements?.[key]))
    .map(e => ({
      date: e.date,
      label: dateAtKey(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: e.measurements[key],
    }))
}

export function getAvailableMeasurements(userId) {
  const all = getBodyMetrics(userId)
  const found = new Set()
  for (const e of all) {
    if (!e.measurements) continue
    for (const k of MEASUREMENT_KEYS) {
      if (Number.isFinite(e.measurements[k])) found.add(k)
    }
  }
  return MEASUREMENT_KEYS.filter(k => found.has(k))
}

export function getMeasurementStats(userId) {
  const sorted = getSortedBodyMetrics(userId)
  const out = {}
  for (const k of MEASUREMENT_KEYS) {
    const series = sorted.filter(e => Number.isFinite(e.measurements?.[k]))
    if (!series.length) continue
    const latest = series[series.length - 1]
    const first = series[0]
    out[k] = {
      latest: latest.measurements[k],
      latestDate: latest.date,
      delta: series.length > 1
        ? Math.round((latest.measurements[k] - first.measurements[k]) * 10) / 10
        : 0,
      points: series.length,
    }
  }
  return out
}

// ─── BMI ────────────────────────────────────────────────────────────────────

export const BMI_ZONES = [
  { key: 'underweight', label: 'Underweight', max: 18.5,  color: '#6EA8FF' },
  { key: 'normal',      label: 'Normal',      max: 25,    color: '#34D399' },
  { key: 'overweight',  label: 'Overweight',  max: 30,    color: '#FBBF24' },
  { key: 'obese',       label: 'Obese',       max: Infinity, color: '#FF6A3D' },
]

export const BMI_RANGE = { min: 15, max: 40 }

export function computeBMI(weightKg, heightCm) {
  const w = Number(weightKg)
  const h = Number(heightCm)
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null
  const m = h / 100
  const bmi = w / (m * m)
  return Math.round(bmi * 10) / 10
}

export function classifyBMI(bmi) {
  if (bmi == null) return null
  return BMI_ZONES.find(z => bmi < z.max) || BMI_ZONES[BMI_ZONES.length - 1]
}

// 0..1 position on the gauge for a given BMI. Clamped.
export function bmiGaugePosition(bmi) {
  if (bmi == null) return 0
  const { min, max } = BMI_RANGE
  return Math.min(1, Math.max(0, (bmi - min) / (max - min)))
}

// ─── Helpers ────────────────────────────────────────────────────────────────

export function isFutureDateKey(dateKey) {
  return dateKey > todayKey()
}

export function todayDateKey() {
  return todayKey()
}

export function localDateKeyOf(d) {
  return localDateKey(d)
}

export function formatWeightDelta(delta) {
  if (delta == null) return null
  const sign = delta > 0 ? '+' : delta < 0 ? '−' : ''
  return `${sign}${Math.abs(delta).toFixed(1)} kg`
}
