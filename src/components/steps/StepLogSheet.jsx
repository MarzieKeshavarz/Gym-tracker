import React, { useState, useEffect } from 'react'
import BottomSheet from '../modals/BottomSheet.jsx'
import { useSteps } from '../../context/StepContext.jsx'
import { todayKey, isFutureDate } from '../../utils/stepAnalytics.js'

export default function StepLogSheet({ open, onClose, editing = null, defaultDate = null }) {
  const { saveStepLog, deleteStepLog, target } = useSteps()
  const [date, setDate] = useState(todayKey())
  const [steps, setSteps] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open) return
    if (editing) {
      setDate(editing.date)
      setSteps(String(editing.steps ?? ''))
    } else {
      setDate(defaultDate || todayKey())
      setSteps('')
    }
    setError(null)
  }, [open, editing, defaultDate])

  const handleSave = () => {
    if (isFutureDate(date)) {
      setError('Future dates not allowed.')
      return
    }
    const n = Number(steps)
    if (!Number.isFinite(n) || n < 0) {
      setError('Enter a valid number of steps.')
      return
    }
    saveStepLog({ date, steps: n })
    onClose?.()
  }

  const handleDelete = () => {
    if (editing?.id) deleteStepLog(editing.id)
    onClose?.()
  }

  const title = editing ? 'Edit steps' : 'Log steps'

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <div className="flex gap-3">
          {editing && (
            <button onClick={handleDelete} className="btn-danger flex-1">
              Delete
            </button>
          )}
          <button onClick={handleSave} className="btn-primary flex-1">
            Save
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <div>
          <p className="label mb-1.5">Date</p>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            max={todayKey()}
            className="input-field"
          />
        </div>
        <div>
          <p className="label mb-1.5">Total steps</p>
          <input
            type="number"
            inputMode="numeric"
            value={steps}
            onChange={e => setSteps(e.target.value)}
            placeholder="e.g. 8120"
            min="0"
            step="1"
            autoFocus
            className="input-field text-2xl h-14"
          />
        </div>

        {target > 0 && (
          <div className="card-flat flex items-center justify-between">
            <span className="caption">Daily goal</span>
            <span className="body-md font-semibold tabular">
              {target.toLocaleString()} steps
            </span>
          </div>
        )}

        {error && (
          <p className="caption" style={{ color: '#FF6A3D' }}>{error}</p>
        )}
      </div>
    </BottomSheet>
  )
}
