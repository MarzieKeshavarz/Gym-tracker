import { useMemo } from 'react'
import { useUser } from '../context/UserContext.jsx'
import { usePlan } from '../context/PlanContext.jsx'
import { useSteps } from '../context/StepContext.jsx'
import {
  getTodayStepProgress,
  getWeeklySteps,
  getStepStats,
  getStepHistory,
} from '../utils/stepAnalytics.js'

export function useStepProgress() {
  const { currentUser } = useUser()
  const { activePlan } = usePlan()
  const { version, target, hasTarget } = useSteps()

  const userId = currentUser?.id || null
  const planId = activePlan?.id || null

  const today = useMemo(
    () => getTodayStepProgress(userId, planId, target),
    [userId, planId, target, version]
  )

  const weekly = useMemo(
    () => getWeeklySteps(userId, planId, target),
    [userId, planId, target, version]
  )

  const stats = useMemo(
    () => getStepStats(userId, planId, target),
    [userId, planId, target, version]
  )

  const history = useMemo(
    () => getStepHistory(userId, planId),
    [userId, planId, version]
  )

  return { today, weekly, stats, history, hasTarget, target }
}
