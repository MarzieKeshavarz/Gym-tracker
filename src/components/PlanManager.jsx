import React, { useState } from 'react'
import { usePlan } from '../context/PlanContext.jsx'
import { useUser } from '../context/UserContext.jsx'
import { buildPlanFromTemplate, buildBlankPlan, formatDateRange } from '../utils/storage.js'

export default function PlanManager({ onBack, onEditPlan }) {
  const { currentUserId } = useUser()
  const { plans, savePlan, deletePlan, activatePlan } = usePlan()
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [showCreateMenu, setShowCreateMenu] = useState(false)

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
    <div className="flex flex-col gap-5 slide-up pb-8">
      <div className="flex items-center gap-4 pt-2">
        {onBack && (
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface2 border border-border text-muted active:scale-95 transition-all flex-shrink-0"
          >
            ‹
          </button>
        )}
        <div>
          <p className="label mb-0.5">Workout Plans</p>
          <h1 className="font-display font-black text-3xl uppercase tracking-tight text-text">
            Manage Plans
          </h1>
        </div>
      </div>

      {plans.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-display font-bold text-xl uppercase text-text">No plans yet</p>
          <p className="text-muted text-sm mt-1">Create your first plan to start logging workouts</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {plans.map(plan => (
            <div
              key={plan.id}
              className={`card transition-all ${plan.isActive ? 'border-accent/50 bg-accent/5' : ''}`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-display font-bold text-xl uppercase text-text tracking-wide">
                      {plan.name}
                    </p>
                    {plan.isActive && (
                      <span className="text-accent text-[10px] font-body font-bold uppercase tracking-widest bg-accent/15 px-2 py-0.5 rounded">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-muted text-xs mt-1">
                    {formatDateRange(plan.startDate, plan.endDate)} · {plan.sections.length} sections
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                {!plan.isActive && (
                  <button
                    onClick={() => activatePlan(plan.id)}
                    className="text-accent text-xs font-body font-semibold uppercase tracking-wider bg-accent/10 border border-accent/30 px-3 py-2 rounded-lg active:scale-95"
                  >
                    Activate
                  </button>
                )}
                <button
                  onClick={() => onEditPlan(plan.id)}
                  className="text-text text-xs font-body font-semibold uppercase tracking-wider bg-surface2 border border-border px-3 py-2 rounded-lg active:scale-95"
                >
                  Edit
                </button>
                {confirmDelete === plan.id ? (
                  <>
                    <button
                      onClick={() => { deletePlan(plan.id); setConfirmDelete(null) }}
                      className="text-red-400 text-xs font-body font-semibold uppercase tracking-wider bg-red-900/20 border border-red-900/40 px-3 py-2 rounded-lg active:scale-95"
                    >
                      Confirm delete
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="text-muted text-xs font-body uppercase tracking-wider bg-surface2 border border-border px-3 py-2 rounded-lg active:scale-95"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(plan.id)}
                    className="text-red-400 text-xs font-body font-semibold uppercase tracking-wider bg-red-900/10 border border-red-900/30 px-3 py-2 rounded-lg active:scale-95"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateMenu ? (
        <div className="card">
          <p className="label mb-3">Start from</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleCreate('template')}
              className="bg-accent/10 border border-accent/30 rounded-lg p-4 text-left active:scale-95 transition-all"
            >
              <p className="text-2xl mb-1">📋</p>
              <p className="text-text font-display font-bold text-sm uppercase">Template</p>
              <p className="text-muted text-xs mt-1">Pre-filled sample sections</p>
            </button>
            <button
              onClick={() => handleCreate('blank')}
              className="bg-surface2 border border-border rounded-lg p-4 text-left active:scale-95 transition-all"
            >
              <p className="text-2xl mb-1">✏️</p>
              <p className="text-text font-display font-bold text-sm uppercase">Blank</p>
              <p className="text-muted text-xs mt-1">Build from scratch</p>
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
          className="w-full py-4 rounded-xl border-2 border-dashed border-border text-muted font-display font-bold uppercase tracking-widest active:scale-95 transition-all hover:border-accent/40 hover:text-accent"
        >
          + New Plan
        </button>
      )}
    </div>
  )
}
