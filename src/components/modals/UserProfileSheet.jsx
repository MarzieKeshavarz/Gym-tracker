import React, { useState, useEffect } from 'react'
import { useUser } from '../../context/UserContext.jsx'
import { USER_AVATARS } from '../../data/defaultPlan.js'
import BottomSheet from './BottomSheet.jsx'
import ConfirmDialog from './ConfirmDialog.jsx'
import { useBodyMetrics } from '../../hooks/useBodyMetrics.js'
import BodyLogSheet from '../body/BodyLogSheet.jsx'
import { formatDate } from '../../utils/storage.js'
import { exportUserActivities } from '../../utils/exportData.js'

// Edit name + avatar for a single user, plus a destructive delete action.
// `user` is the user being edited (defaults to currentUser).
export default function UserProfileSheet({
  open,
  onClose,
  user,
  onSwitchUser,
}) {
  const { editUser, removeUser, userCascadeCounts, currentUser } = useUser()
  const target = user || currentUser

  const [name, setName] = useState(target?.name || '')
  const [avatar, setAvatar] = useState(target?.avatar || USER_AVATARS[0])
  const [height, setHeight] = useState(target?.heightCm ? String(target.heightCm) : '')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [bodyLogOpen, setBodyLogOpen] = useState(false)
  const [exportMsg, setExportMsg] = useState(null)

  // Body summary — only meaningful for the user whose profile is open.
  // The hook reads from currentUser, so this is only correct when target ===
  // currentUser, which matches every entry point in the app today.
  const { latest, hasAny } = useBodyMetrics()

  // Reset form whenever the sheet opens for a new user.
  useEffect(() => {
    if (open && target) {
      setName(target.name)
      setAvatar(target.avatar)
      setHeight(target.heightCm ? String(target.heightCm) : '')
    }
  }, [open, target?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!target) return null

  const heightNum = height === '' ? null : Number(height)
  const heightChanged =
    (target.heightCm || null) !== (Number.isFinite(heightNum) && heightNum > 0 ? Math.round(heightNum * 10) / 10 : null)

  const dirty =
    name.trim() !== target.name ||
    avatar !== target.avatar ||
    heightChanged
  const validName = name.trim().length > 0

  const handleSave = () => {
    if (!validName || !dirty) return
    const patch = { name: name.trim(), avatar }
    if (heightChanged) {
      patch.heightCm = Number.isFinite(heightNum) && heightNum > 0 ? heightNum : null
    }
    editUser(target.id, patch)
    onClose?.()
  }

  const handleExport = () => {
    const counts = exportUserActivities(target)
    const parts = []
    if (counts.workouts) parts.push(`${counts.workouts} workout${counts.workouts === 1 ? '' : 's'}`)
    if (counts.steps) parts.push(`${counts.steps} step entr${counts.steps === 1 ? 'y' : 'ies'}`)
    if (counts.body) parts.push(`${counts.body} body entr${counts.body === 1 ? 'y' : 'ies'}`)
    setExportMsg(parts.length ? `Exported ${parts.join(', ')}` : 'Nothing to export yet')
    setTimeout(() => setExportMsg(null), 2500)
  }

  const handleDeleteClick = () => setConfirmOpen(true)

  const handleConfirmDelete = () => {
    setConfirmOpen(false)
    removeUser(target.id)
    onClose?.()
  }

  const counts = userCascadeCounts(target.id)
  const bullets = []
  if (counts.logs > 0) bullets.push(`${counts.logs} workout session${counts.logs === 1 ? '' : 's'}`)
  if (counts.plans > 0) bullets.push(`${counts.plans} plan${counts.plans === 1 ? '' : 's'}`)
  if (counts.bodyMetrics > 0) bullets.push(`${counts.bodyMetrics} body measurement${counts.bodyMetrics === 1 ? '' : 's'}`)
  bullets.push('Streak history')
  bullets.push('Calorie totals')

  return (
    <>
      <BottomSheet
        open={open}
        onClose={onClose}
        title="Edit profile"
        footer={
          <button
            onClick={handleSave}
            disabled={!validName || !dirty}
            className={`w-full h-13 rounded-2xl font-display font-bold text-base tracking-tightish transition-all active:scale-[0.98] ${
              validName && dirty
                ? 'bg-primary-gradient text-white shadow-glow'
                : 'bg-surface-2 text-text-tertiary border border-border cursor-not-allowed'
            }`}
            style={{ height: '52px' }}
          >
            {dirty ? 'Save changes' : 'No changes'}
          </button>
        }
      >
        <div className="flex flex-col gap-4">
          {/* Live preview */}
          <div className="flex items-center gap-3 card-flat">
            <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-surface-3 border border-border text-3xl flex-shrink-0">
              {avatar}
            </div>
            <div className="min-w-0">
              <p className="caption">Preview</p>
              <p className="font-display font-bold text-lg tracking-tightish text-text-primary truncate">
                {name.trim() || '—'}
              </p>
            </div>
          </div>

          <div>
            <p className="label mb-1.5">Name</p>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              className="input-text"
              maxLength={20}
            />
          </div>

          <div>
            <p className="label mb-2">Avatar</p>
            <div className="grid grid-cols-8 gap-1.5">
              {USER_AVATARS.map(a => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAvatar(a)}
                  className={`aspect-square text-2xl rounded-xl border transition-all active:scale-90 ${
                    avatar === a
                      ? 'bg-primary-soft border-primary'
                      : 'bg-surface-3 border-border hover:border-border-strong'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="label mb-1.5">Height (for BMI)</p>
            <div className="relative">
              <input
                type="number"
                inputMode="numeric"
                value={height}
                onChange={e => setHeight(e.target.value)}
                placeholder="e.g. 172"
                min="80"
                max="260"
                step="0.5"
                className="input-text pr-12"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 caption tabular">cm</span>
            </div>
          </div>

          <div className="card-flat flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-soft border border-primary/25 flex items-center justify-center text-xl flex-shrink-0">
              ⚖️
            </div>
            <div className="flex-1 min-w-0">
              <p className="caption">Latest body</p>
              {hasAny && latest ? (
                <p className="body-md font-semibold tabular truncate">
                  {latest.weight}<span className="text-text-tertiary text-xs font-body font-medium ml-1">kg</span>
                  <span className="text-text-tertiary"> · {formatDate(latest.date + 'T00:00:00')}</span>
                </p>
              ) : (
                <p className="body-sm">No measurements yet</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setBodyLogOpen(true)}
              className="btn-ghost h-9 px-3 text-sm"
            >
              {hasAny ? 'Update' : 'Log'}
            </button>
          </div>

          {/* Secondary actions */}
          <div className="flex flex-col gap-2 pt-1">
            {onSwitchUser && (
              <button
                onClick={() => { onClose?.(); onSwitchUser?.() }}
                className="w-full h-11 rounded-xl bg-surface-2 border border-border text-text-primary font-body font-medium text-sm active:scale-[0.98] transition-all hover:border-border-strong inline-flex items-center justify-center gap-2"
              >
                <SwitchIcon /> Switch profile
              </button>
            )}
            <button
              onClick={handleExport}
              className="w-full h-11 rounded-xl bg-surface-2 border border-border text-text-primary font-body font-medium text-sm active:scale-[0.98] transition-all hover:border-border-strong inline-flex items-center justify-center gap-2"
            >
              <DownloadIcon /> Export data
            </button>
            {exportMsg && (
              <p className="caption text-center text-text-secondary tabular">{exportMsg}</p>
            )}
            <button
              onClick={handleDeleteClick}
              className="w-full h-11 rounded-xl bg-danger/10 border border-danger/25 text-danger font-body font-semibold text-sm active:scale-[0.98] transition-all inline-flex items-center justify-center gap-2"
            >
              <TrashIcon /> Delete profile
            </button>
          </div>
        </div>
      </BottomSheet>

      <ConfirmDialog
        open={confirmOpen}
        title={`Delete ${target.name}?`}
        description="This will permanently remove:"
        bullets={bullets}
        confirmLabel="Delete profile"
        tone="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />

      <BodyLogSheet
        open={bodyLogOpen}
        onClose={() => setBodyLogOpen(false)}
        editing={hasAny ? latest : null}
      />
    </>
  )
}

function SwitchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M16 3h5v5" />
      <path d="M4 20 21 3" />
      <path d="M21 16v5h-5" />
      <path d="M15 15l6 6" />
      <path d="M4 4l5 5" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  )
}
