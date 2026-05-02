import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react'
import {
  getLogs,
  saveLog as storageSaveLog,
  updateLog as storageUpdateLog,
  deleteLog as storageDeleteLog,
  restoreLog as storageRestoreLog,
  subscribeDataChange,
} from '../utils/storage.js'
import { useUser } from './UserContext.jsx'
import { usePlan } from './PlanContext.jsx'

const LogContext = createContext(null)

// Centralised, reactive log state. Every screen that reads logs (Dashboard,
// Progress, SessionDetail, etc.) reads from here so a single edit/delete
// re-renders all of them. Also picks up remote sync pulls automatically.
export function LogProvider({ children }) {
  const { currentUserId } = useUser()
  const { activePlan } = usePlan()
  const planId = activePlan?.id || null

  const [version, setVersion] = useState(0)
  const tick = useCallback(() => setVersion(v => v + 1), [])

  // Refresh on any local mutation OR remote sync pull.
  useEffect(() => subscribeDataChange(tick), [tick])

  const logs = useMemo(
    () => (currentUserId && planId ? getLogs(currentUserId, planId) : []),
    [currentUserId, planId, version]
  )

  const saveLog = useCallback((log) => {
    storageSaveLog(log)
  }, [])

  const updateLog = useCallback((log) => {
    return storageUpdateLog(log)
  }, [])

  const deleteLog = useCallback((logId) => {
    storageDeleteLog(logId)
  }, [])

  const restoreLog = useCallback((logId) => {
    return storageRestoreLog(logId)
  }, [])

  const value = {
    logs,
    version,
    saveLog,
    updateLog,
    deleteLog,
    restoreLog,
  }

  return <LogContext.Provider value={value}>{children}</LogContext.Provider>
}

export function useLogs() {
  const ctx = useContext(LogContext)
  if (!ctx) throw new Error('useLogs must be used inside <LogProvider>')
  return ctx
}
