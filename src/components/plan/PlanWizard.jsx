import React, { useState, useMemo } from 'react'
import { useUser } from '../../context/UserContext.jsx'
import { usePlan } from '../../context/PlanContext.jsx'
import { genId } from '../../utils/storage.js'
import { localDateKey } from '../../utils/stepAnalytics.js'
import { SECTION_TEMPLATES, SPLITS, TRAINING_GOALS } from '../../data/sectionPresets.js'
import { buildSection } from './SectionPresetGallery.jsx'

const STEP_PRESETS = [7000, 8500, 10000, 12000]
const STEPS = ['basics', 'goal', 'split', 'review']
const CARDIO_TEMPLATE_ID = 'cardio'
const GROUP_CLASS_TEMPLATE_ID = 'group-class'

export default function PlanWizard({ onCancel, onCreated }) {
  const { currentUserId } = useUser()
  const { savePlan, activatePlan } = usePlan()

  const [step, setStep] = useState(0)
  const [name, setName] = useState('My Plan')
  const [stepTarget, setStepTarget] = useState(8500)
  const [trainingGoal, setTrainingGoal] = useState('hypertrophy')
  const [splitId, setSplitId] = useState('upper-lower')
  const [includeCardio, setIncludeCardio] = useState(false)
  const [includeGroupClass, setIncludeGroupClass] = useState(false)

  const canNext = useMemo(() => {
    if (step === 0) return name.trim().length > 0
    if (step === 1) return !!trainingGoal
    if (step === 2) return !!splitId
    if (step === 3) return !!splitId && name.trim().length > 0
    return false
  }, [step, name, trainingGoal, splitId])

  // Sections that *will* be created if the user finishes from current state.
  const previewSections = useMemo(() => {
    const split = SPLITS.find(s => s.id === splitId)
    const ids = [...(split?.sectionTemplateIds || [])]
    if (includeCardio && !ids.includes(CARDIO_TEMPLATE_ID)) ids.push(CARDIO_TEMPLATE_ID)
    if (includeGroupClass && !ids.includes(GROUP_CLASS_TEMPLATE_ID)) ids.push(GROUP_CLASS_TEMPLATE_ID)
    return ids
      .map(id => SECTION_TEMPLATES.find(t => t.id === id))
      .filter(Boolean)
      .map(t => buildSection(t, trainingGoal))
  }, [splitId, includeCardio, includeGroupClass, trainingGoal])

  const handleFinish = () => {
    const plan = {
      id: genId(),
      userId: currentUserId,
      name: name.trim() || 'My Plan',
      startDate: localDateKey(),
      endDate: null,
      isActive: false,
      trainingGoal,
      splitId,
      dailyStepTarget: stepTarget || null,
      sections: previewSections,
    }
    savePlan(plan)
    activatePlan(plan.id)
    onCreated?.(plan.id)
  }

  const next = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else handleFinish()
  }
  const back = () => {
    if (step === 0) onCancel?.()
    else setStep(s => s - 1)
  }

  return (
    <div className="flex flex-col gap-5 slide-up pt-5 pb-32">
      <div className="flex items-center gap-3">
        <button onClick={back} className="btn-icon flex-shrink-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <path d="m15 6-6 6 6 6" />
          </svg>
        </button>
        <div className="min-w-0 flex-1">
          <p className="caption">Step {step + 1} of {STEPS.length}</p>
          <h1 className="font-display font-bold text-[28px] leading-[1.1] tracking-tighter2 text-text-primary truncate">
            {step === 0 && 'Plan basics'}
            {step === 1 && 'Training goal'}
            {step === 2 && 'Pick your split'}
            {step === 3 && 'Review & create'}
          </h1>
        </div>
      </div>

      <ProgressDots count={STEPS.length} active={step} />

      {step === 0 && (
        <BasicsStep
          name={name} setName={setName}
          stepTarget={stepTarget} setStepTarget={setStepTarget}
        />
      )}
      {step === 1 && (
        <GoalStep value={trainingGoal} onChange={setTrainingGoal} />
      )}
      {step === 2 && (
        <SplitStep
          splitId={splitId}
          onChange={setSplitId}
          includeCardio={includeCardio}
          onToggleCardio={() => setIncludeCardio(v => !v)}
          includeGroupClass={includeGroupClass}
          onToggleGroupClass={() => setIncludeGroupClass(v => !v)}
        />
      )}
      {step === 3 && (
        <ReviewStep
          name={name}
          trainingGoal={trainingGoal}
          stepTarget={stepTarget}
          splitId={splitId}
          sections={previewSections}
        />
      )}

      <div className="fixed bottom-0 left-0 right-0 p-4 safe-bottom bg-gradient-to-t from-bg via-bg/95 to-transparent pt-10 z-20">
        <div className="max-w-lg mx-auto flex gap-3">
          <button onClick={back} className="btn-ghost px-6">
            {step === 0 ? 'Cancel' : 'Back'}
          </button>
          <button
            onClick={next}
            disabled={!canNext}
            className="btn-primary flex-1"
          >
            {step === STEPS.length - 1 ? 'Create plan' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ProgressDots({ count, active }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i === active
              ? 'w-8 bg-primary'
              : i < active
              ? 'w-4 bg-primary/50'
              : 'w-4 bg-border-strong'
          }`}
        />
      ))}
    </div>
  )
}

function BasicsStep({ name, setName, stepTarget, setStepTarget }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="card flex flex-col gap-3">
        <div>
          <p className="label mb-1.5">Plan name</p>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Summer Cut"
            className="input-text"
            maxLength={40}
            autoFocus
          />
        </div>
        <p className="caption">You can change this anytime in Edit plan.</p>
      </div>

      <div className="card flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">👣</span>
          <p className="label">Daily step goal</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {STEP_PRESETS.map(p => (
            <button
              key={p}
              onClick={() => setStepTarget(p)}
              className={stepTarget === p ? 'chip-accent' : 'chip'}
            >
              {p.toLocaleString()}
            </button>
          ))}
          <button
            onClick={() => setStepTarget(0)}
            className={!stepTarget ? 'chip-accent' : 'chip'}
          >
            Off
          </button>
        </div>
        <p className="caption">Optional — track wellness alongside workouts.</p>
      </div>
    </div>
  )
}

function GoalStep({ value, onChange }) {
  return (
    <div className="grid grid-cols-1 gap-2.5">
      {TRAINING_GOALS.map(g => {
        const active = value === g.id
        return (
          <button
            key={g.id}
            onClick={() => onChange(g.id)}
            className={`card text-left flex items-center gap-3 active:scale-[0.99] transition-all ${
              active ? 'border-primary/50 bg-primary-soft' : 'hover:border-border-strong'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-surface-3 border border-border flex items-center justify-center text-2xl flex-shrink-0">
              {g.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-display font-bold text-[16px] tracking-tightish ${active ? 'text-primary' : 'text-text-primary'}`}>
                {g.label}
              </p>
              <p className="caption mt-0.5 truncate">{g.sub}</p>
            </div>
            {active && (
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
            )}
          </button>
        )
      })}
      <p className="caption px-1 mt-1">
        Sets your default reps. You can override per exercise.
      </p>
    </div>
  )
}

function SplitStep({ splitId, onChange, includeCardio, onToggleCardio, includeGroupClass, onToggleGroupClass }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="caption px-1">
        Choose how to organize your week. You can change this later.
      </p>
      <div className="flex flex-col gap-2.5">
        {SPLITS.map(s => {
          const active = splitId === s.id
          const sessions = s.sectionTemplateIds
            .map(id => SECTION_TEMPLATES.find(t => t.id === id))
            .filter(Boolean)
          return (
            <button
              key={s.id}
              onClick={() => onChange(s.id)}
              className={`card text-left transition-all active:scale-[0.99] ${
                active ? 'border-primary/55' : 'hover:border-border-strong'
              }`}
              style={active ? {
                backgroundColor: hexToBg(s.color, 0.10),
                borderColor: hexToBg(s.color, 0.45),
              } : {}}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{
                    backgroundColor: hexToBg(s.color, 0.18),
                    border: `1px solid ${hexToBg(s.color, 0.35)}`,
                  }}
                >
                  {s.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`font-display font-bold text-[16px] tracking-tightish ${
                      active ? 'text-primary' : 'text-text-primary'
                    }`}>
                      {s.name}
                    </p>
                    {active && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <p className="caption mt-0.5">{s.sessionsLabel} · {s.bestFor}</p>
                  <p className="body-sm mt-1.5">{s.description}</p>
                </div>
              </div>

              {sessions.length > 0 && (
                <div className="flex flex-col gap-1.5 mt-3 pt-3 border-t border-border">
                  {sessions.map(sess => (
                    <div key={sess.id} className="flex items-center gap-2.5">
                      <span className="text-base flex-shrink-0">{sess.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="body-md font-semibold text-text-primary truncate">
                          {sess.name}
                        </p>
                        <p className="caption tabular truncate">
                          {sess.subtitle} · {sess.exercises.length} exercises
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>

      <p className="label mt-1 px-1">Optional add-ons</p>
      <AddOnToggle
        icon="🏃"
        title="Cardio day"
        sub="Treadmill, bike, rowing, etc."
        tint="rgba(56,189,248,0.14)"
        border="rgba(56,189,248,0.32)"
        active={includeCardio}
        onClick={onToggleCardio}
      />
      <AddOnToggle
        icon="🧘"
        title="Group class day"
        sub="Yoga, HIIT, Pilates, Spin"
        tint="rgba(167,139,250,0.16)"
        border="rgba(167,139,250,0.36)"
        active={includeGroupClass}
        onClick={onToggleGroupClass}
      />
    </div>
  )
}

function AddOnToggle({ icon, title, sub, tint, border, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`card flex items-center gap-3 text-left active:scale-[0.99] transition-all ${
        active ? 'border-primary/45 bg-primary-soft' : 'hover:border-border-strong'
      }`}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
        style={{ backgroundColor: tint, border: `1px solid ${border}` }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display font-bold text-[15px] tracking-tightish text-text-primary">
          {title}
        </p>
        <p className="caption mt-0.5 truncate">{sub}</p>
      </div>
      <span className={`relative inline-flex items-center w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
        active ? 'bg-primary' : 'bg-surface-3 border border-border'
      }`}>
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-card transition-transform ${
            active ? 'translate-x-[22px]' : 'translate-x-0.5'
          }`}
        />
      </span>
    </button>
  )
}

