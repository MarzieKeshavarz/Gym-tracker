import React, { useState, useEffect, useMemo } from 'react'
import BottomSheet from '../modals/BottomSheet.jsx'
import { useBodyMetricsCtx } from '../../context/BodyMetricsContext.jsx'
import { useUser } from '../../context/UserContext.jsx'
import {
  todayDateKey,
  isFutureDateKey,
  MEASUREMENT_KEYS,
  MEASUREMENT_META,
  computeBMI,
  classifyBMI,
} from '../../utils/bodyAnalytics.js'

const EMPTY_MEASUREMENTS = MEASUREMENT_KEYS.reduce((m, k) => { m[k] = ''; return m }, {})

export default function BodyLogSheet({ open, onClose, editing = null, defaultDate = null }) {
  const { saveMetric, deleteMetric } = useBodyMetricsCtx()
  const { currentUser, editUser } = useUser()

  const [date, setDate] = useState(todayDateKey())
  const [weight, setWeight] = useState('')
  const [measurements, setMeasurements] = useState(EMPTY_MEASUREMENTS)
  const [showMeasurements, setShowMeasurements] = useState(false)
  const [height, setHeight] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open) return
    if (editing) {
      setDate(editing.date)
      setWeight(String(editing.weight ?? ''))
      const m = { ...EMPTY_MEASUREMENTS }
      for (const k of MEASUREMENT_KEYS) {
        const v = editing.measurements?.[k]
        if (Number.isFinite(v)) m[k] = String(v)
      }
      setMeasurements(m)
      setShowMeasurements(MEASUREMENT_KEYS.some(k => Number.isFinite(editing.measurements?.[k])))
    } else {
      setDate(defaultDate || todayDateKey())
      setWeight('')
      setMeasurements(EMPTY_MEASUREMENTS)
      setShowMeasurements(false)
    }
    setHeight(currentUser?.heightCm ? String(currentUser.heightCm) : '')
    setError(null)
  }, [open, editing, defaultDate, currentUser?.heightCm])

  const previewBMI = useMemo(() => {
    const bmi = computeBMI(Number(weight), Number(height) || currentUser?.heightCm)
    return { value: bmi, zone: classifyBMI(bmi) }
  }, [weight, height, currentUser?.heightCm])

  const handleSave = () => {
    if (isFutureDateKey(date)) {
      setError('Future dates are not allowed.')
      return
    }
    const w = Number(weight)
    if (!Number.isFinite(w) || w <= 0) {
      setError('Enter a valid weight.')
      return
    }

    if (!currentUser?.heightCm && height) {
      const h = Number(height)
      if (Number.isFinite(h) && h > 0) editUser(currentUser.id, { heightCm: h })
    } else if (currentUser?.heightCm && height && Number(height) !== currentUser.heightCm) {
      const h = Number(height)
      if (Number.isFinite(h) && h > 0) editUser(currentUser.id, { heightCm: h })
    }

    const meas = {}
    for (const k of MEASUREMENT_KEYS) {
      const v = measurements[k]
      if (v !== '' && Number.isFinite(Number(v))) meas[k] = Number(v)
    }

    saveMetric({ date, weight: w, measurements: meas })
    onClose?.()
  }

  const handleDelete = () => {
    if (editing?.id) deleteMetric(editing.id)
    onClose?.()
  }

  const setMeasurement = (k, v) => {
    setMeasurements(prev => ({ ...prev, [k]: v }))
  }

  const askHeight = !currentUser?.heightCm

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={editing ? 'Edit measurement' : 'Log measurement'}
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
            max={todayDateKey()}
            className="input-field"
          />
        </div>

        <div>
          <p className="label mb-1.5">Weight</p>
          <div className="relative">
            <input
              type="number"
              inputMode="decimal"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              placeholder="e.g. 72.4"
              min="20"
              max="400"
              step="0.1"
              autoFocus={!editing}
              className="input-field text-2xl h-14 pr-12"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 caption tabular">kg</span>
          </div>
        </div>

        {askHeight && (
          <div className="card-flat">
            <p className="label mb-1.5">Your height (one-time)</p>
            <div className="relative">
              <input
                type="number"
                inputMode="numeric"
                value={height}
                onChange={e => setHeight(e.target.value)}
                placeholder="e.g. 172"
                min="80"
                max="260"
                step="0.5"
                className="input-field h-12 pr-12"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 caption tabular">cm</span>
            </div>
            <p className="caption mt-2">Used to calculate BMI · saved to your profile</p>
          </div>
        )}

        {previewBMI.value != null && (
          <div className="card-flat flex items-center justify-between">
            <span className="caption">BMI preview</span>
            <span className="body-md font-semibold tabular flex items-center gap-2">
              <span style={{ color: previewBMI.zone?.color }}>
                {previewBMI.value}
              </span>
              <span className="caption" style={{ color: previewBMI.zone?.color }}>
                · {previewBMI.zone?.label}
              </span>
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowMeasurements(v => !v)}
          className="card-flat flex items-center gap-3 active:scale-[0.99] transition-all w-full text-left"
        >
          <div className="w-9 h-9 rounded-lg bg-surface-3 border border-border flex items-center justify-center text-base flex-shrink-0">
            📐
          </div>
          <div className="flex-1 min-w-0">
            <p className="body-md font-semibold">Body measurements</p>
            <p className="caption">Optional · waist, hips, chest, arms, thighs</p>
          </div>
          <svg
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            className={`w-4 h-4 text-text-tertiary transition-transform ${showMeasurements ? 'rotate-180' : ''}`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {showMeasurements && (
          <div className="grid grid-cols-2 gap-3 fade-in">
            {MEASUREMENT_KEYS.map(k => {
              const meta = MEASUREMENT_META[k]
              return (
                <div key={k}>
                  <p className="label mb-1.5 flex items-center gap-1">
                    <span className="text-sm">{meta.icon}</span> {meta.label}
                  </p>
                  <div className="relative">
                    <input
                      type="number"
                      inputMode="decimal"
                      value={measurements[k]}
                      onChange={e => setMeasurement(k, e.target.value)}
                      placeholder="—"
                      min="10"
                      max="300"
                      step="0.1"
                      className="input-field h-11 pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 caption tabular">cm</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {error && (
          <p className="caption" style={{ color: '#FF6A3D' }}>{error}</p>
        )}
      </div>
    </BottomSheet>
  )
}
