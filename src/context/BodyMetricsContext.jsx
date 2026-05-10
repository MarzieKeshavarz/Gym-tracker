import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react'
import {
  getBodyMetrics,
  saveBodyMetric as storageSaveBodyMetric,
  deleteBodyMetric as storageDeleteBodyMetric,
  subscribeDataChange,
} from '../utils/storage.js'
import { useUser } from './UserContext.jsx'

const BodyMetricsContext = createContext(null)

export function BodyMetricsProvider({ children }) {
  const { currentUserId } = useUser()

  const [version, setVersion] = useState(0)
  const tick = useCallback(() => setVersion(v => v + 1), [])

  useEffect(() => subscribeDataChange(tick), [tick])

  const metrics = useMemo(
    () => (currentUserId ? getBodyMetrics(currentUserId) : []),
    [currentUserId, version]
  )

  const saveMetric = useCallback(({ date, weight, measurements }) => {
    if (!currentUserId) return null
    return storageSaveBodyMetric({
      userId: currentUserId,
      date,
      weight,
      measurements,
    })
  }, [currentUserId])

  const deleteMetric = useCallback((metricId) => {
    storageDeleteBodyMetric(metricId)
  }, [])

  const value = {
    metrics,
    version,
    saveMetric,
    deleteMetric,
  }

  return <BodyMetricsContext.Provider value={value}>{children}</BodyMetricsContext.Provider>
}

export function useBodyMetricsCtx() {
  const ctx = useContext(BodyMetricsContext)
  if (!ctx) throw new Error('useBodyMetricsCtx must be used inside <BodyMetricsProvider>')
  return ctx
}
