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
  const [mode, setMode] = useState(code ? 'view' : 'idle') // 'idle' | 'enter' | 'view'
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

  const handleGenerate = () => {
    apply(generateSyncCode())
  }

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
    <div className="flex flex-col gap-5 slide-up pb-8">
      <div className="flex items-center gap-4 pt-2">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface2 border border-border text-muted active:scale-95 transition-all flex-shrink-0"
        >
          ‹
        </button>
        <div>
          <p className="label mb-0.5">Cross-device sync</p>
          <h1 className="font-display font-black text-3xl uppercase tracking-tight text-text">
            Sync
          </h1>
        </div>
      </div>

      {!configured && (
        <div className="card border-amber-700/40 bg-amber-900/10">
          <p className="font-body font-semibold text-amber-200 mb-1">Sync not configured</p>
          <p className="text-muted text-xs">
            Supabase env vars are missing. See <span className="text-text font-mono">SETUP.md</span> for the setup steps.
          </p>
        </div>
      )}

      {configured && code && mode === 'view' && (
        <>
          <div className="card">
            <p className="label mb-2">Your sync code</p>
            <p className="font-display font-black text-4xl uppercase tracking-widest text-accent text-center my-3">
              {formatSyncCode(code)}
            </p>
            <p className="text-muted text-xs text-center">
              Enter this code on your other device to share your data.
            </p>
          </div>

          <SyncStatus state={syncState} />

          <button
            onClick={handleManualSync}
            disabled={syncState.status === 'syncing'}
            className="btn-ghost w-full text-sm"
          >
            {syncState.status === 'syncing' ? 'Syncing…' : '↻ Sync now'}
          </button>

          <div className="card border-red-900/40">
            <p className="font-body font-semibold text-text mb-1">Disable sync</p>
            <p className="text-muted text-xs mb-3">
              Removes the sync code from this device. Your data stays here, but stops mirroring to the cloud.
              The cloud copy is not deleted.
            </p>
            {confirmDisable ? (
              <div className="flex gap-3">
                <button
                  onClick={handleDisable}
                  className="flex-1 text-red-400 text-sm font-body font-medium bg-red-900/20 border border-red-900/40 px-4 py-2.5 rounded-lg active:scale-95 transition-all"
                >
                  Yes, disable
                </button>
                <button
                  onClick={() => setConfirmDisable(false)}
                  className="flex-1 btn-ghost text-sm"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDisable(true)}
                className="text-red-400 text-sm font-body font-medium bg-red-900/20 border border-red-900/40 px-4 py-2 rounded-lg active:scale-95"
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
            <p className="font-display font-bold text-xl uppercase text-text mb-1">Sync your data</p>
            <p className="text-muted text-sm">
              Use the same sync code on every device — your users, plans, and workout logs are
              kept in sync across all of them.
            </p>
          </div>

          <button
            onClick={handleGenerate}
            className="btn-primary w-full py-4 text-lg"
          >
            Generate New Code
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
            className="input-field text-center text-2xl font-display font-bold uppercase tracking-widest"
            maxLength={9}
          />
          <p className="text-muted text-xs mt-2">
            8 letters/numbers. Find it in <span className="text-text">Sync</span> on your other device.
          </p>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleEnter}
              disabled={normalizeSyncCode(draft).length < 4}
              className={`flex-1 py-3 rounded-lg font-display font-bold uppercase tracking-wide ${
                normalizeSyncCode(draft).length >= 4
                  ? 'bg-accent text-base'
                  : 'bg-surface2 text-muted border border-border'
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
    idle:     { text: 'Idle',           color: 'text-muted',  dot: 'bg-muted' },
    syncing:  { text: 'Syncing…',       color: 'text-text',   dot: 'bg-accent animate-pulse' },
    ok:       { text: 'Synced',         color: 'text-accent', dot: 'bg-accent' },
    error:    { text: 'Sync error',     color: 'text-red-400', dot: 'bg-red-400' },
    disabled: { text: 'Disabled',       color: 'text-muted',  dot: 'bg-muted' },
  }[state.status] || { text: state.status, color: 'text-muted', dot: 'bg-muted' }

  return (
    <div className="card flex items-center gap-3">
      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${meta.dot}`} />
      <div className="flex-1 min-w-0">
        <p className={`font-body font-semibold text-sm ${meta.color}`}>{meta.text}</p>
        {state.lastSyncedAt && (
          <p className="text-muted text-xs">
            Last sync: {new Date(state.lastSyncedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </p>
        )}
        {state.error && (
          <p className="text-red-400 text-xs truncate" title={state.error}>{state.error}</p>
        )}
      </div>
    </div>
  )
}
