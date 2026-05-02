import React, { useState, useMemo, useCallback, useEffect } from 'react'
import ExerciseLogger from './ExerciseLogger.jsx'
import { useUser } from '../context/UserContext.jsx'
import { usePlan } from '../context/PlanContext.jsx'
import { getLastLogForExercise, saveLog, genId } from '../utils/storage.js'

export default function WorkoutSection({ section, onBack, onSaved }) {
  const { currentUserId } = useUser()
  const { activePlan } = usePlan()

  const initializeSets = (exercise) => {
    const count = Math.max(exercise.targetSets, 1)
    return Array.from({ length: count }, () => ({ weight: '', reps: '' }))
  }

  const [exerciseSets, setExerciseSets] = useState(() => {
    const init = {}
    section.exercises.forEach(ex => { init[ex.id] = initializeSets(ex) })
    return init
  })

  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [startTime] = useState(() => new Date().toISOString())
  const [elapsed, setElapsed] = useState(0)
  const [calorieInput, setCalorieInput] = useState('')

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

  // Last entries scoped to current user + active plan + this exercise
  const lastEntries = useMemo(() => {
    const map = {}
    if (!currentUserId || !activePlan) return map
    section.exercises.forEach(ex => {
      map[ex.id] = getLastLogForExercise(currentUserId, activePlan.id, ex.id)
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

    const log = {
      id: genId(),
      userId: currentUserId,
      planId: activePlan.id,
      sectionId: section.id,
      sectionName: section.name,
      date: startTime,
      exercises: exerciseLogs,
    }

    const calNum = Number(calorieInput)
    if (calorieInput !== '' && Number.isFinite(calNum) && calNum > 0) {
      log.sessionMetrics = { caloriesBurned: Math.round(calNum) }
    }

    saveLog(log)
    setSaving(false)
    setSaved(true)
    setTimeout(() => onSaved(), 1000)
  }, [section, exerciseSets, startTime, onSaved, currentUserId, activePlan, calorieInput])

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
      <div className="flex items-start gap-4 pt-2">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface2 border border-border text-muted active:scale-95 transition-all flex-shrink-0 mt-1"
        >
          ‹
        </button>
        <div className="flex-1">
          <p className="label mb-1">{section.icon} Workout</p>
          <h1 className="font-display font-black text-4xl uppercase tracking-tight text-text leading-none">
            {section.name}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-muted text-sm">⏱ {formatElapsed(elapsed)}</span>
            <span className="text-muted text-xs">·</span>
            <span className="text-muted text-sm">{completedCount}/{section.exercises.length} done</span>
          </div>
        </div>
      </div>

      <div className="h-1 bg-surface2 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${(completedCount / Math.max(section.exercises.length, 1)) * 100}%`,
            backgroundColor: section.color,
          }}
        />
      </div>

      <div className="flex flex-col gap-4">
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
          <p className="text-muted text-sm">This section has no exercises. Add some in the plan editor.</p>
        </div>
      )}

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
          className="w-full bg-surface2 border border-border rounded-lg p-3 text-text text-sm font-body focus:outline-none focus:border-accent/50 transition-colors"
        />
      </div>

      <div className="card">
        <p className="label mb-2">Session Notes (optional)</p>
        <textarea
          placeholder="How did it feel? Any PRs?"
          className="w-full bg-surface2 border border-border rounded-lg p-3 text-text text-sm font-body resize-none focus:outline-none focus:border-accent/50 transition-colors"
          rows={2}
        />
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 safe-bottom bg-gradient-to-t from-base via-base/95 to-transparent pt-8">
        <div className="max-w-lg mx-auto">
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
    </div>
  )
}
