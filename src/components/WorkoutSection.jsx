import React, { useState, useMemo, useCallback, useEffect } from 'react'
import ExerciseLogger from './ExerciseLogger.jsx'
import { useUser } from '../context/UserContext.jsx'
import { usePlan } from '../context/PlanContext.jsx'
import { useLogs } from '../context/LogContext.jsx'
import { getLastLogForExercise, genId } from '../utils/storage.js'

// Renders the workout flow for both *new* and *existing* sessions.
// When `editingLog` is provided, the form preloads its values, the date
// becomes editable, and the save button updates instead of creates.
export default function WorkoutSection({ section, editingLog, onBack, onSaved }) {
  const isEdit = !!editingLog
  const { currentUserId } = useUser()
  const { activePlan } = usePlan()
  const { saveLog, updateLog } = useLogs()

  const initializeSets = (exercise) => {
    const count = Math.max(exercise.targetSets, 1)
    return Array.from({ length: count }, () => ({ weight: '', reps: '' }))
  }

  // Hydrate initial sets/calories/notes from the editing log when present.
  const [exerciseSets, setExerciseSets] = useState(() => {
    const init = {}
    section.exercises.forEach(ex => {
      const fromLog = editingLog?.exercises?.find(e => e.exerciseId === ex.id)
      if (fromLog?.sets?.length) {
        init[ex.id] = fromLog.sets.map(s => ({
          weight: s.weight == null ? '' : String(s.weight),
          reps: s.reps == null ? '' : String(s.reps),
        }))
      } else {
        init[ex.id] = initializeSets(ex)
      }
    })
    return init
  })

  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  // Preserve the start time when editing so we don't break sort order.
  const [startTime] = useState(() => editingLog?.date || new Date().toISOString())
  const [editDate, setEditDate] = useState(() =>
    editingLog?.date ? editingLog.date.slice(0, 10) : ''
  )
  const [elapsed, setElapsed] = useState(0)
  const [calorieInput, setCalorieInput] = useState(() => {
    const c = editingLog?.sessionMetrics?.caloriesBurned
    return typeof c === 'number' ? String(c) : ''
  })
  const [notes, setNotes] = useState(() => editingLog?.notes || '')

  useEffect(() => {
    if (isEdit) return
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(startTime)) / 1000))
    }, 1000)
    return () => clearInterval(timer)
  }, [startTime, isEdit])

  const formatElapsed = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const lastEntries = useMemo(() => {
    const map = {}
    if (!currentUserId || !activePlan) return map
    section.exercises.forEach(ex => {
      map[ex.id] = getLastLogForExercise(currentUserId, activePlan.id, ex.id, ex.name)
    })
    return map
  }, [section, currentUserId, activePlan])

  const updateSets = useCallback((exerciseId, newSets) => {
    setExerciseSets(prev => ({ ...prev, [exerciseId]: newSets }))
  }, [])

  const completedCount = useMemo(() => {
    return section.exercises.filter(ex => {
      const sets = exerciseSets[ex.id] || []
      return sets.some(s => s.weight !== '' || s.reps !== '')
    }).length
  }, [section.exercises, exerciseSets])

  const totalCount = section.exercises.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  const handleSave = useCallback(async () => {
    if (!currentUserId || !activePlan) return
    setSaving(true)

    const exerciseLogs = section.exercises
      .map(ex => {
        const sets = (exerciseSets[ex.id] || [])
          .filter(s => s.weight !== '' || s.reps !== '')
        if (!sets.length) return null
        return {
          exerciseId: ex.id,
          exerciseName: ex.name,
          sets: sets.map(s => ({
            weight: s.weight === '' ? null : Number(s.weight),
            reps: s.reps === '' ? null : Number(s.reps),
          })),
        }
      })
      .filter(Boolean)

    if (exerciseLogs.length === 0) {
      setSaving(false)
      return
    }

    // Edited date keeps original time-of-day so chart x-axes stay stable.
    const finalDate = (() => {
      if (!isEdit) return startTime
      if (!editDate) return startTime
      const original = new Date(startTime)
      const [y, m, d] = editDate.split('-').map(Number)
      original.setFullYear(y, (m || 1) - 1, d || 1)
      return original.toISOString()
    })()

    const baseLog = {
      id: editingLog?.id || genId(),
      userId: currentUserId,
      planId: activePlan.id,
      sectionId: section.id,
      sectionName: section.name,
      date: finalDate,
      exercises: exerciseLogs,
    }

    const calNum = Number(calorieInput)
    if (calorieInput !== '' && Number.isFinite(calNum) && calNum > 0) {
      baseLog.sessionMetrics = { caloriesBurned: Math.round(calNum) }
    }

    const trimmedNotes = notes.trim()
    if (trimmedNotes) baseLog.notes = trimmedNotes

    if (isEdit) {
      updateLog(baseLog)
    } else {
      saveLog(baseLog)
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => onSaved?.(), isEdit ? 600 : 1000)
  }, [
    section, exerciseSets, startTime, onSaved, currentUserId, activePlan,
    calorieInput, notes, isEdit, editingLog, editDate, saveLog, updateLog,
  ])

  if (saved) {
    return <SavedScreen edit={isEdit} />
  }

  const saveLabel = isEdit
    ? (saving ? 'Saving' : 'Save changes')
    : (saving
        ? 'Saving'
        : completedCount === 0
          ? 'Log a set to save'
          : null)

  return (
    <div className="flex flex-col gap-5 slide-up pt-5 pb-32">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button
          onClick={onBack}
          className="btn-icon flex-shrink-0 mt-0.5"
        >
          <ChevronLeft />
        </button>
        <div className="flex-1 min-w-0">
          <p className="caption mb-0.5">
            <span className="mr-1">{section.icon}</span> {isEdit ? 'Edit session' : 'Workout'}
          </p>
          <h1 className="font-display font-bold text-[30px] leading-[1.05] tracking-tighter2 text-text-primary">
            {section.name}
          </h1>
        </div>
      </div>

      {/* Progress + timer card (hidden in edit mode in favour of date input) */}
      {!isEdit && (
        <div className="card flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-surface-3 border border-border flex items-center justify-center">
                <ClockIcon />
              </div>
              <div>
                <p className="caption">Elapsed</p>
                <p className="font-display font-bold text-lg tabular tracking-tightish text-text-primary leading-none mt-0.5">
                  {formatElapsed(elapsed)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="caption">Done</p>
              <p className="font-display font-bold text-lg tabular tracking-tightish text-text-primary leading-none mt-0.5">
                {completedCount}<span className="text-text-tertiary">/{totalCount}</span>
              </p>
            </div>
          </div>

          <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden relative">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out relative shine-sweep"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${section.color}cc, ${section.color})`,
                boxShadow: `0 0 14px ${section.color}99`,
              }}
            />
          </div>
        </div>
      )}

      {/* Date editor — edit mode only */}
      {isEdit && (
        <div className="card">
          <p className="label mb-2">Workout date</p>
          <input
            type="date"
            value={editDate}
            onChange={(e) => setEditDate(e.target.value)}
            className="w-full bg-surface-3 border border-border rounded-xl p-3 text-[15px] font-body font-medium tabular focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
            style={{ color: '#F4F6FA' }}
          />
        </div>
      )}

      {/* Exercises */}
      <div className="flex flex-col gap-3">
        {section.exercises.map((exercise) => (
          <ExerciseLogger
            key={exercise.id}
            exercise={exercise}
            lastEntry={lastEntries[exercise.id]}
            sets={exerciseSets[exercise.id] || [{ weight: '', reps: '' }]}
            onChange={(newSets) => updateSets(exercise.id, newSets)}
          />
        ))}
      </div>

      {section.exercises.length === 0 && (
        <div className="card text-center py-8">
          <p className="body-sm">This section has no exercises. Add some in the plan editor.</p>
        </div>
      )}

      {/* Calories (optional) */}
      <div className="card">
        <p className="label mb-2">🔥 Calories</p>
        <input
          type="number"
          inputMode="numeric"
          min="0"
          step="1"
          value={calorieInput}
          onChange={(e) => setCalorieInput(e.target.value)}
          placeholder="Calories burned (optional)"
          className="w-full bg-surface-3 border border-border rounded-xl p-3 text-[15px] font-body font-medium tabular focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-text-tertiary"
          style={{ color: '#F4F6FA' }}
        />
      </div>

      {/* Notes */}
      <div className="card">
        <p className="label mb-2">Session notes</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="How did it feel? Any PRs?"
          className="w-full bg-surface-3 border border-border rounded-xl p-3 text-[15px] font-body font-medium resize-none focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-text-tertiary"
          rows={2}
          style={{ color: '#F4F6FA' }}
        />
      </div>

      {/* Sticky save */}
      <div className="fixed bottom-0 left-0 right-0 p-4 safe-bottom bg-gradient-to-t from-bg via-bg/95 to-transparent pt-10 z-20">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleSave}
            disabled={saving || completedCount === 0}
            className={`w-full h-14 rounded-2xl font-display font-bold text-base tracking-tightish transition-all active:scale-[0.98] inline-flex items-center justify-center gap-2 relative overflow-hidden ${
              completedCount > 0
                ? 'bg-primary-gradient text-white shadow-glow shine-sweep'
                : 'bg-surface-2 text-text-tertiary border border-border cursor-not-allowed'
            }`}
          >
            {saving ? (
              <>{saveLabel}<DotsIcon /></>
            ) : isEdit ? (
              completedCount > 0 ? 'Save changes' : 'Log a set to save'
            ) : completedCount === 0 ? (
              'Log a set to save'
            ) : (
              <>Save Workout · <span className="tabular">{completedCount}</span> {completedCount === 1 ? 'exercise' : 'exercises'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function SavedScreen({ edit }) {
  const colors = ['#FF6A3D', '#FFB388', '#6EA8FF', '#34D399', '#F5B544']
  const pieces = Array.from({ length: 18 }).map((_, i) => {
    const angle = (i / 18) * Math.PI * 2
    const dist = 90 + Math.random() * 70
    const cx = Math.cos(angle) * dist
    const cy = Math.sin(angle) * dist
    const cr = (Math.random() - 0.5) * 540
    return {
      key: i,
      style: {
        '--cx': `${cx}px`,
        '--cy': `${cy}px`,
        '--cr': `${cr}deg`,
        backgroundColor: colors[i % colors.length],
        animationDelay: `${Math.random() * 0.15}s`,
      },
    }
  })

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 fade-in">
      <div className="relative">
        {!edit && pieces.map(p => (
          <span key={p.key} className="confetti-piece" style={p.style} />
        ))}
        <div className="w-28 h-28 rounded-full bg-primary-gradient flex items-center justify-center primary-glow burst relative">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" className="w-14 h-14">
            <path className="check-draw" d="M5 12.5 10 17.5 19 7.5" />
          </svg>
        </div>
      </div>
      <div className="text-center fade-in" style={{ animationDelay: '0.25s', animationFillMode: 'both' }}>
        <p className="font-display font-bold text-[34px] tracking-tighter2 gradient-text">
          {edit ? 'Updated!' : 'Saved!'}
        </p>
        <p className="body-sm mt-2">{edit ? 'Changes synced ✨' : 'Great work today 💪'}</p>
      </div>
    </div>
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

function ChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="m15 6-6 6 6 6" />
    </svg>
  )
}

function DotsIcon() {
  return <span className="ml-0.5 inline-block animate-pulse">…</span>
}
