import React from 'react'
import BottomSheet from '../modals/BottomSheet.jsx'
import { SECTION_TEMPLATES } from '../../data/sectionPresets.js'
import { EXERCISE_LIBRARY, applyTrainingGoalToExercise } from '../../data/exerciseLibrary.js'
import { genId } from '../../utils/storage.js'

export default function SectionPresetGallery({ open, onClose, onPick, trainingGoal = 'general' }) {
  const handlePick = (template) => {
    onPick?.(buildSection(template, trainingGoal))
    onClose?.()
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Add a section">
      <div className="grid grid-cols-2 gap-2.5 pb-2">
        {SECTION_TEMPLATES.map(t => (
          <button
            key={t.id}
            onClick={() => handlePick(t)}
            className="card text-left active:scale-[0.97] transition-all hover:border-border-strong p-3"
            style={{
              borderColor: hexToBg(t.color, 0.25),
              backgroundColor: hexToBg(t.color, 0.06),
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-2"
              style={{
                backgroundColor: hexToBg(t.color, 0.18),
                border: `1px solid ${hexToBg(t.color, 0.35)}`,
              }}
            >
              {t.icon}
            </div>
            <p className="font-display font-bold text-[14px] tracking-tightish text-text-primary">
              {t.name}
            </p>
            <p className="caption mt-0.5 line-clamp-2">{t.description}</p>
            {t.exercises.length > 0 && (
              <p className="caption mt-1 tabular text-text-tertiary">
                {t.exercises.length} exercises
              </p>
            )}
          </button>
        ))}
      </div>
    </BottomSheet>
  )
}

export function buildSection(template, trainingGoal = 'general') {
  const exercises = template.exercises
    .map(name => EXERCISE_LIBRARY.find(e => e.name === name))
    .filter(Boolean)
    .map(libEntry => {
      const { sets, reps } = applyTrainingGoalToExercise(libEntry, trainingGoal)
      return {
        id: genId(),
        name: libEntry.name,
        targetSets: sets,
        targetReps: reps,
      }
    })

  return {
    id: genId(),
    name: template.name,
    icon: template.icon,
    color: template.color,
    exercises,
  }
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
