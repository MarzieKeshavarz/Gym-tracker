import React, { useState, useCallback, useEffect } from 'react'
import Dashboard from './components/Dashboard.jsx'
import WorkoutDay from './components/WorkoutDay.jsx'
import ProgressView from './components/ProgressView.jsx'
import PlanSetup from './components/PlanSetup.jsx'
import { getPlan } from './utils/storage.js'

const VIEWS = {
  DASHBOARD: 'dashboard',
  WORKOUT: 'workout',
  PROGRESS: 'progress',
  SETUP: 'setup',
}

export default function App() {
  const [view, setView] = useState(VIEWS.DASHBOARD)
  const [selectedDay, setSelectedDay] = useState(null)
  const [plan, setPlan] = useState(() => getPlan())
  const [refreshKey, setRefreshKey] = useState(0) // force re-render of dashboard after save

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [view])

  const goToDashboard = useCallback(() => {
    setView(VIEWS.DASHBOARD)
    setSelectedDay(null)
    setRefreshKey(k => k + 1)
  }, [])

  const handleSelectDay = useCallback((day) => {
    setSelectedDay(day)
    setView(VIEWS.WORKOUT)
  }, [])

  const handleWorkoutSaved = useCallback(() => {
    goToDashboard()
  }, [goToDashboard])

  const handlePlanSaved = useCallback((newPlan) => {
    setPlan(newPlan)
    goToDashboard()
  }, [goToDashboard])

  return (
    <div className="min-h-screen bg-base">
      {/* Content */}
      <main className="max-w-lg mx-auto px-4 pb-6 safe-top">
        {view === VIEWS.DASHBOARD && (
          <Dashboard
            key={refreshKey}
            plan={plan}
            onSelectDay={handleSelectDay}
            onGoToProgress={() => setView(VIEWS.PROGRESS)}
            onGoToSetup={() => setView(VIEWS.SETUP)}
          />
        )}

        {view === VIEWS.WORKOUT && selectedDay && (
          <WorkoutDay
            key={selectedDay.id}
            day={selectedDay}
            onBack={goToDashboard}
            onSaved={handleWorkoutSaved}
          />
        )}

        {view === VIEWS.PROGRESS && (
          <ProgressView
            plan={plan}
            onBack={goToDashboard}
          />
        )}

        {view === VIEWS.SETUP && (
          <PlanSetup
            plan={plan}
            onBack={goToDashboard}
            onPlanSaved={handlePlanSaved}
          />
        )}
      </main>

      {/* Bottom nav (only on dashboard and progress) */}
      {(view === VIEWS.DASHBOARD || view === VIEWS.PROGRESS) && (
        <nav className="fixed bottom-0 left-0 right-0 safe-bottom bg-surface border-t border-border">
          <div className="max-w-lg mx-auto flex">
            <NavTab
              icon="🏠"
              label="Home"
              active={view === VIEWS.DASHBOARD}
              onClick={() => { setView(VIEWS.DASHBOARD); setRefreshKey(k => k + 1) }}
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
