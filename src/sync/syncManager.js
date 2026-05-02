import { supabase, isSupabaseConfigured } from './supabaseClient.js'
import {
  getRawUsers, setRawUsers,
  getRawPlans, setRawPlans,
  getRawLogs, setRawLogs,
  registerChangeListener,
  notifyDataChange,
} from '../utils/storage.js'

const SYNC_CODE_KEY = 'gymlog_sync_code'

// ─── Sync code ───────────────────────────────────────────────────────────────

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no I, O, 0, 1
const CODE_LEN = 8

export function generateSyncCode() {
  let s = ''
  for (let i = 0; i < CODE_LEN; i++) {
    s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return s.slice(0, 4) + '-' + s.slice(4)
}

export function normalizeSyncCode(code) {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LEN)
}

export function formatSyncCode(code) {
  const c = normalizeSyncCode(code)
  if (c.length <= 4) return c
  return c.slice(0, 4) + '-' + c.slice(4)
}

export function getSyncCode() {
  return localStorage.getItem(SYNC_CODE_KEY) || null
}

export function setSyncCode(code) {
  if (!code) {
    localStorage.removeItem(SYNC_CODE_KEY)
  } else {
    localStorage.setItem(SYNC_CODE_KEY, normalizeSyncCode(code))
  }
}

// ─── Snapshot helpers ────────────────────────────────────────────────────────

function snapshot() {
  return {
    users: getRawUsers(),
    plans: getRawPlans(),
    logs: getRawLogs(),
  }
}

function applySnapshot(snap) {
  setRawUsers(snap.users || [])
  setRawPlans(snap.plans || [])
  setRawLogs(snap.logs || [])
}

// Compare two snapshots — purely a byte-level check to decide whether to push.
function snapshotEquals(a, b) {
  return JSON.stringify(a) === JSON.stringify(b)
}

// ─── Merge ───────────────────────────────────────────────────────────────────
// Last-write-wins per entity, by id, using max(updatedAt, deletedAt).

function entityClock(e) {
  return Math.max(e.updatedAt || 0, e.deletedAt || 0)
}

function mergeCollection(local, remote) {
  const byId = new Map()
  for (const e of local) byId.set(e.id, e)
  for (const e of remote) {
    const existing = byId.get(e.id)
    if (!existing || entityClock(e) > entityClock(existing)) {
      byId.set(e.id, e)
    }
  }
  return Array.from(byId.values())
}

export function mergeSnapshots(local, remote) {
  return {
    users: mergeCollection(local.users || [], remote.users || []),
    plans: mergeCollection(local.plans || [], remote.plans || []),
    logs:  mergeCollection(local.logs  || [], remote.logs  || []),
  }
}

// ─── State ───────────────────────────────────────────────────────────────────

let state = {
  status: 'idle',     // 'idle' | 'syncing' | 'ok' | 'error' | 'disabled'
  lastSyncedAt: null, // ms
  error: null,        // string | null
}
const listeners = new Set()

export function getSyncState() { return state }

export function subscribeSyncState(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function setState(patch) {
  state = { ...state, ...patch }
  for (const fn of listeners) {
    try { fn(state) } catch { /* ignore */ }
  }
}

// ─── Network ─────────────────────────────────────────────────────────────────

async function rpcGet(code) {
  const { data, error } = await supabase.rpc('gymlog_get', { code })
  if (error) throw error
  return data || null
}

async function rpcUpsert(code, payload) {
  const { error } = await supabase.rpc('gymlog_upsert', { code, payload })
  if (error) throw error
}

// ─── Sync cycle ──────────────────────────────────────────────────────────────

let inFlight = null
let pending = false

/**
 * Pull from cloud, merge with local, push back if changed.
 * Coalesces concurrent calls into a single in-flight request and one pending
 * follow-up so rapid local writes don't pile up.
 */
export async function syncNow() {
  if (!isSupabaseConfigured()) {
    setState({ status: 'disabled', error: null })
    return
  }
  const code = getSyncCode()
  if (!code) {
    setState({ status: 'disabled', error: null })
    return
  }
  if (inFlight) { pending = true; return inFlight }

  inFlight = (async () => {
    setState({ status: 'syncing', error: null })
    try {
      const local = snapshot()
      const remote = await rpcGet(code)

      let merged
      if (remote) {
        merged = mergeSnapshots(local, remote)
      } else {
        merged = local
      }

      if (!snapshotEquals(merged, local)) {
        applySnapshot(merged)
        // Local data was just rewritten from a remote pull — broadcast so
        // React contexts can refresh without a tab reload.
        notifyDataChange('remote')
      }

      // Push if cloud differs from merged (also covers first-time push when remote is null).
      if (!remote || !snapshotEquals(merged, remote)) {
        await rpcUpsert(code, merged)
      }

      setState({ status: 'ok', lastSyncedAt: Date.now(), error: null })
    } catch (err) {
      setState({ status: 'error', error: err?.message || String(err) })
    } finally {
      inFlight = null
      if (pending) {
        pending = false
        // Schedule another pass without recursing the await chain.
        setTimeout(() => { syncNow() }, 0)
      }
    }
  })()

  return inFlight
}

// ─── Triggers ────────────────────────────────────────────────────────────────

let debounceTimer = null

function scheduleSync() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { syncNow() }, 800)
}

let attached = false

export function startSync() {
  if (attached) return
  attached = true

  registerChangeListener(scheduleSync)

  // Pull on tab focus / visibility change
  const onFocus = () => { syncNow() }
  window.addEventListener('focus', onFocus)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') syncNow()
  })
  window.addEventListener('online', onFocus)

  // Initial pass
  syncNow()
}
