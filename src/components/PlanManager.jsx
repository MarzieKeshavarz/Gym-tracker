import React, { useState, useEffect } from 'react'
import { usePlan } from '../context/PlanContext.jsx'
import { useUser } from '../context/UserContext.jsx'
import { buildPlanFromTemplate, buildBlankPlan, formatDateRange } from '../utils/storage.js'
import { isSupabaseConfigured } from '../sync/supabaseClient.js'
import { getSyncCode, formatSyncCode, subscribeSyncState, getSyncState } from '../sync/syncManager.js'

export default function PlanManager({ onBack, onEditPlan, onGoToSync }) {
  const { currentUserId } = useUser()
  const { plans, savePlan, deletePlan, activatePlan } = usePlan()
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [showCreateMenu, setShowCreateMenu] = useState(false)
  const [syncState, setSyncState] = useState(() => getSyncState())
  const syncCode = getSyncCode()
  const syncConfigured = isSupabaseConfigured()

  useEffect(() => subscribeSyncState(setSyncState), [])

  const handleCreate = (kind) => {
    const plan = kind === 'template'
      ? buildPlanFromTemplate(currentUserId, 'My Plan')
      : buildBlankPlan(currentUserId, 'New Plan')
    if (plans.length === 0) plan.isActive = true
    savePlan(plan)
    setShowCreateMenu(false)
    onEditPlan(plan.id)
  }

  return (
    <div className="flex flex-col gap-5 slide-up pt-5 pb-8">
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="btn-icon flex-shrink-0"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="m15 6-6 6 6 6" />
            </svg>
          </button>
        )}
        <div>
          <p className="caption">Workout plans</p>
          <h1 className="font-display font-bold text-[28px] leading-[1.1] tracking-tighter2 text-text-primary">
            Manage Plans
          </h1>
        </div>
      </div>

      {plans.length === 0 ? (
        <div className="card text-center py-12">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-primary-soft border border-primary/20 flex items-center justify-center text-3xl">
            📋
          </div>
          <p className="section-title">No plans yet</p>
          <p className="body-sm mt-1.5">Create your first plan to start logging workouts</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {plans.map(plan => (
            <div
              key={plan.id}
              className={`card transition-all ${plan.isActive ? 'border-primary/40 bg-primary-soft' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-display font-bold text-lg tracking-tightish text-text-primary truncate">
                      {plan.name}
                    </p>
                    {plan.isActive && (
                      <span className="chip-accent">
                        <span className="active-dot" /> Active
                      </span>
                    )}
                  </div>
                  <p className="caption mt-1 tabular">
                    {formatDateRange(plan.startDate, plan.endDate)} · {plan.sections.length} sections
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                {!plan.isActive && (
                  <button
                    onClick={() => activatePlan(plan.id)}
                    className="text-primary text-xs font-body font-semibold uppercase tracking-label bg-primary-soft border border-primary/30 px-3 h-9 rounded-lg active:scale-95"
                  >
                    Activate
                  </button>
                )}
                <button
                  onClick={() => onEditPlan(plan.id)}
                  className="text-text-primary text-xs font-body font-semibold uppercase tracking-label bg-surface-2 border border-border px-3 h-9 rounded-lg active:scale-95 hover:border-border-strong"
                >
                  Edit
                </button>
                {confirmDelete === plan.id ? (
                  <>
                    <button
                      onClick={() => { deletePlan(plan.id); setConfirmDelete(null) }}
                      className="text-danger text-xs font-body font-semibold uppercase tracking-label bg-danger/15 border border-danger/30 px-3 h-9 rounded-lg active:scale-95"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="text-text-secondary text-xs font-body font-medium uppercase tracking-label bg-surface-2 border border-border px-3 h-9 rounded-lg active:scale-95"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(plan.id)}
                    className="text-danger text-xs font-body font-semibold uppercase tracking-label bg-danger/10 border border-danger/25 px-3 h-9 rounded-lg active:scale-95"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sync entry */}
      {onGoToSync && (
        <button
          onClick={onGoToSync}
          className="card flex items-center gap-3 active:scale-[0.99] transition-all text-left"
        >
          <div className="w-11 h-11 rounded-xl bg-surface-3 border border-border flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-accent">
              <path d="M17.5 19a4.5 4.5 0 1 0-2.5-8.2A6 6 0 1 0 6 17h11.5z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-base tracking-tightish text-text-primary">Sync</p>
            <p className="caption mt-0.5 truncate tabular">
              {!syncConfigured
                ? 'Not configured — see SETUP.md'
                : syncCode
                  ? <>Code · <span className="text-text-secondary">{formatSyncCode(syncCode)}</span>{syncState.status === 'syncing' ? ' · syncing…' : ''}</>
                  : 'Off — tap to set up'}
            </p>
          </div>
          {syncCode && syncState.status === 'ok' && (
            <span className="w-2 h-2 rounded-full bg-success flex-shrink-0" />
          )}
          {syncCode && syncState.status === 'error' && (
            <span className="w-2 h-2 rounded-full bg-danger flex-shrink-0" />
          )}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-text-tertiary flex-shrink-0">
            <path d="m9 6 6 6-6 6" />
          </svg>
        </button>
      )}

      {showCreateMenu ? (
        <div className="card">
          <p className="label mb-3">Start from</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleCreate('template')}
              className="bg-primary-soft border border-primary/30 rounded-xl p-4 text-left active:scale-95 transition-all"
            >
              <div className="text-2xl mb-2">📋</div>
              <p className="font-display font-bold text-sm text-text-primary tracking-tightish">Template</p>
              <p className="caption mt-1">Pre-filled sections</p>
            </button>
            <button
              onClick={() => handleCreate('blank')}
              className="bg-surface-3 border border-border rounded-xl p-4 text-left active:scale-95 transition-all hover:border-border-strong"
            >
              <div className="text-2xl mb-2">✏️</div>
              <p className="font-display font-bold text-sm text-text-primary tracking-tightish">Blank</p>
              <p className="caption mt-1">Build from scratch</p>
            </button>
          </div>
          <button
            onClick={() => setShowCreateMenu(false)}
            className="btn-ghost w-full mt-3 text-sm"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowCreateMenu(true)}
          className="w-full h-14 rounded-2xl border border-dashed border-border-strong text-text-secondary font-display font-semibold text-sm tracking-tightish active:scale-[0.98] transition-all hover:border-primary/40 hover:text-primary hover:bg-primary-soft inline-flex items-center justify-center gap-2"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New plan
        </button>
      )}
    </div>
  )
}
