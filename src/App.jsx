import React, { useState, useCallback, useEffect } from 'react'
import { UserProvider, useUser } from './context/UserContext.jsx'
import { PlanProvider, usePlan } from './context/PlanContext.jsx'
import UserSelect from './components/UserSelect.jsx'
import Dashboard from './components/Dashboard.jsx'
import WorkoutSection from './components/WorkoutSection.jsx'
import ProgressView from './components/ProgressView.jsx'
import PlanManager from './components/PlanManager.jsx'
import PlanEditor from './components/PlanEditor.jsx'
import SyncSettings from './components/SyncSettings.jsx'
import { startSync } from './sync/syncManager.js'

const VIEWS = {
  DASHBOARD: 'dashboard',
  WORKOUT: 'workout',
  PROGRESS: 'progress',
  PLANS: 'plans',
  PLAN_EDIT: 'plan-edit',
  SYNC: 'sync',
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

  useEffect(() => {
    startSync()
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [view])

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

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-bg">
        <main className="max-w-lg mx-auto px-5 pb-6 safe-top">
          <UserSelect />
        </main>
      </div>
    )
  }

  const planFlowViews = [VIEWS.PLAN_EDIT, VIEWS.PLANS, VIEWS.SYNC]
  const showPlansFlow = !activePlan && !planFlowViews.includes(view)
  if (showPlansFlow) {
    return (
      <div className="min-h-screen bg-bg">
        <main className="max-w-lg mx-auto px-5 pb-6 safe-top">
          <NoPlanScreen
            hasPlans={plans.length > 0}
            onManagePlans={() => setView(VIEWS.PLANS)}
            onSwitchUser={clearCurrentUser}
          />
        </main>
      </div>
    )
  }

  const showNav = (view === VIEWS.DASHBOARD || view === VIEWS.PROGRESS) && activePlan

  return (
    <div className="min-h-screen bg-bg">
      <main className={`max-w-lg mx-auto px-5 safe-top ${showNav ? 'pb-28' : 'pb-6'}`}>
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
            onGoToSync={() => setView(VIEWS.SYNC)}
          />
        )}

        {view === VIEWS.PLAN_EDIT && editingPlanId && (
          <PlanEditor
            planId={editingPlanId}
            onBack={() => setView(VIEWS.PLANS)}
          />
        )}

        {view === VIEWS.SYNC && (
          <SyncSettings onBack={() => setView(VIEWS.PLANS)} />
        )}
      </main>

      {showNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-30 safe-bottom">
          <div className="max-w-lg mx-auto px-4 pt-2">
            <div className="bg-surface/85 backdrop-blur-xl border border-border rounded-2xl shadow-elev relative flex items-center px-2 py-1.5">
              {/* Sliding indicator */}
              <span
                className="absolute top-1.5 bottom-1.5 left-2 rounded-xl bg-primary-soft border border-primary/30 transition-all duration-500"
                style={{
                  width: 'calc(50% - 0.5rem)',
                  transform: `translateX(${view === VIEWS.PROGRESS ? '100%' : '0%'})`,
                  transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                aria-hidden
              />
              <NavTab
                label="Home"
                active={view === VIEWS.DASHBOARD}
                onClick={goToDashboard}
                icon={<HomeIcon />}
              />
              <NavTab
                label="Progress"
                active={view === VIEWS.PROGRESS}
                onClick={() => setView(VIEWS.PROGRESS)}
                icon={<ChartIcon />}
              />
            </div>
          </div>
        </nav>
      )}
    </div>
  )
}

function NoPlanScreen({ hasPlans, onManagePlans, onSwitchUser }) {
  const { currentUser } = useUser()
  return (
    <div className="flex flex-col gap-6 slide-up pt-6 pb-8">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {currentUser && (
            <button
              onClick={onSwitchUser}
              className="w-12 h-12 flex items-center justify-center rounded-2xl bg-surface-2 border border-border text-2xl active:scale-95 transition-all"
              title="Switch profile"
            >
              {currentUser.avatar}
            </button>
          )}
          <div>
            <p className="caption mb-0.5">Hi, {currentUser?.name}</p>
            <h1 className="page-title">
              Gym<span className="text-primary">Log</span>
            </h1>
          </div>
        </div>
      </div>

      <div className="card text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-soft border border-primary/20 flex items-center justify-center text-3xl">
          📋
        </div>
        <p className="section-title">
          {hasPlans ? 'No active plan' : 'Create your first plan'}
        </p>
        <p className="body-sm mt-2 px-6">
          {hasPlans
            ? 'Activate one of your plans to start logging workouts.'
            : 'Start with a template or build your own from scratch.'}
        </p>
        <button
          onClick={onManagePlans}
          className="btn-primary mt-6 px-8"
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
      className={`relative z-10 flex-1 flex items-center justify-center gap-2 h-11 rounded-xl transition-colors duration-300 active:scale-[0.97] ${
        active ? 'text-primary' : 'text-text-secondary hover:text-text-primary'
      }`}
    >
      <span className={`w-5 h-5 transition-transform duration-300 ${active ? 'scale-110' : 'scale-100'}`}>
        {icon}
      </span>
      <span className="font-body font-semibold text-sm">{label}</span>
    </button>
  )
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <path d="M4 19h16" />
      <path d="M7 16v-5" />
      <path d="M12 16V8" />
      <path d="M17 16v-3" />
    </svg>
  )
}
