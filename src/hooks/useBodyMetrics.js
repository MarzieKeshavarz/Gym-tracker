import { useMemo } from 'react'
import { useUser } from '../context/UserContext.jsx'
import { useBodyMetricsCtx } from '../context/BodyMetricsContext.jsx'
import {
  getLatestBodyMetric,
  getBodyMetricsForToday,
  getWeightStats,
  getWeightSeries,
  getMeasurementStats,
  getAvailableMeasurements,
  computeBMI,
  classifyBMI,
} from '../utils/bodyAnalytics.js'

export function useBodyMetrics() {
  const { currentUser } = useUser()
  const { version } = useBodyMetricsCtx()
  const userId = currentUser?.id || null
  const heightCm = currentUser?.heightCm || null

  const latest = useMemo(
    () => (userId ? getLatestBodyMetric(userId) : null),
    [userId, version]
  )

  const today = useMemo(
    () => (userId ? getBodyMetricsForToday(userId) : null),
    [userId, version]
  )

  const stats = useMemo(
    () => (userId ? getWeightStats(userId) : null),
    [userId, version]
  )

  const series = useMemo(
    () => (userId ? getWeightSeries(userId) : []),
    [userId, version]
  )

  const measurementStats = useMemo(
    () => (userId ? getMeasurementStats(userId) : {}),
    [userId, version]
  )

  const availableMeasurements = useMemo(
    () => (userId ? getAvailableMeasurements(userId) : []),
    [userId, version]
  )

  const bmi = useMemo(
    () => (latest ? computeBMI(latest.weight, heightCm) : null),
    [latest, heightCm]
  )

  const bmiZone = useMemo(() => classifyBMI(bmi), [bmi])

  return {
    userId,
    heightCm,
    hasHeight: !!heightCm,
    latest,
    today,
    stats,
    series,
    measurementStats,
    availableMeasurements,
    bmi,
    bmiZone,
    hasAny: !!stats?.hasAny,
  }
}
