import React, { useState } from 'react'
import StepLogSheet from './StepLogSheet.jsx'
import { formatDate } from '../../utils/storage.js'

export default function StepHistoryList({ history, target = 0 }) {
  const [editing, setEditing] = useState(null)

  if (!history.length) {
    return (
      <div className="card text-center py-8">
        <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-primary-soft border border-primary/20 flex items-center justify-center text-2xl">
          👣
        </div>
        <p className="body-sm">No step entries yet</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        {history.map(entry => {
          const dayTarget = entry.targetAtTime ?? target
          const hit = dayTarget > 0 && entry.steps >= dayTarget
          return (
            <button
              key={entry.id}
              onClick={() => setEditing(entry)}
              className="card-flat flex items-center gap-3 text-left active:scale-[0.99] transition-all hover:border-border-strong"
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0 border ${
                  hit ? 'bg-primary-soft border-primary/30' : 'bg-surface-3 border-border'
                }`}
              >
                {hit ? '✓' : '👣'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="body-md font-semibold truncate">
                  {formatDate(entry.date + 'T00:00:00')}
                </p>
                {dayTarget > 0 && (
                  <p className="caption tabular">
                    Goal {dayTarget.toLocaleString()}
                  </p>
                )}
              </div>
              <p className="font-display font-bold text-base tabular tracking-tightish text-text-primary">
                {entry.steps.toLocaleString()}
              </p>
            </button>
          )
        })}
      </div>

      <StepLogSheet
        open={!!editing}
        onClose={() => setEditing(null)}
        editing={editing}
      />
    </>
  )
}
