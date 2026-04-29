import React, { useState } from 'react'
import { savePlan, resetPlan } from '../utils/storage.js'
import { DEFAULT_PLAN } from '../data/defaultPlan.js'

export default function PlanSetup({ plan, onBack, onPlanSaved }) {
  const [editedPlan, setEditedPlan] = useState(() => JSON.parse(JSON.stringify(plan)))
  const [expandedDay, setExpandedDay] = useState(plan.days[0]?.id)
  const [showReset, setShowReset] = useState(false)

  const updateDayName = (dayId, name) => {
    setEditedPlan(prev => ({
      ...prev,
      days: prev.days.map(d => d.id === dayId ? { ...d, name } : d),
    }))
  }

  const updateExercise = (dayId, exId, field, value) => {
    setEditedPlan(prev => ({
      ...prev,
      days: prev.days.map(d =>
        d.id !== dayId ? d : {
          ...d,
          exercises: d.exercises.map(e =>
            e.id !== exId ? e : { ...e, [field]: field === 'name' ? value : Number(value) }
          ),
        }
      ),
    }))
  }

  const addExercise = (dayId) => {
    const newEx = {
      id: `ex-${Date.now()}`,
      name: 'New Exercise',
      targetSets: 3,
      targetReps: 10,
    }
    setEditedPlan(prev => ({
      ...prev,
      days: prev.days.map(d =>
        d.id !== dayId ? d : { ...d, exercises: [...d.exercises, newEx] }
      ),
    }))
  }

  const removeExercise = (dayId, exId) => {
    setEditedPlan(prev => ({
      ...prev,
      days: prev.days.map(d =>
        d.id !== dayId ? d : {
          ...d,
          exercises: d.exercises.filter(e => e.id !== exId),
        }
      ),
    }))
  }

  const handleSave = () => {
    savePlan(editedPlan)
    onPlanSaved(editedPlan)
  }

  const handleReset = () => {
    resetPlan()
    onPlanSaved(JSON.parse(JSON.stringify(DEFAULT_PLAN)))
  }

  return (
    <div className="flex flex-col gap-5 slide-up pb-28">
      {/* Header */}
      <div className="flex items-center gap-4 pt-2">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface2 border border-border text-muted active:scale-95 transition-all flex-shrink-0"
        >
          ‹
        </button>
        <div>
          <p className="label mb-0.5">Customize</p>
          <h1 className="font-display font-black text-3xl uppercase tracking-tight text-text">
            Workout Plan
          </h1>
        </div>
      </div>

      {/* Days */}
      {editedPlan.days.map(day => (
        <div key={day.id} className="card">
          {/* Day header */}
          <button
            className="w-full flex items-center gap-3 text-left"
            onClick={() => setExpandedDay(id => id === day.id ? null : day.id)}
          >
            <span className="text-2xl">{day.icon}</span>
            <div className="flex-1">
              <p className="font-display font-bold text-xl uppercase text-text">{day.name}</p>
              <p className="text-muted text-xs">{day.exercises.length} exercises</p>
            </div>
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: day.color }}
            />
            <span className={`text-muted transition-transform ${expandedDay === day.id ? 'rotate-180' : ''}`}>
              ▾
            </span>
          </button>

          {expandedDay === day.id && (
            <div className="mt-4 fade-in">
              {/* Day name edit */}
              <div className="mb-4">
                <p className="label mb-1.5">Day Name</p>
                <input
                  type="text"
                  value={day.name}
                  onChange={e => updateDayName(day.id, e.target.value)}
                  className="input-field text-left"
                />
              </div>

              {/* Exercises */}
              <p className="label mb-2">Exercises</p>
              <div className="flex flex-col gap-3">
                {day.exercises.map(ex => (
                  <div key={ex.id} className="bg-surface2 rounded-lg p-3 border border-border">
                    {/* Exercise name */}
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="text"
                        value={ex.name}
                        onChange={e => updateExercise(day.id, ex.id, 'name', e.target.value)}
                        className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-text text-sm font-body focus:outline-none focus:border-accent/50 transition-colors"
                      />
                      <button
                        onClick={() => removeExercise(day.id, ex.id)}
                        className="w-8 h-8 flex items-center justify-center text-muted rounded-lg bg-surface border border-border active:scale-90 transition-all text-lg"
                      >
                        ×
                      </button>
                    </div>

                    {/* Sets / Reps */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="label mb-1">Target Sets</p>
                        <input
                          type="number"
                          value={ex.targetSets}
                          onChange={e => updateExercise(day.id, ex.id, 'targetSets', e.target.value)}
                          min="1"
                          className="input-field"
                        />
                      </div>
                      <div>
                        <p className="label mb-1">Target Reps</p>
                        <input
                          type="number"
                          value={ex.targetReps}
                          onChange={e => updateExercise(day.id, ex.id, 'targetReps', e.target.value)}
                          min="1"
                          className="input-field"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add exercise */}
              <button
                onClick={() => addExercise(day.id)}
                className="mt-3 w-full py-2.5 rounded-lg border border-dashed border-border text-muted text-sm font-body flex items-center justify-center gap-2 active:scale-95 transition-all hover:border-accent/30 hover:text-accent/60"
              >
                + Add Exercise
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Reset to default */}
      <div className="card border-red-900/40">
        <p className="font-body font-semibold text-text mb-1">Reset to Default Plan</p>
        <p className="text-muted text-xs mb-3">This will restore the original exercises but won't delete your workout logs.</p>
        {!showReset ? (
          <button
            onClick={() => setShowReset(true)}
            className="text-red-400 text-sm font-body font-medium bg-red-900/20 border border-red-900/40 px-4 py-2 rounded-lg active:scale-95 transition-all"
          >
            Reset Plan
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="flex-1 text-red-400 text-sm font-body font-medium bg-red-900/20 border border-red-900/40 px-4 py-2.5 rounded-lg active:scale-95 transition-all"
            >
              Yes, Reset
            </button>
            <button
              onClick={() => setShowReset(false)}
              className="flex-1 btn-ghost text-sm"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Save sticky */}
      <div className="fixed bottom-0 left-0 right-0 p-4 safe-bottom bg-gradient-to-t from-base via-base/95 to-transparent pt-8">
        <button
          onClick={handleSave}
          className="btn-primary w-full py-4 text-xl"
        >
          Save Plan
        </button>
      </div>
    </div>
  )
}
