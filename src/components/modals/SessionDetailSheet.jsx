import React, { useState } from 'react'
import BottomSheet from './BottomSheet.jsx'
import ConfirmDialog from './ConfirmDialog.jsx'
import { usePlan } from '../../context/PlanContext.jsx'
import { formatDate, formatTime } from '../../utils/storage.js'

// View, edit, or delete a single session.
// `log` is the log entity; `onEdit(log)` and `onDelete(log)` are callbacks
// the parent supplies for routing into the editor / triggering the
// optimistic delete + undo flow.
export default function SessionDetailSheet({
  open,
  onClose,
  log,
  onEdit,
  onDelete,
}) {
  const { activePlan } = usePlan()
  const [confirmOpen, setConfirmOpen] = useState(false)

  if (!log) return null

  const section = activePlan?.sections.find(s => s.id === log.sectionId)
  const canEdit = !!section
  const exerciseCount = log.exercises?.length || 0
  const totalSets = (log.exercises || []).reduce(
    (sum, ex) => sum + (ex.sets?.length || 0), 0
  )
  const totalVolume = (log.exercises || []).reduce(
    (sum, ex) => sum + (ex.sets || []).reduce(
      (s, set) => s + (Number(set.weight) || 0) * (Number(set.reps) || 0), 0
    ), 0
  )
  const calories = log.sessionMetrics?.caloriesBurned || 0

  const handleDeleteClick = () => setConfirmOpen(true)
  const handleConfirmDelete = () => {
    setConfirmOpen(false)
    onClose?.()
    // Defer the actual delete one tick so the sheet close animation runs
    // before the undo toast shows.
    setTimeout(() => onDelete?.(log), 220)
  }

  return (
    <>
      <BottomSheet
        open={open}
        onClose={onClose}
        title={section?.name || log.sectionName || 'Session'}
        footer={
          <div className="flex gap-2">
            <button
              onClick={handleDeleteClick}
              className="flex-1 h-12 rounded-xl bg-danger/10 border border-danger/25 text-danger font-display font-semibold text-sm tracking-tightish active:scale-[0.98] transition-all inline-flex items-center justify-center gap-2"
            >
              <TrashIcon /> Delete
            </button>
            <button
              onClick={() => { if (!canEdit) return; onClose?.(); setTimeout(() => onEdit?.(log), 220) }}
              disabled={!canEdit}
              title={canEdit ? 'Edit session' : 'Section was removed from plan'}
              className={`flex-1 h-12 rounded-xl font-display font-bold text-sm tracking-tightish active:scale-[0.98] transition-all inline-flex items-center justify-center gap-2 ${
                canEdit
                  ? 'bg-primary-gradient text-white shadow-glow'
                  : 'bg-surface-2 text-text-tertiary border border-border cursor-not-allowed'
              }`}
            >
              <EditIcon /> Edit
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          {/* Summary card */}
          <div className="card-flat flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{
                backgroundColor: hexToBg(section?.color || '#6EA8FF', 0.16),
                border: `1px solid ${hexToBg(section?.color || '#6EA8FF', 0.3)}`,
              }}
            >
              {section?.icon || '🏋️'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="body-md font-semibold tabular truncate">
                {formatDate(log.date)} <span className="text-text-tertiary">·</span> {formatTime(log.date)}
              </p>
              <p className="caption mt-0.5 tabular">
                {exerciseCount} exercise{exerciseCount === 1 ? '' : 's'} · {totalSets} sets
                {totalVolume > 0 && <> · {Math.round(totalVolume)} kg vol</>}
              </p>
            </div>
          </div>

          {/* Calories pill */}
          {calories > 0 && (
            <div className="card-flat flex items-center gap-3">
              <span className="text-xl">🔥</span>
              <div className="flex-1">
                <p className="caption">Calories</p>
                <p className="font-display font-bold text-lg tabular tracking-tightish text-text-primary leading-none mt-0.5">
                  {calories}<span className="text-text-tertiary text-sm font-medium ml-1">kcal</span>
                </p>
              </div>
            </div>
          )}

          {/* Exercise list */}
          <div>
            <p className="label mb-2">Exercises</p>
            <div className="flex flex-col gap-2">
              {(log.exercises || []).map((ex, i) => (
                <div key={i} className="card-flat">
                  <p className="body-md font-semibold truncate">{ex.exerciseName}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(ex.sets || []).map((s, j) => (
                      <span key={j} className="chip">
                        <span className="tabular text-text-primary font-semibold">{s.weight ?? '—'}</span>
                        {s.weight != null ? <span className="text-text-tertiary">kg</span> : null}
                        <span className="text-text-tertiary">×</span>
                        <span className="tabular text-text-primary font-semibold">{s.reps ?? '—'}</span>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {log.notes && (
            <div>
              <p className="label mb-2">Notes</p>
              <div className="card-flat">
                <p className="body-md whitespace-pre-wrap leading-snug">{log.notes}</p>
              </div>
            </div>
          )}

          <div className="h-1" />
        </div>
      </BottomSheet>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete session?"
        description={`This removes the ${section?.name || 'session'} from ${formatDate(log.date)}. You can undo right after.`}
        confirmLabel="Delete"
        tone="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  )
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
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
