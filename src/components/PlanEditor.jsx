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
      <div className="flex flex-col gap-5 slide-up pt-4">
        <p className="text-muted">Plan not found.</p>
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
    <div className="flex flex-col gap-5 slide-up pb-28">
      <div className="flex items-center gap-4 pt-2">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface2 border border-border text-muted active:scale-95 transition-all flex-shrink-0"
        >
          ‹
        </button>
        <div>
          <p className="label mb-0.5">Edit plan</p>
          <h1 className="font-display font-black text-3xl uppercase tracking-tight text-text">
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
            className="input-field text-left"
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
              className="input-field text-center"
            />
          </div>
          <div>
            <p className="label mb-1.5">End date</p>
            <input
              type="date"
              value={draft.endDate || ''}
              onChange={e => updateField('endDate', e.target.value || null)}
              className="input-field text-center"
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
            <span className="text-2xl">{section.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-xl uppercase text-text truncate">{section.name}</p>
              <p className="text-muted text-xs">{section.exercises.length} exercises</p>
            </div>
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: section.color }}
            />
            <span className={`text-muted transition-transform ${expandedSection === section.id ? 'rotate-180' : ''}`}>
              ▾
            </span>
          </button>

          {expandedSection === section.id && (
            <div className="mt-4 fade-in">
              <div className="grid grid-cols-[1fr_auto_auto] gap-2 mb-4">
                <input
                  type="text"
                  value={section.name}
                  onChange={e => updateSection(section.id, { name: e.target.value })}
                  placeholder="Section name"
                  className="input-field text-left"
                />
                <select
                  value={section.icon}
                  onChange={e => updateSection(section.id, { icon: e.target.value })}
                  className="bg-surface2 border border-border rounded-lg px-2 text-text"
                >
                  {SECTION_PRESETS.icons.map(i => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </select>
                <button
                  onClick={() => removeSection(section.id)}
                  className="w-10 h-10 flex items-center justify-center text-muted rounded-lg bg-surface2 border border-border active:scale-90 text-lg"
                  title="Delete section"
                >
                  🗑
                </button>
              </div>

              <p className="label mb-2">Exercises</p>
              <div className="flex flex-col gap-3">
                {section.exercises.map(ex => (
                  <div key={ex.id} className="bg-surface2 rounded-lg p-3 border border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="text"
                        value={ex.name}
                        onChange={e => updateExercise(section.id, ex.id, 'name', e.target.value)}
                        className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-text text-sm font-body focus:outline-none focus:border-accent/50 transition-colors"
                      />
                      <button
                        onClick={() => removeExercise(section.id, ex.id)}
                        className="w-8 h-8 flex items-center justify-center text-muted rounded-lg bg-surface border border-border active:scale-90 text-lg"
                      >
                        ×
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="label mb-1">Target Sets</p>
                        <input
                          type="number"
                          value={ex.targetSets}
                          onChange={e => updateExercise(section.id, ex.id, 'targetSets', e.target.value)}
                          min="1"
                          className="input-field"
                        />
                      </div>
                      <div>
                        <p className="label mb-1">Target Reps</p>
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
                className="mt-3 w-full py-2.5 rounded-lg border border-dashed border-border text-muted text-sm font-body flex items-center justify-center gap-2 active:scale-95 transition-all hover:border-accent/30 hover:text-accent/60"
              >
                + Add Exercise
              </button>
            </div>
          )}
        </div>
      ))}

      <button
        onClick={addSection}
        className="w-full py-3 rounded-xl border-2 border-dashed border-border text-muted font-display font-bold uppercase tracking-widest active:scale-95 transition-all hover:border-accent/40 hover:text-accent"
      >
        + Add Section
      </button>

      {/* Sticky save */}
      <div className="fixed bottom-0 left-0 right-0 p-4 safe-bottom bg-gradient-to-t from-base via-base/95 to-transparent pt-8">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleSave}
            className="btn-primary w-full py-4 text-xl"
          >
            Save Plan
          </button>
        </div>
      </div>
    </div>
  )
}
