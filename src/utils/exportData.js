import {
  getLogs,
  getStepLogs,
  getBodyMetrics,
  getPlans,
} from './storage.js'

function escapeCSV(value) {
  if (value == null) return ''
  const s = String(value)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function rowsToCSV(headers, rows) {
  const out = [headers.map(escapeCSV).join(',')]
  for (const row of rows) out.push(row.map(escapeCSV).join(','))
  return out.join('\r\n')
}

export function buildWorkoutsCSV(logs, planById) {
  const sorted = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date))
  const rows = []
  for (const log of sorted) {
    const planName = planById.get(log.planId)?.name || ''
    const sectionName = log.sectionName || ''
    const calories = log.sessionMetrics?.caloriesBurned ?? ''
    const sessionNotes = log.notes || ''
    if (!log.exercises?.length) continue
    for (const ex of log.exercises) {
      const sets = ex.sets || []
      if (sets.length === 0) {
        rows.push([log.date, planName, sectionName, ex.exerciseName || '', '', '', '', calories, sessionNotes])
        continue
      }
      sets.forEach((s, i) => {
        rows.push([
          log.date,
          planName,
          sectionName,
          ex.exerciseName || '',
          i + 1,
          s.reps ?? '',
          s.weight ?? '',
          i === 0 ? calories : '',
          i === 0 ? sessionNotes : '',
        ])
      })
    }
  }
  return rowsToCSV(
    ['Date', 'Plan', 'Section', 'Exercise', 'Set', 'Reps', 'Weight (kg)', 'Calories (session)', 'Notes (session)'],
    rows,
  )
}

export function buildStepsCSV(stepLogs) {
  const sorted = [...stepLogs].sort((a, b) => (a.date || '').localeCompare(b.date || ''))
  const rows = sorted.map(s => [s.date, s.steps, s.targetAtTime ?? ''])
  return rowsToCSV(['Date', 'Steps', 'Target'], rows)
}

export function buildBodyCSV(bodyMetrics) {
  const sorted = [...bodyMetrics].sort((a, b) => (a.date || '').localeCompare(b.date || ''))
  const rows = sorted.map(b => [
    b.date,
    b.weight,
    b.measurements?.waist ?? '',
    b.measurements?.hips ?? '',
    b.measurements?.chest ?? '',
    b.measurements?.arms ?? '',
    b.measurements?.thighs ?? '',
  ])
  return rowsToCSV(
    ['Date', 'Weight (kg)', 'Waist (cm)', 'Hips (cm)', 'Chest (cm)', 'Arms (cm)', 'Thighs (cm)'],
    rows,
  )
}

function downloadFile(content, filename, mime = 'text/csv;charset=utf-8') {
  // Prepend BOM so Excel opens UTF-8 CSVs without garbling diacritics / emoji.
  const blob = new Blob(['﻿', content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function safeSlug(s) {
  return (s || 'user').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'user'
}

// One combined CSV with three sections, separated by a section header row.
// Single-file download avoids browser "multiple downloads" blocking and still
// opens in Excel / Numbers as one sheet — each section is a contiguous block.
function buildCombinedCSV({ logs, planById, stepLogs, body, userName }) {
  const today = new Date().toISOString().slice(0, 10)
  const blocks = []

  blocks.push(
    `# GymLog export · ${userName || 'user'} · ${today}`,
    '',
    `## Workouts (${logs.length} session${logs.length === 1 ? '' : 's'})`,
    buildWorkoutsCSV(logs, planById),
    '',
    `## Steps (${stepLogs.length} entr${stepLogs.length === 1 ? 'y' : 'ies'})`,
    buildStepsCSV(stepLogs),
    '',
    `## Body (${body.length} entr${body.length === 1 ? 'y' : 'ies'})`,
    buildBodyCSV(body),
    '',
  )
  return blocks.join('\r\n')
}

export function exportUserActivities(user) {
  if (!user?.id) return { workouts: 0, steps: 0, body: 0, file: null }

  const logs = getLogs(user.id)
  const stepLogs = getStepLogs(user.id)
  const body = getBodyMetrics(user.id)
  const plans = getPlans(user.id)
  const planById = new Map(plans.map(p => [p.id, p]))

  const counts = { workouts: logs.length, steps: stepLogs.length, body: body.length }
  if (!counts.workouts && !counts.steps && !counts.body) {
    return { ...counts, file: null }
  }

  const today = new Date().toISOString().slice(0, 10)
  const slug = safeSlug(user.name)
  const filename = `gymlog-${slug}-${today}.csv`
  const csv = buildCombinedCSV({ logs, planById, stepLogs, body, userName: user.name })
  downloadFile(csv, filename)

  return { ...counts, file: filename }
}
