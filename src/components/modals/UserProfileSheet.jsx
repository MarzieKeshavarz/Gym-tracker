import React, { useState, useEffect } from 'react'
import { useUser } from '../../context/UserContext.jsx'
import { USER_AVATARS } from '../../data/defaultPlan.js'
import BottomSheet from './BottomSheet.jsx'
import ConfirmDialog from './ConfirmDialog.jsx'

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
  const [confirmOpen, setConfirmOpen] = useState(false)

  // Reset form whenever the sheet opens for a new user.
  useEffect(() => {
    if (open && target) {
      setName(target.name)
      setAvatar(target.avatar)
    }
  }, [open, target?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!target) return null

  const dirty = name.trim() !== target.name || avatar !== target.avatar
  const validName = name.trim().length > 0

  const handleSave = () => {
    if (!validName || !dirty) return
    editUser(target.id, { name: name.trim(), avatar })
    onClose?.()
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

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  )
}
