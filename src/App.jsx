import React, { useState, useCallback, useEffect } from 'react'
import { UserProvider, useUser } from './context/UserContext.jsx'
import { PlanProvider, usePlan } from './context/PlanContext.jsx'
import UserSelect from './components/UserSelect.jsx'
import Dashboard from './components/Dashboard.jsx'
import WorkoutSection from './components/WorkoutSection.jsx'
import ProgressView from './components/ProgressView.jsx'
import PlanManager from './components/PlanManager.jsx'
import PlanEditor from './components/PlanEditor.jsx'

const VIEWS = {
  DASHBOARD: 'dashboard',
  WORKOUT: 'workout',
  PROGRESS: 'progress',
  PLANS: 'plans',
  PLAN_EDIT: 'plan-edit',
}

export default function App() {
  return (
    <UserProvider>
      <PlanProvider>
        <Shell />
      </PlanProvider>
    </UserProvider>
  )
}

function Shell() {
  const { currentUser, clearCurrentUser } = useUser()
  const { activePlan, plans } = usePlan()

  const [view, setView] = useState(VIEWS.DASHBOARD)
  const [selectedSection, setSelectedSection] = useState(null)
  const [editingPlanId, setEditingPlanId] = useState(null)

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [view])

  // Reset view when user changes
  useEffect(() => {
    setView(VIEWS.DASHBOARD)
    setSelectedSection(null)
    setEditingPlanId(null)
  }, [currentUser?.id])

  const goToDashboard = useCallback(() => {
    setView(VIEWS.DASHBOARD)
    setSelectedSection(null)
  }, [])

  const handleSelectSection = useCallback((section) => {
    setSelectedSection(section)
    setView(VIEWS.WORKOUT)
  }, [])

  const handleEditPlan = useCallback((planId) => {
    setEditingPlanId(planId)
    setView(VIEWS.PLAN_EDIT)
  }, [])

  // ── Routing ────────────────────────────────────────────────────────────────
  // 1. No user selected → user select screen
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-base">
        <main className="max-w-lg mx-auto px-4 pb-6 safe-top">
          <UserSelect />
        </main>
      </div>
    )
  }

  // 2. User selected but no active plan → plan manager (or editor for the first plan)
  const showPlansFlow = !activePlan && view !== VIEWS.PLAN_EDIT && view !== VIEWS.PLANS
  if (showPlansFlow) {
    return (
      <div className="min-h-screen bg-base">
        <main className="max-w-lg mx-auto px-4 pb-6 safe-top">
          <NoPlanScreen
            hasPlans={plans.length > 0}
            onManagePlans={() => setView(VIEWS.PLANS)}
            onSwitchUser={clearCurrentUser}
          />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base">
      <main className="max-w-lg mx-auto px-4 pb-6 safe-top">
        {view === VIEWS.DASHBOARD && activePlan && (
          <Dashboard
            onSelectSection={handleSelectSection}
            onGoToProgress={() => setView(VIEWS.PROGRESS)}
            onGoToManagePlans={() => setView(VIEWS.PLANS)}
            onSwitchUser={clearCurrentUser}
          />
        )}

        {view === VIEWS.WORKOUT && selectedSection && (
          <WorkoutSection
            key={selectedSection.id}
            section={selectedSection}
            onBack={goToDashboard}
            onSaved={goToDashboard}
          />
        )}

        {view === VIEWS.PROGRESS && (
          <ProgressView onBack={goToDashboard} />
        )}

        {view === VIEWS.PLANS && (
          <PlanManager
            onBack={activePlan ? goToDashboard : null}
            onEditPlan={handleEditPlan}
          />
        )}

        {view === VIEWS.PLAN_EDIT && editingPlanId && (
          <PlanEditor
            planId={editingPlanId}
            onBack={() => setView(VIEWS.PLANS)}
          />
        )}
      </main>

      {(view === VIEWS.DASHBOARD || view === VIEWS.PROGRESS) && activePlan && (
        <nav className="fixed bottom-0 left-0 right-0 safe-bottom bg-surface border-t border-border">
          <div className="max-w-lg mx-auto flex">
            <NavTab
              icon="🏠"
              label="Home"
              active={view === VIEWS.DASHBOARD}
              onClick={goToDashboard}
            />
            <NavTab
              icon="📊"
              label="Progress"
              active={view === VIEWS.PROGRESS}
              onClick={() => setView(VIEWS.PROGRESS)}
            />
          </div>
        </nav>
      )}
    </div>
  )
}

function NoPlanScreen({ hasPlans, onManagePlans, onSwitchUser }) {
  const { currentUser } = useUser()
  return (
    <div className="flex flex-col gap-5 slide-up pt-4 pb-8">
      <div className="flex items-start justify-between gap-3 pt-2">
        <div className="flex items-start gap-3">
          {currentUser && (
            <button
              onClick={onSwitchUser}
              className="w-12 h-12 flex items-center justify-center rounded-xl bg-surface2 border border-border text-2xl active:scale-95"
              title="Switch profile"
            >
              {currentUser.avatar}
            </button>
          )}
          <div>
            <p className="label mb-1">Hi, {currentUser?.name}</p>
            <h1 className="font-display font-black text-4xl uppercase tracking-tight text-text leading-none">
              Gym<span className="text-accent">Log</span>
            </h1>
          </div>
        </div>
      </div>

      <div className="card text-center py-10">
        <p className="text-5xl mb-3">📋</p>
        <p className="font-display font-black text-2xl uppercase text-text">
          {hasPlans ? 'No active plan' : 'Create your first plan'}
        </p>
        <p className="text-muted text-sm mt-2 px-4">
          {hasPlans
            ? 'Activate one of your plans to start logging workouts.'
            : 'Start with a template or build your own from scratch.'}
        </p>
        <button
          onClick={onManagePlans}
          className="btn-primary mt-5 px-6 py-3"
        >
          {hasPlans ? 'Manage Plans' : 'Create Plan'}
        </button>
      </div>
    </div>
  )
}

function NavTab({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-all active:scale-95 ${
        active ? 'text-accent' : 'text-muted'
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span className={`text-xs font-body font-medium uppercase tracking-wider ${active ? 'text-accent' : 'text-muted'}`}>
        {label}
      </span>
    </button>
  )
}
