import React, { useState } from 'react'
import { useUser } from '../context/UserContext.jsx'
import { USER_AVATARS } from '../data/defaultPlan.js'

export default function UserSelect() {
  const { users, createUser, removeUser, selectUser } = useUser()
  const [creating, setCreating] = useState(users.length === 0)
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(USER_AVATARS[0])
  const [confirmDelete, setConfirmDelete] = useState(null)

  const handleCreate = (e) => {
    e?.preventDefault?.()
    const trimmed = name.trim()
    if (!trimmed) return
    const user = createUser({ name: trimmed, avatar })
    selectUser(user.id)
  }

  if (creating) {
    return (
      <div className="flex flex-col gap-5 slide-up pt-6 pb-8">
        <div>
          <p className="caption mb-1">Create profile</p>
          <h1 className="page-title">
            Who's <span className="text-primary">lifting?</span>
          </h1>
        </div>

        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div className="card flex flex-col gap-3">
            <div>
              <p className="label mb-1.5">Name</p>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
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
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className={`w-full h-14 rounded-2xl font-display font-bold text-base tracking-tightish transition-all active:scale-[0.98] ${
              name.trim()
                ? 'bg-primary-gradient text-white shadow-glow'
                : 'bg-surface-2 text-text-tertiary border border-border cursor-not-allowed'
            }`}
          >
            Create profile
          </button>

          {users.length > 0 && (
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="btn-ghost w-full text-sm"
            >
              ‹ Back to profiles
            </button>
          )}
        </form>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 slide-up pt-6 pb-8">
      <div>
        <p className="caption mb-1">Select profile</p>
        <h1 className="page-title">
          Welcome <span className="text-primary">back</span>
        </h1>
      </div>

      <div className="flex flex-col gap-2.5">
        {users.map(u => (
          <div
            key={u.id}
            className="card flex items-center gap-3"
          >
            <button
              onClick={() => selectUser(u.id)}
              className="flex-1 flex items-center gap-3 text-left active:opacity-80 transition-opacity"
            >
              <div className="w-12 h-12 rounded-2xl bg-surface-3 border border-border flex items-center justify-center text-3xl flex-shrink-0">
                {u.avatar}
              </div>
              <div className="min-w-0">
                <p className="font-display font-bold text-lg tracking-tightish text-text-primary truncate">
                  {u.name}
                </p>
                <p className="caption mt-0.5">Tap to continue</p>
              </div>
            </button>

            {confirmDelete === u.id ? (
              <div className="flex gap-2">
                <button
                  onClick={() => { removeUser(u.id); setConfirmDelete(null) }}
                  className="btn-danger text-xs"
                >
                  Delete
                </button>
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="text-text-secondary text-xs font-body bg-surface-2 border border-border px-3 h-10 rounded-lg active:scale-95"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(u.id)}
                className="btn-icon flex-shrink-0"
                title="Delete profile"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M3 6h18" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={() => { setName(''); setAvatar(USER_AVATARS[0]); setCreating(true) }}
        className="w-full h-14 rounded-2xl border border-dashed border-border-strong text-text-secondary font-display font-semibold text-sm tracking-tightish active:scale-[0.98] transition-all hover:border-primary/40 hover:text-primary hover:bg-primary-soft inline-flex items-center justify-center gap-2"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <path d="M12 5v14M5 12h14" />
        </svg>
        New profile
      </button>
    </div>
  )
}
