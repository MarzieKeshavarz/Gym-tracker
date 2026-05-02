import React, { useEffect } from 'react'

// Centered confirmation dialog for destructive actions.
//   tone='danger' renders the confirm button as a destructive CTA.
export default function ConfirmDialog({
  open,
  title,
  description,
  bullets,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onCancel?.() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  const confirmClass = tone === 'danger'
    ? 'bg-danger text-white shadow-glow'
    : 'bg-primary-gradient text-white shadow-glow'

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-5">
      <div
        onClick={onCancel}
        className="absolute inset-0 bg-black/65 backdrop-blur-sm fade-in"
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-sm bg-surface border border-border-strong rounded-2xl shadow-elev p-5 slide-up"
      >
        <p className="font-display font-bold text-xl tracking-tightish text-text-primary">
          {title}
        </p>
        {description && (
          <p className="body-sm mt-2">{description}</p>
        )}
        {bullets?.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2 body-sm">
                <span className="text-text-tertiary mt-1.5 text-[6px]">●</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2 mt-5">
          <button
            onClick={onCancel}
            className="flex-1 h-12 rounded-xl bg-surface-2 border border-border text-text-primary font-display font-semibold text-sm tracking-tightish active:scale-[0.98] transition-all hover:border-border-strong"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 h-12 rounded-xl font-display font-bold text-sm tracking-tightish active:scale-[0.98] transition-all ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
