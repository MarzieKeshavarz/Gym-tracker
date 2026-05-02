import React, { useState, useMemo, useEffect } from 'react'
import BottomSheet from '../modals/BottomSheet.jsx'
import { EXERCISE_LIBRARY, MUSCLE_GROUPS, searchExercises } from '../../data/exerciseLibrary.js'
import { genId } from '../../utils/storage.js'

const ALL = 'All'

export default function ExercisePickerSheet({ open, onClose, onPick, trainingGoal = 'general' }) {
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState(ALL)

  useEffect(() => {
    if (!open) {
      setQuery('')
      setGroup(ALL)
    }
  }, [open])

  const results = useMemo(() => searchExercises(query, group), [query, group])

  const buildExercise = (libEntry) => {
    const sets = applyGoalSets(libEntry, trainingGoal)
    const reps = applyGoalReps(libEntry, trainingGoal)
    return {
      id: genId(),
      name: libEntry.name,
      targetSets: sets,
      targetReps: reps,
    }
  }

  const handlePick = (libEntry) => {
    onPick?.(buildExercise(libEntry))
    onClose?.()
  }

  const handleCustom = () => {
    const name = (query.trim()) || 'New Exercise'
    onPick?.({
      id: genId(),
      name,
      targetSets: 3,
      targetReps: 10,
    })
    onClose?.()
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Add exercise">
      <div className="flex flex-col gap-3 pb-2">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search e.g. press, row, squat…"
            className="input-text pr-12"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-text-tertiary hover:text-text-primary"
              aria-label="Clear"
            >
              ×
            </button>
          )}
        </div>

        <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 no-scrollbar">
          {[ALL, ...MUSCLE_GROUPS].map(g => {
            const active = group === g
            return (
              <button
                key={g}
                onClick={() => setGroup(g)}
                className={`flex-shrink-0 px-3 h-8 rounded-full text-xs font-body font-semibold transition-all active:scale-95 ${
                  active
                    ? 'bg-primary text-white border border-primary'
                    : 'bg-surface-2 border border-border text-text-secondary hover:text-text-primary'
                }`}
              >
                {g}
              </button>
            )
          })}
        </div>

        <div className="flex flex-col gap-1.5 max-h-[50vh] overflow-y-auto -mx-1 px-1">
          {results.length === 0 ? (
            <button
              onClick={handleCustom}
              className="card-flat text-left active:scale-[0.99] hover:border-primary/40"
            >
              <p className="body-md font-semibold text-text-primary">
                Add "{query.trim() || 'custom exercise'}"
              </p>
              <p className="caption mt-0.5">Not in the library — tap to add as custom</p>
            </button>
          ) : (
            results.map(ex => (
              <button
                key={`${ex.group}-${ex.name}`}
                onClick={() => handlePick(ex)}
                className="card-flat flex items-center gap-3 text-left active:scale-[0.99] hover:border-border-strong"
              >
                <div className="w-9 h-9 rounded-lg bg-surface-3 border border-border flex items-center justify-center text-base flex-shrink-0">
                  {groupIcon(ex.group)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="body-md font-semibold truncate">{ex.name}</p>
                  <p className="caption tabular truncate">{ex.group} · default {applyGoalSets(ex, trainingGoal)}×{applyGoalReps(ex, trainingGoal)}</p>
                </div>
                <span className="text-text-tertiary text-lg">+</span>
              </button>
            ))
          )}

          {results.length > 0 && query.trim() && (
            <button
              onClick={handleCustom}
              className="card-flat text-left active:scale-[0.99] hover:border-primary/40 border-dashed mt-1"
            >
              <p className="body-md font-semibold text-text-primary">
                Add "{query.trim()}" as custom
              </p>
              <p className="caption mt-0.5">Not in this list? Add it your own way.</p>
            </button>
          )}
        </div>
      </div>
    </BottomSheet>
  )
}

function applyGoalSets(libEntry, goal) {
  if (libEntry.defaultSets === 1 && libEntry.defaultReps === 1) return 1
  if (goal === 'strength')   return 5
  if (goal === 'hypertrophy')return 4
  if (goal === 'endurance')  return 3
  return libEntry.defaultSets
}

function applyGoalReps(libEntry, goal) {
  if (libEntry.defaultSets === 1 && libEntry.defaultReps === 1) return 1
  if (goal === 'strength')   return 5
  if (goal === 'hypertrophy')return 10
  if (goal === 'endurance')  return 15
  return libEntry.defaultReps
}

function groupIcon(group) {
  switch (group) {
    case 'Chest':     return '🏋️'
    case 'Back':      return '🔱'
    case 'Shoulders': return '💪'
    case 'Arms':      return '💪'
    case 'Legs':      return '🦵'
    case 'Glutes':    return '🍑'
    case 'Core':      return '🧱'
    case 'Cardio':    return '🏃'
    case 'Full Body': return '⚡'
    default:          return '🏋️'
  }
}
