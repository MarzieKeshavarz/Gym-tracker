import React, { useState, useCallback } from 'react'

export default function ExerciseLogger({ exercise, lastEntry, sets, onChange }) {
  const [expanded, setExpanded] = useState(true)

  const updateSet = useCallback((idx, field, value) => {
    const next = sets.map((s, i) => i === idx ? { ...s, [field]: value } : s)
    onChange(next)
  }, [sets, onChange])

  const addSet = useCallback(() => {
    // Clone last set values as default for new set
    const prev = sets[sets.length - 1] || { weight: '', reps: '' }
    onChange([...sets, { weight: prev.weight, reps: prev.reps }])
  }, [sets, onChange])

  const removeSet = useCallback((idx) => {
    if (sets.length <= 1) return
    onChange(sets.filter((_, i) => i !== idx))
  }, [sets, onChange])

  // Quick fill: copy last session weights into all sets
  const copyLastSession = useCallback(() => {
    if (!lastEntry) return
    const next = sets.map((s, i) => {
      const last = lastEntry.sets[i] || lastEntry.sets[lastEntry.sets.length - 1]
      return last ? { weight: last.weight, reps: last.reps } : s
    })
    onChange(next)
  }, [sets, lastEntry, onChange])

  const isComplete = sets.every(s => s.weight !== '' && s.reps !== '')
  const completedSets = sets.filter(s => s.weight !== '' || s.reps !== '').length

  return (
    <div className={`card transition-all ${isComplete ? 'border-accent/30' : ''}`}>
      {/* Header row */}
      <button
        className="w-full flex items-center gap-3 text-left"
        onClick={() => setExpanded(e => !e)}
      >
        {/* Completion indicator */}
        <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-colors ${
          isComplete
            ? 'border-accent bg-accent'
            : completedSets > 0
            ? 'border-accent/50 bg-accent/10'
            : 'border-border'
        }`}>
          {isComplete && <span className="text-base text-xs font-bold">✓</span>}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-lg uppercase tracking-wide text-text leading-tight">
            {exercise.name}
          </p>
          <p className="text-muted text-xs mt-0.5">
            {exercise.targetSets} × {exercise.targetReps} target
            {completedSets > 0 && ` · ${completedSets}/${sets.length} sets logged`}
          </p>
        </div>

        {/* Last session quick view */}
        {lastEntry && (
          <div className="text-right flex-shrink-0">
            <p className="text-muted text-xs">Last</p>
            <p className="text-accent font-body font-semibold text-sm">
              {lastEntry.sets[0]?.weight || '—'}
              {lastEntry.sets[0]?.weight ? 'kg' : ''}
            </p>
          </div>
        )}

        <span className={`text-muted transition-transform ${expanded ? 'rotate-180' : ''} ml-1`}>
          ▾
        </span>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="mt-4 fade-in">
          {/* Last session banner */}
          {lastEntry && (
            <div className="bg-accent/8 border border-accent/15 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-accent text-xs font-body font-semibold uppercase tracking-wider">
                  Last Session
                </p>
                <button
                  onClick={copyLastSession}
                  className="text-accent text-xs font-body font-medium bg-accent/10 px-2 py-1 rounded active:scale-95 transition-all"
                >
                  Copy →
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {lastEntry.sets.map((s, i) => (
                  <span
                    key={i}
                    className="bg-surface2 rounded px-2 py-1 text-text text-sm font-body"
                  >
                    {s.weight || '—'}{s.weight ? 'kg' : ''} × {s.reps || '—'}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Set headers */}
          <div className="grid grid-cols-12 gap-2 mb-2 px-1">
            <p className="col-span-2 label text-center">SET</p>
            <p className="col-span-5 label text-center">WEIGHT (kg)</p>
            <p className="col-span-4 label text-center">REPS</p>
            <p className="col-span-1"></p>
          </div>

          {/* Sets */}
          <div className="flex flex-col gap-2">
            {sets.map((set, idx) => (
              <SetRow
                key={idx}
                index={idx}
                set={set}
                lastSet={lastEntry?.sets[idx]}
                onWeightChange={v => updateSet(idx, 'weight', v)}
                onRepsChange={v => updateSet(idx, 'reps', v)}
                onRemove={() => removeSet(idx)}
                canRemove={sets.length > 1}
              />
            ))}
          </div>

          {/* Add set button */}
          <button
            onClick={addSet}
            className="mt-3 w-full py-2.5 rounded-lg border border-dashed border-border text-muted text-sm font-body flex items-center justify-center gap-2 active:scale-95 transition-all hover:border-accent/30 hover:text-accent/60"
          >
            <span>+</span> Add Set
          </button>
        </div>
      )}
    </div>
  )
}

function SetRow({ index, set, lastSet, onWeightChange, onRepsChange, onRemove, canRemove }) {
  const hasValues = set.weight !== '' || set.reps !== ''

  return (
    <div className={`grid grid-cols-12 gap-2 items-center rounded-lg px-1 py-1 transition-colors ${
      hasValues && set.weight !== '' && set.reps !== '' ? 'bg-accent/5' : ''
    }`}>
      {/* Set number */}
      <div className="col-span-2 flex items-center justify-center">
        <span className={`font-display font-bold text-lg w-8 h-8 flex items-center justify-center rounded-md ${
          set.weight !== '' && set.reps !== '' ? 'bg-accent text-base' : 'bg-surface2 text-muted'
        }`}>
          {index + 1}
        </span>
      </div>

      {/* Weight input */}
      <div className="col-span-5">
        <input
          type="number"
          inputMode="decimal"
          placeholder={lastSet?.weight || '0'}
          value={set.weight}
          onChange={e => onWeightChange(e.target.value)}
          className="input-field text-lg font-body font-semibold"
          step="0.5"
          min="0"
        />
      </div>

      {/* Reps input */}
      <div className="col-span-4">
        <input
          type="number"
          inputMode="numeric"
          placeholder={lastSet?.reps || '0'}
          value={set.reps}
          onChange={e => onRepsChange(e.target.value)}
          className="input-field text-lg font-body font-semibold"
          min="0"
        />
      </div>

      {/* Remove button */}
      <div className="col-span-1 flex items-center justify-center">
        {canRemove && (
          <button
            onClick={onRemove}
            className="w-6 h-6 flex items-center justify-center text-muted text-lg active:scale-90 transition-all rounded"
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}
