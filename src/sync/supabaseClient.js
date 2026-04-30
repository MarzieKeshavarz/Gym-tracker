import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = url && anonKey
  ? createClient(url, anonKey, {
      auth: { persistSession: false },
    })
  : null

/**
 * Returns true when env vars are set and a client was created. When false,
 * the rest of the app should treat sync as disabled.
 */
export const isSupabaseConfigured = () => supabase !== null
