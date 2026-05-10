import React, { useState } from 'react'
import BodyLogSheet from './BodyLogSheet.jsx'
import { useBodyMetrics } from '../../hooks/useBodyMetrics.js'
import { formatDate } from '../../utils/storage.js'
import { formatWeightDelta } from '../../utils/bodyAnalytics.js'

export default function BodyWidget({ onOpenProgress }) {
  const { latest, stats, hasAny } = useBodyMetrics()
  const [logOpen, setLogOpen] = useState(false)

  if (!hasAny) {
    return (
      <>
        <button
          onClick={() => setLogOpen(true)}
          className="card lift press-pop text-left flex items-center gap-3 w-full"
        >
          <div className="w-11 h-11 rounded-xl bg-primary-soft border border-primary/25 flex items-center justify-center text-2xl flex-shrink-0">
            ⚖️
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-[15px] tracking-tightish text-text-primary">
              Track your body
            </p>
            <p className="caption mt-0.5">Log weight & measurements to see trends</p>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-text-tertiary flex-shrink-0">
            <path d="m9 6 6 6-6 6" />
          </svg>
        </button>
        <BodyLogSheet open={logOpen} onClose={() => setLogOpen(false)} />
      </>
    )
  }

  const delta = stats?.delta7d?.delta ?? null
  const arrow = delta == null || delta === 0 ? null : delta < 0 ? '↓' : '↑'
  // For body weight, "down" is usually framed as success. Soft, not loud.
  const deltaColor = delta == null || delta === 0
    ? 'text-text-tertiary'
    : delta < 0 ? 'text-success' : 'text-warning'

  return (
    <>
      <div className="card flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚖️</span>
            <p className="label">Body</p>
          </div>
          {onOpenProgress && (
            <button
              onClick={onOpenProgress}
              className="text-primary text-xs font-body font-semibold uppercase tracking-label active:scale-95 transition-all"
            >
              Trends →
            </button>
          )}
        </div>

        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="caption">Latest</p>
            <p className="font-display font-bold text-[34px] leading-none tabular tracking-tighter2 text-text-primary mt-1">
              {latest.weight}
              <span className="text-base font-body font-medium text-text-tertiary ml-1.5">kg</span>
            </p>
            <p className="caption mt-2 tabular">
              {formatDate(latest.date + 'T00:00:00')}
              {stats?.delta7d && (
                <>
                  {' · '}
                  <span className={`font-semibold ${deltaColor}`}>
                    {arrow} {formatWeightDelta(delta)?.replace(/^[+−]/, '')} <span className="text-text-tertiary font-normal">7d</span>
                  </span>
                </>
              )}
            </p>
          </div>
          <button
            onClick={() => setLogOpen(true)}
            className="btn-primary"
          >
            Log
          </button>
        </div>
      </div>

      <BodyLogSheet open={logOpen} onClose={() => setLogOpen(false)} />
    </>
  )
}
