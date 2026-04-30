# Setup

This app is fully offline-capable as a PWA. Cross-device sync is **optional** — without it, the app still works, just per-device.

## 1. Install + run

```sh
npm install
npm run dev
```

## 2. Install as a PWA on your phone

1. Open the deployed site (e.g. https://your-username.github.io/Gym-tracker/) in **Chrome on Android** or **Safari on iOS**.
2. **Android (Chrome):** tap the menu → *Install app* (or *Add to Home screen*).
3. **iOS (Safari):** tap the share button → *Add to Home Screen*.
4. The app launches in standalone mode (no browser chrome) and works offline.

> If the dev server is running locally, Chrome won't show "Install" until the site is served over HTTPS or `localhost`. Production from GitHub Pages is HTTPS, so installation works there directly.

## 3. Cross-device sync (Supabase)

Sync is done with a **sync code** — type the same code on every device, and your users / plans / workout logs stay in sync. No accounts, no email.

### Create the Supabase project

1. Sign up at <https://supabase.com> (free).
2. *New project* → pick a name + password → wait ~1 min for provisioning.
3. *Project Settings → API*. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`
4. Create `.env.local` in the repo root:

   ```env
   VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```

### Create the table + RPC functions

Open *SQL Editor* in Supabase, paste the block below, click **Run**:

```sql
-- Storage table. Each sync code maps to a single JSONB blob.
create table if not exists public.gymlog_sync (
  sync_code text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- Lock down the table itself.
alter table public.gymlog_sync enable row level security;

-- No direct table access. All reads/writes go through these functions, which
-- require knowing the sync_code (PK) — preventing a bulk dump.
create or replace function public.gymlog_get(code text)
returns jsonb language sql security definer set search_path = public as $$
  select data from public.gymlog_sync where sync_code = code;
$$;

create or replace function public.gymlog_upsert(code text, payload jsonb)
returns void language sql security definer set search_path = public as $$
  insert into public.gymlog_sync (sync_code, data, updated_at)
  values (code, payload, now())
  on conflict (sync_code) do update
    set data = excluded.data,
        updated_at = excluded.updated_at;
$$;

-- Allow the anon role to call them.
grant execute on function public.gymlog_get(text)             to anon, authenticated;
grant execute on function public.gymlog_upsert(text, jsonb)   to anon, authenticated;
```

### Enable sync in the app

1. Restart `npm run dev` so Vite picks up the env vars.
2. In the app: *Settings cog → Sync → Generate New Code*.
3. On your other device: *Sync → I already have a code* → enter the code.
4. Both devices now mirror users / plans / logs through the cloud. Pulls happen on app focus; pushes happen ~800ms after each local change.

### Threat model

The sync code IS the access control. Anyone who knows the code can read and write that row. For personal workout data this is fine. If you'd like stronger guarantees, see *Anonymous auth + pairing* in the original chat thread.

## 4. Deploy to GitHub Pages

The repo already has a Pages workflow. After pushing `main`:

- Set the env vars as **GitHub repository secrets** (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) and reference them in the workflow's build step (`env:` block).
- Without the secrets, the production build still works — sync just shows up as *Not configured*.
