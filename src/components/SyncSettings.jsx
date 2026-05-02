import React, { useState, useEffect } from 'react'
import {
  generateSyncCode, normalizeSyncCode, formatSyncCode,
  getSyncCode, setSyncCode, syncNow, subscribeSyncState, getSyncState,
} from '../sync/syncManager.js'
import { isSupabaseConfigured } from '../sync/supabaseClient.js'
import { useUser } from '../context/UserContext.jsx'
import { usePlan } from '../context/PlanContext.jsx'

export default function SyncSettings({ onBack }) {
  const [code, setCodeState] = useState(() => getSyncCode())
  const [draft, setDraft] = useState('')
  const [mode, setMode] = useState(code ? 'view' : 'idle')
  const [syncState, setSyncState] = useState(() => getSyncState())
  const [confirmDisable, setConfirmDisable] = useState(false)
  const { refreshUsers } = useUser()
  const { refresh: refreshPlans } = usePlan()

  useEffect(() => subscribeSyncState(setSyncState), [])

  const configured = isSupabaseConfigured()

  const apply = (newCode) => {
    setSyncCode(newCode)
    setCodeState(newCode)
    setMode('view')
    syncNow().then(() => {
      refreshUsers()
      refreshPlans()
    })
  }

  const handleGenerate = () => apply(generateSyncCode())

  const handleEnter = () => {
    const norm = normalizeSyncCode(draft)
    if (norm.length < 4) return
    apply(norm)
    setDraft('')
  }

  const handleDisable = () => {
    setSyncCode(null)
    setCodeState(null)
    setConfirmDisable(false)
    setMode('idle')
  }

  const handleManualSync = () => {
    syncNow().then(() => {
      refreshUsers()
      refreshPlans()
    })
  }

  return (
    <div className="flex flex-col gap-5 slide-up pt-5 pb-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="btn-icon flex-shrink-0"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <path d="m15 6-6 6 6 6" />
          </svg>
        </button>
        <div>
          <p className="caption">Cross-device sync</p>
          <h1 className="font-display font-bold text-[28px] leading-[1.1] tracking-tighter2 text-text-primary">
            Sync
          </h1>
        </div>
      </div>

      {!configured && (
        <div className="card border-warning/30 bg-warning/10">
          <p className="font-body font-semibold text-warning mb-1">Sync not configured</p>
          <p className="body-sm">
            Supabase env vars are missing. See <span className="text-text-primary font-mono">SETUP.md</span> for setup steps.
          </p>
        </div>
      )}

      {configured && code && mode === 'view' && (
        <>
          <div className="card text-center">
            <p className="label mb-3">Your sync code</p>
            <p className="font-display font-bold text-[32px] tracking-[0.18em] text-primary tabular my-2">
              {formatSyncCode(code)}
            </p>
            <p className="body-sm mt-1">
              Enter this code on your other device to share your data.
            </p>
          </div>

          <SyncStatus state={syncState} />

          <button
            onClick={handleManualSync}
            disabled={syncState.status === 'syncing'}
            className="btn-ghost w-full"
          >
            {syncState.status === 'syncing' ? 'Syncing…' : '↻ Sync now'}
          </button>

          <div className="card border-danger/25">
            <p className="font-display font-semibold text-base text-text-primary mb-1">Disable sync</p>
            <p className="body-sm mb-3">
              Removes the sync code from this device. Your data stays here, but stops mirroring to the cloud. The cloud copy is not deleted.
            </p>
            {confirmDisable ? (
              <div className="flex gap-2.5">
                <button
                  onClick={handleDisable}
                  className="flex-1 btn-danger"
                >
                  Yes, disable
                </button>
                <button
                  onClick={() => setConfirmDisable(false)}
                  className="flex-1 btn-ghost"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDisable(true)}
                className="btn-danger"
              >
                Disable sync
              </button>
            )}
          </div>
        </>
      )}

      {configured && !code && mode === 'idle' && (
        <>
          <div className="card">
            <p className="font-display font-bold text-lg tracking-tightish text-text-primary mb-1.5">Sync your data</p>
            <p className="body-sm">
              Use the same sync code on every device — your users, plans, and workout logs are
              kept in sync across all of them.
            </p>
          </div>

          <button
            onClick={handleGenerate}
            className="btn-primary w-full h-14 text-base"
          >
            Generate new code
          </button>

          <button
            onClick={() => setMode('enter')}
            className="btn-ghost w-full"
          >
            I already have a code
          </button>
        </>
      )}

      {configured && mode === 'enter' && (
        <div className="card">
          <p className="label mb-2">Enter sync code</p>
          <input
            type="text"
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="ABCD-1234"
            className="input-field text-2xl font-display font-bold tracking-[0.18em] uppercase"
            maxLength={9}
          />
          <p className="caption mt-2">
            8 letters/numbers. Find it in <span className="text-text-primary">Sync</span> on your other device.
          </p>
          <div className="flex gap-2.5 mt-4">
            <button
              onClick={handleEnter}
              disabled={normalizeSyncCode(draft).length < 4}
              className={`flex-1 h-12 rounded-xl font-display font-bold text-sm tracking-tightish transition-all active:scale-[0.98] ${
                normalizeSyncCode(draft).length >= 4
                  ? 'bg-primary-gradient text-white shadow-glow'
                  : 'bg-surface-2 text-text-tertiary border border-border cursor-not-allowed'
              }`}
            >
              Connect
            </button>
            <button
              onClick={() => { setMode('idle'); setDraft('') }}
              className="flex-1 btn-ghost"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function SyncStatus({ state }) {
  const meta = {
    idle:     { text: 'Idle',       color: 'text-text-secondary', dot: 'bg-text-tertiary' },
    syncing:  { text: 'Syncing…',   color: 'text-text-primary',   dot: 'bg-primary animate-pulse' },
    ok:       { text: 'Synced',     color: 'text-success',        dot: 'bg-success' },
    error:    { text: 'Sync error', color: 'text-danger',         dot: 'bg-danger' },
    disabled: { text: 'Disabled',   color: 'text-text-secondary', dot: 'bg-text-tertiary' },
  }[state.status] || { text: state.status, color: 'text-text-secondary', dot: 'bg-text-tertiary' }

  return (
    <div className="card flex items-center gap-3">
      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${meta.dot}`} />
      <div className="flex-1 min-w-0">
        <p className={`font-body font-semibold text-sm ${meta.color}`}>{meta.text}</p>
        {state.lastSyncedAt && (
          <p className="caption tabular">
            Last sync · {new Date(state.lastSyncedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </p>
        )}
        {state.error && (
          <p className="text-danger text-xs truncate" title={state.error}>{state.error}</p>
        )}
      </div>
    </div>
  )
}
