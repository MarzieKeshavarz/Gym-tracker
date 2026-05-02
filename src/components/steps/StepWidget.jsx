import React, { useState } from 'react'
import StepRing from './StepRing.jsx'
import StepLogSheet from './StepLogSheet.jsx'
import { useStepProgress } from '../../hooks/useStepProgress.js'

export default function StepWidget({ onSetGoal }) {
  const { today, hasTarget } = useStepProgress()
  const [logOpen, setLogOpen] = useState(false)

  if (!hasTarget) {
    return (
      <button
        onClick={onSetGoal}
        className="card lift press-pop text-left flex items-center gap-3 w-full"
      >
        <div className="w-11 h-11 rounded-xl bg-primary-soft border border-primary/25 flex items-center justify-center text-2xl flex-shrink-0">
          👣
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-[15px] tracking-tightish text-text-primary">
            Set a daily step goal
          </p>
          <p className="caption mt-0.5">Track wellness alongside workouts</p>
        </div>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-text-tertiary flex-shrink-0">
          <path d="m9 6 6 6-6 6" />
        </svg>
      </button>
    )
  }

  const reached = today.steps >= today.target

  return (
    <>
      <div className="card flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">👣</span>
            <p className="label">Steps today</p>
          </div>
          <span className={reached ? 'chip-accent' : 'chip'}>
            {reached ? 'Goal reached' : `${today.percent}%`}
          </span>
        </div>

        <div className="flex items-center gap-5">
          <StepRing steps={today.steps} target={today.target} size={148} stroke={11} />
          <div className="flex-1 min-w-0 flex flex-col gap-3">
            <Stat
              label="Remaining"
              value={reached ? 0 : today.remaining}
              suffix="steps"
            />
            <button
              onClick={() => setLogOpen(true)}
              className="btn-primary w-full"
            >
              {today.log ? 'Update steps' : 'Log steps'}
            </button>
          </div>
        </div>
      </div>

      <StepLogSheet
        open={logOpen}
        onClose={() => setLogOpen(false)}
        editing={today.log || null}
      />
    </>
  )
}

function Stat({ label, value, suffix }) {
  return (
    <div>
      <p className="caption">{label}</p>
      <p className="font-display font-bold text-2xl tabular tracking-tighter2 text-text-primary leading-none mt-1">
        {value.toLocaleString()}
        {suffix && <span className="text-sm font-body font-medium text-text-tertiary ml-1.5">{suffix}</span>}
      </p>
    </div>
  )
}
