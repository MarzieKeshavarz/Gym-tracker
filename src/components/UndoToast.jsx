import React, { useEffect, useState } from 'react'

const DEFAULT_MS = 5000

// Lightweight undo snackbar. Auto-dismisses after `duration` ms; the parent
// listens for `onUndo` and `onDismiss`. The visible flag re-mounts on each
// new `id` so successive deletes show fresh toasts.
export default function UndoToast({
  id,
  message,
  actionLabel = 'Undo',
  duration = DEFAULT_MS,
  onUndo,
  onDismiss,
}) {
  const [visible, setVisible] = useState(false)
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    if (!id) {
      setVisible(false)
      return
    }
    setVisible(true)
    setProgress(100)

    const start = Date.now()
    const tick = setInterval(() => {
      const elapsed = Date.now() - start
      const pct = Math.max(0, 100 - (elapsed / duration) * 100)
      setProgress(pct)
    }, 60)

    const timer = setTimeout(() => {
      setVisible(false)
      onDismiss?.(id)
    }, duration)

    return () => {
      clearInterval(tick)
      clearTimeout(timer)
    }
  }, [id, duration, onDismiss])

  if (!id || !visible) return null

  return (
    <div className="fixed left-0 right-0 bottom-0 z-[55] px-4 safe-bottom pointer-events-none">
      <div className="max-w-lg mx-auto pb-2">
        <div className="toast-in pointer-events-auto bg-surface-2 border border-border-strong rounded-2xl shadow-elev px-4 py-3 flex items-center gap-3 overflow-hidden relative">
          <span className="text-xl">🗑️</span>
          <p className="flex-1 body-md font-semibold truncate">{message}</p>
          <button
            onClick={() => { setVisible(false); onUndo?.(id) }}
            className="text-primary text-xs font-body font-bold uppercase tracking-label bg-primary-soft border border-primary/30 px-3 h-9 rounded-lg active:scale-95"
          >
            {actionLabel}
          </button>

          {/* progress underline */}
          <span
            className="absolute left-0 bottom-0 h-0.5 bg-primary/60 transition-[width] duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}
