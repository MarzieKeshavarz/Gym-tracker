import React, { useEffect, useRef, useState, useCallback } from 'react'

const SWIPE_DISMISS_PX = 90

// Touch-friendly bottom sheet. Tap-overlay, swipe-down, and Escape all dismiss.
// `open` toggles visibility; the component still mounts so close animations
// can play.
export default function BottomSheet({ open, onClose, title, children, footer }) {
  const [visible, setVisible] = useState(open)
  const [closing, setClosing] = useState(false)
  const sheetRef = useRef(null)
  const touchStartY = useRef(null)
  const touchDeltaY = useRef(0)

  const close = useCallback(() => {
    if (closing) return
    setClosing(true)
    setTimeout(() => {
      setClosing(false)
      setVisible(false)
      onClose?.()
    }, 220)
  }, [closing, onClose])

  useEffect(() => {
    if (open) {
      setVisible(true)
      setClosing(false)
    } else if (visible) {
      close()
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!visible) return
    const onKey = (e) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [visible, close])

  const onTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY
    touchDeltaY.current = 0
  }
  const onTouchMove = (e) => {
    if (touchStartY.current == null) return
    const dy = e.touches[0].clientY - touchStartY.current
    if (dy > 0 && sheetRef.current) {
      touchDeltaY.current = dy
      sheetRef.current.style.transform = `translateY(${dy}px)`
    }
  }
  const onTouchEnd = () => {
    if (sheetRef.current) sheetRef.current.style.transform = ''
    if (touchDeltaY.current > SWIPE_DISMISS_PX) close()
    touchStartY.current = null
    touchDeltaY.current = 0
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div
        onClick={close}
        className={`absolute inset-0 bg-black/55 backdrop-blur-sm transition-opacity duration-200 ${
          closing ? 'opacity-0' : 'opacity-100'
        }`}
        aria-hidden
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        className={`relative max-w-lg w-full mx-auto bg-surface border-t border-border rounded-t-3xl shadow-elev safe-bottom max-h-[90vh] flex flex-col ${
          closing ? 'sheet-out' : 'sheet-in'
        }`}
      >
        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          className="pt-3 pb-1.5 flex justify-center cursor-grab active:cursor-grabbing"
        >
          <span className="block w-10 h-1.5 rounded-full bg-border-strong" />
        </div>

        {title && (
          <div className="px-5 pb-3">
            <p className="font-display font-bold text-xl tracking-tightish text-text-primary">
              {title}
            </p>
          </div>
        )}

        <div className="px-5 pb-4 overflow-y-auto flex-1">
          {children}
        </div>

        {footer && (
          <div className="px-5 pt-3 pb-3 border-t border-border bg-surface">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
