import { useEffect, useRef, useState } from 'react'

/**
 * Animates a numeric value from 0 → target on mount and on target change.
 * Uses requestAnimationFrame for smoothness; respects prefers-reduced-motion.
 */
export function useCountUp(target, { duration = 900, decimals = 0 } = {}) {
  const numericTarget = Number(target) || 0
  const [value, setValue] = useState(numericTarget)
  const fromRef = useRef(0)
  const startRef = useRef(0)
  const rafRef = useRef(0)

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce || numericTarget === 0) {
      setValue(numericTarget)
      return
    }

    cancelAnimationFrame(rafRef.current)
    fromRef.current = 0
    startRef.current = performance.now()

    const tick = (now) => {
      const t = Math.min(1, (now - startRef.current) / duration)
      // easeOutCubic — quick start, soft landing
      const eased = 1 - Math.pow(1 - t, 3)
      const next = fromRef.current + (numericTarget - fromRef.current) * eased
      setValue(decimals === 0 ? Math.round(next) : Number(next.toFixed(decimals)))
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [numericTarget, duration, decimals])

  return value
}
