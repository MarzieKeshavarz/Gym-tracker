import React, { useState } from 'react'
import BodyLogSheet from './BodyLogSheet.jsx'
import { formatDate } from '../../utils/storage.js'
import { MEASUREMENT_KEYS, MEASUREMENT_META } from '../../utils/bodyAnalytics.js'

export default function BodyHistoryList({ entries }) {
  const [editing, setEditing] = useState(null)

  if (!entries.length) {
    return (
      <div className="card text-center py-8">
        <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-primary-soft border border-primary/20 flex items-center justify-center text-2xl">
          ⚖️
        </div>
        <p className="body-sm">No measurements yet</p>
      </div>
    )
  }

  // Defensive sort — newest first, regardless of caller-provided order.
  const newestFirst = [...entries].sort((a, b) =>
    a.date < b.date ? 1 : a.date > b.date ? -1 : 0
  )

  return (
    <>
      <div className="flex flex-col gap-2">
        {newestFirst.map((entry, i) => {
          const next = newestFirst[i + 1] // older entry
          const delta = next ? Math.round((entry.weight - next.weight) * 10) / 10 : null
          const measEntries = MEASUREMENT_KEYS
            .filter(k => Number.isFinite(entry.measurements?.[k]))
            .map(k => ({ k, value: entry.measurements[k], meta: MEASUREMENT_META[k] }))

          return (
            <button
              key={entry.id}
              onClick={() => setEditing(entry)}
              className="card-flat text-left active:scale-[0.99] transition-all hover:border-border-strong"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0 bg-primary-soft border border-primary/25">
                  ⚖️
                </div>
                <div className="flex-1 min-w-0">
                  <p className="body-md font-semibold truncate">
                    {formatDate(entry.date + 'T00:00:00')}
                  </p>
                  {delta != null && delta !== 0 && (
                    <p className={`caption tabular ${delta < 0 ? 'text-success' : 'text-warning'}`}>
                      {delta < 0 ? '↓' : '↑'} {Math.abs(delta).toFixed(1)} kg vs prev
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-display font-bold text-base tabular tracking-tightish text-text-primary leading-none">
                    {entry.weight}
                    <span className="text-xs font-body font-medium text-text-tertiary ml-0.5">kg</span>
                  </p>
                </div>
              </div>

              {measEntries.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {measEntries.map(({ k, value, meta }) => (
                    <span
                      key={k}
                      className="chip"
                      style={{ color: meta.color, borderColor: `${meta.color}33` }}
                    >
                      <span>{meta.icon}</span>
                      <span className="tabular text-text-primary font-semibold">{value}</span>
                      <span className="text-text-tertiary">cm</span>
                    </span>
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>

      <BodyLogSheet
        open={!!editing}
        onClose={() => setEditing(null)}
        editing={editing}
      />
    </>
  )
}
