import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react'
import {
  getStepLogs,
  saveStepLog as storageSaveStepLog,
  deleteStepLog as storageDeleteStepLog,
  subscribeDataChange,
} from '../utils/storage.js'
import { useUser } from './UserContext.jsx'
import { usePlan } from './PlanContext.jsx'

const StepContext = createContext(null)

export function StepProvider({ children }) {
  const { currentUserId } = useUser()
  const { activePlan } = usePlan()
  const planId = activePlan?.id || null
  const target = activePlan?.dailyStepTarget || null

  const [version, setVersion] = useState(0)
  const tick = useCallback(() => setVersion(v => v + 1), [])

  useEffect(() => subscribeDataChange(tick), [tick])

  const stepLogs = useMemo(
    () => (currentUserId && planId ? getStepLogs(currentUserId, planId) : []),
    [currentUserId, planId, version]
  )

  const saveStepLog = useCallback(({ date, steps }) => {
    if (!currentUserId || !planId) return null
    return storageSaveStepLog({
      userId: currentUserId,
      planId,
      date,
      steps,
      targetAtTime: target,
    })
  }, [currentUserId, planId, target])

  const deleteStepLog = useCallback((stepLogId) => {
    storageDeleteStepLog(stepLogId)
  }, [])

  const value = {
    stepLogs,
    version,
    target,
    hasTarget: !!target && target > 0,
    saveStepLog,
    deleteStepLog,
  }

  return <StepContext.Provider value={value}>{children}</StepContext.Provider>
}

export function useSteps() {
  const ctx = useContext(StepContext)
  if (!ctx) throw new Error('useSteps must be used inside <StepProvider>')
  return ctx
}
