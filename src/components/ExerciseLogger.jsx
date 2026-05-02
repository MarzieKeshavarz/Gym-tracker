import React, { useState, useCallback } from 'react'

export default function ExerciseLogger({ exercise, lastEntry, sets, onChange }) {
  const [expanded, setExpanded] = useState(true)

  const updateSet = useCallback((idx, field, value) => {
    const next = sets.map((s, i) => i === idx ? { ...s, [field]: value } : s)
    onChange(next)
  }, [sets, onChange])

  const addSet = useCallback(() => {
    const prev = sets[sets.length - 1] || { weight: '', reps: '' }
    onChange([...sets, { weight: prev.weight, reps: prev.reps }])
  }, [sets, onChange])

  const removeSet = useCallback((idx) => {
    if (sets.length <= 1) return
    onChange(sets.filter((_, i) => i !== idx))
  }, [sets, onChange])

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
    <div className={`card transition-all ${isComplete ? 'border-primary/35' : ''}`}>
      {/* Header */}
      <button
        className="w-full flex items-center gap-3 text-left"
        onClick={() => setExpanded(e => !e)}
      >
        {/* Completion indicator */}
        <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-all duration-300 ${
          isComplete
            ? 'border-primary bg-primary scale-110 shadow-glow'
            : completedSets > 0
            ? 'border-primary/50 bg-primary-soft'
            : 'border-border-strong'
        }`}>
          {isComplete && (
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
              <path className="check-draw" d="M20 6 9 17l-5-5" />
            </svg>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-[16px] tracking-tightish text-text-primary leading-tight">
            {exercise.name}
          </p>
          <p className="caption mt-0.5 tabular">
            {exercise.targetSets} × {exercise.targetReps} target
            {completedSets > 0 && <> · <span className="text-text-secondary">{completedSets}/{sets.length} sets</span></>}
          </p>
        </div>

        {lastEntry && (
          <div className="text-right flex-shrink-0 mr-1">
            <p className="caption">Last</p>
            <p className="font-body font-semibold text-sm text-primary tabular mt-0.5">
              {lastEntry.sets[0]?.weight || '—'}
              {lastEntry.sets[0]?.weight ? <span className="text-text-tertiary"> kg</span> : ''}
            </p>
          </div>
        )}

        <svg
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className={`w-5 h-5 text-text-tertiary transition-transform ${expanded ? 'rotate-180' : ''}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/* Expanded */}
      {expanded && (
        <div className="mt-4 fade-in">
          {lastEntry && (
            <div className="bg-surface-3 border border-border rounded-xl p-3 mb-4">
              <div className="flex items-center justify-between mb-2.5">
                <p className="label">Last session</p>
                <button
                  onClick={copyLastSession}
                  className="text-primary text-[11px] font-body font-semibold uppercase tracking-label bg-primary-soft border border-primary/25 px-2.5 h-7 rounded-lg active:scale-95 transition-all inline-flex items-center gap-1"
                >
                  Copy
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                    <path d="m9 6 6 6-6 6" />
                  </svg>
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {lastEntry.sets.map((s, i) => (
                  <span key={i} className="chip">
                    <span className="tabular text-text-primary font-semibold">{s.weight || '—'}</span>
                    {s.weight ? <span className="text-text-tertiary">kg</span> : null}
                    <span className="text-text-tertiary">×</span>
                    <span className="tabular text-text-primary font-semibold">{s.reps || '—'}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Headers */}
          <div className="grid grid-cols-12 gap-2 mb-2 px-1">
            <p className="col-span-2 label text-center">Set</p>
            <p className="col-span-5 label text-center">Weight (kg)</p>
            <p className="col-span-4 label text-center">Reps</p>
            <p className="col-span-1"></p>
          </div>

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

          <button
            onClick={addSet}
            className="mt-3 w-full h-11 rounded-xl border border-dashed border-border-strong text-text-secondary text-sm font-body font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:border-primary/40 hover:text-primary hover:bg-primary-soft"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add set
          </button>
        </div>
      )}
    </div>
  )
}

function SetRow({ index, set, lastSet, onWeightChange, onRepsChange, onRemove, canRemove }) {
  const isFilled = set.weight !== '' && set.reps !== ''
  const wasFilledRef = React.useRef(isFilled)
  const [justFilled, setJustFilled] = React.useState(false)

  React.useEffect(() => {
    if (isFilled && !wasFilledRef.current) {
      setJustFilled(true)
      const t = setTimeout(() => setJustFilled(false), 700)
      wasFilledRef.current = true
      return () => clearTimeout(t)
    }
    if (!isFilled) wasFilledRef.current = false
  }, [isFilled])

  return (
    <div className={`grid grid-cols-12 gap-2 items-center rounded-xl px-1 py-1 transition-colors duration-300 ${
      isFilled ? 'bg-primary-soft' : ''
    }`}>
      <div className="col-span-2 flex items-center justify-center">
        <span className={`relative font-display font-bold text-base w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-300 tabular ${
          isFilled
            ? 'bg-primary text-white shadow-glow scale-105'
            : 'bg-surface-3 border border-border text-text-secondary'
        } ${justFilled ? 'ripple-once' : ''}`}>
          {index + 1}
        </span>
      </div>

      <div className="col-span-5">
        <input
          type="number"
          inputMode="decimal"
          placeholder={lastSet?.weight || '0'}
          value={set.weight}
          onChange={e => onWeightChange(e.target.value)}
          className="input-field text-lg"
          step="0.5"
          min="0"
        />
      </div>

      <div className="col-span-4">
        <input
          type="number"
          inputMode="numeric"
          placeholder={lastSet?.reps || '0'}
          value={set.reps}
          onChange={e => onRepsChange(e.target.value)}
          className="input-field text-lg"
          min="0"
        />
      </div>

      <div className="col-span-1 flex items-center justify-center">
        {canRemove && (
          <button
            onClick={onRemove}
            className="w-7 h-7 flex items-center justify-center text-text-tertiary text-base active:scale-90 transition-all rounded hover:text-danger hover:bg-danger/10"
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}
