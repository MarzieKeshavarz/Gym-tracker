import React, { useState } from 'react'
import { usePlan } from '../context/PlanContext.jsx'
import { genId } from '../utils/storage.js'
import { SECTION_PRESETS } from '../data/defaultPlan.js'

export default function PlanEditor({ planId, onBack }) {
  const { plans, savePlan } = usePlan()
  const initial = plans.find(p => p.id === planId)

  const [draft, setDraft] = useState(() =>
    initial ? JSON.parse(JSON.stringify(initial)) : null
  )
  const [expandedSection, setExpandedSection] = useState(initial?.sections[0]?.id || null)

  if (!draft) {
    return (
      <div className="flex flex-col gap-5 slide-up pt-5">
        <p className="body-sm">Plan not found.</p>
        <button onClick={onBack} className="btn-ghost">‹ Back</button>
      </div>
    )
  }

  const updateField = (field, value) => setDraft(d => ({ ...d, [field]: value }))

  const updateSection = (sectionId, patch) => {
    setDraft(d => ({
      ...d,
      sections: d.sections.map(s => s.id === sectionId ? { ...s, ...patch } : s),
    }))
  }

  const updateExercise = (sectionId, exId, field, value) => {
    setDraft(d => ({
      ...d,
      sections: d.sections.map(s =>
        s.id !== sectionId ? s : {
          ...s,
          exercises: s.exercises.map(e =>
            e.id !== exId
              ? e
              : { ...e, [field]: field === 'name' ? value : Number(value) }
          ),
        }
      ),
    }))
  }

  const addSection = () => {
    const newSection = {
      id: genId(),
      name: 'New Section',
      icon: SECTION_PRESETS.icons[draft.sections.length % SECTION_PRESETS.icons.length],
      color: SECTION_PRESETS.colors[draft.sections.length % SECTION_PRESETS.colors.length],
      exercises: [],
    }
    setDraft(d => ({ ...d, sections: [...d.sections, newSection] }))
    setExpandedSection(newSection.id)
  }

  const removeSection = (sectionId) => {
    setDraft(d => ({ ...d, sections: d.sections.filter(s => s.id !== sectionId) }))
  }

  const addExercise = (sectionId) => {
    setDraft(d => ({
      ...d,
      sections: d.sections.map(s =>
        s.id !== sectionId ? s : {
          ...s,
          exercises: [
            ...s.exercises,
            { id: genId(), name: 'New Exercise', targetSets: 3, targetReps: 10 },
          ],
        }
      ),
    }))
  }

  const removeExercise = (sectionId, exId) => {
    setDraft(d => ({
      ...d,
      sections: d.sections.map(s =>
        s.id !== sectionId ? s : { ...s, exercises: s.exercises.filter(e => e.id !== exId) }
      ),
    }))
  }

  const handleSave = () => {
    savePlan(draft)
    onBack()
  }

  return (
    <div className="flex flex-col gap-5 slide-up pt-5 pb-32">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="btn-icon flex-shrink-0"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <path d="m15 6-6 6 6 6" />
          </svg>
        </button>
        <div className="min-w-0">
          <p className="caption">Edit plan</p>
          <h1 className="font-display font-bold text-[28px] leading-[1.1] tracking-tighter2 text-text-primary truncate">
            {draft.name || 'Plan'}
          </h1>
        </div>
      </div>

      {/* Plan meta */}
      <div className="card flex flex-col gap-3">
        <div>
          <p className="label mb-1.5">Plan name</p>
          <input
            type="text"
            value={draft.name}
            onChange={e => updateField('name', e.target.value)}
            placeholder="e.g. Summer Cut"
            className="input-text"
            maxLength={40}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="label mb-1.5">Start date</p>
            <input
              type="date"
              value={draft.startDate || ''}
              onChange={e => updateField('startDate', e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <p className="label mb-1.5">End date</p>
            <input
              type="date"
              value={draft.endDate || ''}
              onChange={e => updateField('endDate', e.target.value || null)}
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* Sections */}
      {draft.sections.map(section => (
        <div key={section.id} className="card">
          <button
            className="w-full flex items-center gap-3 text-left"
            onClick={() => setExpandedSection(id => id === section.id ? null : section.id)}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{
                backgroundColor: hexToBg(section.color, 0.14),
                border: `1px solid ${hexToBg(section.color, 0.3)}`,
              }}
            >
              {section.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-[16px] tracking-tightish text-text-primary truncate">{section.name}</p>
              <p className="caption mt-0.5 tabular">{section.exercises.length} exercises</p>
            </div>
            <svg
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className={`w-5 h-5 text-text-tertiary transition-transform ${expandedSection === section.id ? 'rotate-180' : ''}`}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {expandedSection === section.id && (
            <div className="mt-4 fade-in">
              <div className="grid grid-cols-[1fr_auto_auto] gap-2 mb-4">
                <input
                  type="text"
                  value={section.name}
                  onChange={e => updateSection(section.id, { name: e.target.value })}
                  placeholder="Section name"
                  className="input-text"
                />
                <select
                  value={section.icon}
                  onChange={e => updateSection(section.id, { icon: e.target.value })}
                  className="bg-surface-3 border border-border rounded-xl px-2 h-12 text-text-primary text-base focus:outline-none focus:border-primary/50"
                >
                  {SECTION_PRESETS.icons.map(i => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </select>
                <button
                  onClick={() => removeSection(section.id)}
                  className="btn-icon w-12 h-12"
                  title="Delete section"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <path d="M3 6h18" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>

              <p className="label mb-2">Exercises</p>
              <div className="flex flex-col gap-3">
                {section.exercises.map(ex => (
                  <div key={ex.id} className="bg-surface-2 rounded-xl p-3 border border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="text"
                        value={ex.name}
                        onChange={e => updateExercise(section.id, ex.id, 'name', e.target.value)}
                        className="flex-1 bg-surface-3 border border-border rounded-lg px-3 h-11 text-[15px] font-body font-semibold focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                        style={{ color: '#F4F6FA' }}
                      />
                      <button
                        onClick={() => removeExercise(section.id, ex.id)}
                        className="w-9 h-9 flex items-center justify-center text-text-secondary rounded-lg bg-surface border border-border active:scale-90 hover:text-danger hover:border-danger/30"
                      >
                        ×
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="label mb-1">Target sets</p>
                        <input
                          type="number"
                          value={ex.targetSets}
                          onChange={e => updateExercise(section.id, ex.id, 'targetSets', e.target.value)}
                          min="1"
                          className="input-field"
                        />
                      </div>
                      <div>
                        <p className="label mb-1">Target reps</p>
                        <input
                          type="number"
                          value={ex.targetReps}
                          onChange={e => updateExercise(section.id, ex.id, 'targetReps', e.target.value)}
                          min="1"
                          className="input-field"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => addExercise(section.id)}
                className="mt-3 w-full h-11 rounded-xl border border-dashed border-border-strong text-text-secondary text-sm font-body font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:border-primary/40 hover:text-primary hover:bg-primary-soft"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Add exercise
              </button>
            </div>
          )}
        </div>
      ))}

      <button
        onClick={addSection}
        className="w-full h-14 rounded-2xl border border-dashed border-border-strong text-text-secondary font-display font-semibold text-sm tracking-tightish active:scale-[0.98] transition-all hover:border-primary/40 hover:text-primary hover:bg-primary-soft inline-flex items-center justify-center gap-2"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Add section
      </button>

      {/* Sticky save */}
      <div className="fixed bottom-0 left-0 right-0 p-4 safe-bottom bg-gradient-to-t from-bg via-bg/95 to-transparent pt-10 z-20">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleSave}
            className="w-full h-14 rounded-2xl bg-primary-gradient text-white font-display font-bold text-base tracking-tightish shadow-glow active:scale-[0.98] transition-all"
          >
            Save plan
          </button>
        </div>
      </div>
    </div>
  )
}

function hexToBg(hex, alpha = 0.12) {
  if (!hex) return `rgba(110,168,255,${alpha})`
  const m = hex.replace('#', '')
  const v = m.length === 3
    ? m.split('').map(c => c + c).join('')
    : m
  const r = parseInt(v.slice(0, 2), 16)
  const g = parseInt(v.slice(2, 4), 16)
  const b = parseInt(v.slice(4, 6), 16)
  if ([r, g, b].some(n => Number.isNaN(n))) return `rgba(110,168,255,${alpha})`
  return `rgba(${r},${g},${b},${alpha})`
}
