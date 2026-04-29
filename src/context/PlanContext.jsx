import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react'
import {
  getPlans, savePlan as storageSavePlan, deletePlan as storageDeletePlan,
  activatePlan as storageActivatePlan,
} from '../utils/storage.js'
import { useUser } from './UserContext.jsx'

const PlanContext = createContext(null)

export function PlanProvider({ children }) {
  const { currentUserId } = useUser()
  const [plans, setPlans] = useState(() => getPlans(currentUserId))

  // Reload plan list whenever the active user changes
  useEffect(() => {
    setPlans(getPlans(currentUserId))
  }, [currentUserId])

  const refresh = useCallback(() => {
    setPlans(getPlans(currentUserId))
  }, [currentUserId])

  const activePlan = useMemo(
    () => plans.find(p => p.isActive) || null,
    [plans]
  )

  const savePlan = useCallback((plan) => {
    storageSavePlan(plan)
    refresh()
  }, [refresh])

  const deletePlan = useCallback((planId) => {
    storageDeletePlan(planId)
    refresh()
  }, [refresh])

  const activatePlan = useCallback((planId) => {
    storageActivatePlan(planId)
    refresh()
  }, [refresh])

  const value = {
    plans,
    activePlan,
    savePlan,
    deletePlan,
    activatePlan,
    refresh,
  }

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>
}

export function usePlan() {
  const ctx = useContext(PlanContext)
  if (!ctx) throw new Error('usePlan must be used inside <PlanProvider>')
  return ctx
}
