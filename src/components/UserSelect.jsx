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
      <div className="flex flex-col gap-5 slide-up pt-4 pb-8">
        <div>
          <p className="label mb-1">Create profile</p>
          <h1 className="font-display font-black text-4xl uppercase tracking-tight text-text">
            Who's <span className="text-accent">Lifting?</span>
          </h1>
        </div>

        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div className="card">
            <p className="label mb-2">Name</p>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              placeholder="Your name"
              className="input-field text-left text-lg"
              maxLength={20}
            />
          </div>

          <div className="card">
            <p className="label mb-3">Pick an avatar</p>
            <div className="grid grid-cols-8 gap-2">
              {USER_AVATARS.map(a => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAvatar(a)}
                  className={`aspect-square text-2xl rounded-lg border transition-all active:scale-90 ${
                    avatar === a
                      ? 'bg-accent/15 border-accent'
                      : 'bg-surface2 border-border'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className={`w-full py-4 rounded-xl font-display font-black text-xl uppercase tracking-widest transition-all active:scale-95 ${
              name.trim()
                ? 'bg-accent text-base accent-glow'
                : 'bg-surface2 text-muted border border-border cursor-not-allowed'
            }`}
          >
            Create Profile
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
    <div className="flex flex-col gap-5 slide-up pt-4 pb-8">
      <div>
        <p className="label mb-1">Select profile</p>
        <h1 className="font-display font-black text-4xl uppercase tracking-tight text-text">
          Welcome <span className="text-accent">Back</span>
        </h1>
      </div>

      <div className="flex flex-col gap-3">
        {users.map(u => (
          <div
            key={u.id}
            className="card flex items-center gap-4 active:scale-[0.99] transition-all"
          >
            <button
              onClick={() => selectUser(u.id)}
              className="flex-1 flex items-center gap-4 text-left"
            >
              <span className="text-4xl">{u.avatar}</span>
              <div>
                <p className="font-display font-bold text-xl uppercase text-text tracking-wide">
                  {u.name}
                </p>
                <p className="text-muted text-xs mt-0.5">Tap to continue</p>
              </div>
            </button>

            {confirmDelete === u.id ? (
              <div className="flex gap-2">
                <button
                  onClick={() => { removeUser(u.id); setConfirmDelete(null) }}
                  className="text-red-400 text-xs font-body font-medium bg-red-900/20 border border-red-900/40 px-3 py-2 rounded-lg active:scale-95"
                >
                  Delete
                </button>
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="text-muted text-xs font-body bg-surface2 border border-border px-3 py-2 rounded-lg active:scale-95"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(u.id)}
                className="w-9 h-9 flex items-center justify-center text-muted rounded-lg bg-surface2 border border-border active:scale-90 transition-all text-lg"
                title="Delete profile"
              >
                🗑
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={() => { setName(''); setAvatar(USER_AVATARS[0]); setCreating(true) }}
        className="w-full py-4 rounded-xl border-2 border-dashed border-border text-muted font-display font-bold uppercase tracking-widest active:scale-95 transition-all hover:border-accent/40 hover:text-accent"
      >
        + New Profile
      </button>
    </div>
  )
}
