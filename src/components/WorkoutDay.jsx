import React, { useState, useMemo, useCallback, useEffect } from 'react'
import ExerciseLogger from './ExerciseLogger.jsx'
import { getLastLogForExercise, saveLog, getLogs, genId } from '../utils/storage.js'

export default function WorkoutDay({ day, onBack, onSaved }) {
  // Initialize sets state for each exercise
  const initializeSets = (exercise) => {
    const count = Math.max(exercise.targetSets, 1)
    return Array.from({ length: count }, () => ({ weight: '', reps: '' }))
  }

  const [exerciseSets, setExerciseSets] = useState(() => {
    const init = {}
    day.exercises.forEach(ex => {
      init[ex.id] = initializeSets(ex)
    })
    return init
  })

  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [startTime] = useState(() => new Date().toISOString())
  const [elapsed, setElapsed] = useState(0)

  // Workout timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(startTime)) / 1000))
    }, 1000)
    return () => clearInterval(timer)
  }, [startTime])

  const formatElapsed = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  // Last session data per exercise
  const lastEntries = useMemo(() => {
    const map = {}
    day.exercises.forEach(ex => {
      map[ex.id] = getLastLogForExercise(ex.id)
    })
    return map
  }, [day])

  const updateSets = useCallback((exerciseId, newSets) => {
    setExerciseSets(prev => ({ ...prev, [exerciseId]: newSets }))
  }, [])

  // Count completed exercises
  const completedCount = useMemo(() => {
    return day.exercises.filter(ex => {
      const sets = exerciseSets[ex.id] || []
      return sets.some(s => s.weight !== '' || s.reps !== '')
    }).length
  }, [day.exercises, exerciseSets])

  const handleSave = useCallback(async () => {
    setSaving(true)

    // Build log entry
    const exerciseLogs = day.exercises
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

    const log = {
      id: genId(),
      date: startTime,
      dayId: day.id,
      dayName: day.name,
      exercises: exerciseLogs,
    }

    saveLog(log)
    setSaving(false)
    setSaved(true)
    setTimeout(() => onSaved(), 1000)
  }, [day, exerciseSets, startTime, onSaved])

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 fade-in">
        <div className="text-7xl">🎉</div>
        <div className="text-center">
          <p className="font-display font-black text-4xl uppercase text-accent">Saved!</p>
          <p className="text-muted mt-2">Great work today</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 slide-up pb-24">
      {/* Header */}
      <div className="flex items-start gap-4 pt-2">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface2 border border-border text-muted active:scale-95 transition-all flex-shrink-0 mt-1"
        >
          ‹
        </button>
        <div className="flex-1">
          <p className="label mb-1">{day.icon} Workout</p>
          <h1 className="font-display font-black text-4xl uppercase tracking-tight text-text leading-none">
            {day.name}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-muted text-sm">⏱ {formatElapsed(elapsed)}</span>
            <span className="text-muted text-xs">·</span>
            <span className="text-muted text-sm">{completedCount}/{day.exercises.length} done</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-surface2 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${(completedCount / day.exercises.length) * 100}%`,
            backgroundColor: day.color,
          }}
        />
      </div>

      {/* Exercises */}
      <div className="flex flex-col gap-4">
        {day.exercises.map((exercise) => (
          <ExerciseLogger
            key={exercise.id}
            exercise={exercise}
            lastEntry={lastEntries[exercise.id]}
            sets={exerciseSets[exercise.id] || [{ weight: '', reps: '' }]}
            onChange={(newSets) => updateSets(exercise.id, newSets)}
          />
        ))}
      </div>

      {/* Notes placeholder */}
      <div className="card">
        <p className="label mb-2">Session Notes (optional)</p>
        <textarea
          placeholder="How did it feel? Any PRs?"
          className="w-full bg-surface2 border border-border rounded-lg p-3 text-text text-sm font-body resize-none focus:outline-none focus:border-accent/50 transition-colors"
          rows={2}
        />
      </div>

      {/* Save button – sticky */}
      <div className="fixed bottom-0 left-0 right-0 p-4 safe-bottom bg-gradient-to-t from-base via-base/95 to-transparent pt-8">
        <button
          onClick={handleSave}
          disabled={saving || completedCount === 0}
          className={`w-full py-4 rounded-xl font-display font-black text-xl uppercase tracking-widest transition-all active:scale-95 ${
            completedCount > 0
              ? 'bg-accent text-base accent-glow'
              : 'bg-surface2 text-muted border border-border cursor-not-allowed'
          }`}
        >
          {saving ? 'Saving…' : `Save Workout · ${completedCount} Exercises`}
        </button>
      </div>
    </div>
  )
}