function ReviewStep({ name, trainingGoal, stepTarget, splitId, sections }) {
  const split = SPLITS.find(s => s.id === splitId)
  const goal = TRAINING_GOALS.find(g => g.id === trainingGoal)

  return (
    <div className="flex flex-col gap-3">
      <p className="caption px-1">
        Here's what you'll get. Tap Back if you want to change anything.
      </p>

      <div className="card flex flex-col gap-2.5">
        <div>
          <p className="label">Plan</p>
          <p className="font-display font-bold text-xl tracking-tightish text-text-primary mt-0.5">
            {name}
          </p>
        </div>
        <div className="hairline" />
        <SummaryRow label="Split"   value={split ? `${split.icon}  ${split.name}` : '—'} />
        <SummaryRow label="Goal"    value={goal  ? `${goal.icon}  ${goal.label}`  : '—'} />
        <SummaryRow label="Steps"   value={stepTarget ? `${stepTarget.toLocaleString()} / day` : 'Off'} />
        <SummaryRow label="Sessions" value={`${sections.length}`} />
      </div>

      {sections.map(sess => (
        <div key={sess.id} className="card">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{
                backgroundColor: hexToBg(sess.color, 0.18),
                border: `1px solid ${hexToBg(sess.color, 0.35)}`,
              }}
            >
              {sess.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-[15px] tracking-tightish text-text-primary truncate">
                {sess.name}
              </p>
              <p className="caption tabular truncate">
                {sess.exercises.length} exercises
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            {sess.exercises.map(ex => (
              <div key={ex.id} className="flex items-center justify-between gap-3 py-1">
                <p className="body-md font-semibold text-text-primary truncate">{ex.name}</p>
                <p className="caption tabular text-text-secondary flex-shrink-0">
                  {ex.targetSets} × {ex.targetReps}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}

      {sections.length === 0 && (
        <div className="card text-center py-8">
          <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-surface-3 border border-border flex items-center justify-center text-2xl">
            ✏️
          </div>
          <p className="body-sm">Custom split — no sessions yet</p>
          <p className="caption mt-1">You'll add sections after creating the plan</p>
        </div>
      )}
    </div>
  )
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="caption">{label}</p>
      <p className="body-md font-semibold text-text-primary truncate text-right">{value}</p>
    </div>
  )
}

function hexToBg(hex, alpha = 0.12) {
  if (!hex) return `rgba(110,168,255,${alpha})`
  const m = hex.replace('#', '')
  const v = m.length === 3 ? m.split('').map(c => c + c).join('') : m
  const r = parseInt(v.slice(0, 2), 16)
  const g = parseInt(v.slice(2, 4), 16)
  const b = parseInt(v.slice(4, 6), 16)
  if ([r, g, b].some(n => Number.isNaN(n))) return `rgba(110,168,255,${alpha})`
  return `rgba(${r},${g},${b},${alpha})`
}
