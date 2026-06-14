# GeoPulse AI — Supabase Integration Architecture Plan (v1)

## 1) What Supabase should own in v1
- Managed auth (email/password or magic links), JWT issuance, password resets.
- Multi-tenant data boundary via schemas/RLS for users, companies, workspaces.
- Persistence for user profiles, workspace settings, companies, agent run metadata.
- PostgREST access layer for frontend (anon key) and backend (service role) with RLS.
- Storage buckets (optional later) for uploaded company docs; not in v1 if existing storage suffices.

## 2) What remains in FastAPI
- All agent orchestration, scoring, signal processing, and analytics logic.
- Integration with external data sources/APIs and LLM routing.
- Business workflows and privacy/anonymization flows.
- Caching, feature flags, and any non-Postgres persistence already in use.
- API aggregation for the frontend; Supabase stays as data/auth layer, not business logic.

## 3) Recommended first database tables (v1)
**Guiding principles:** small surface, minimal joins, indexed foreign keys, soft-deletes only if required.

- **profiles**
  - `id uuid primary key references auth.users(id)`
  - `full_name text`, `role text`, `email text unique`, `company_id uuid null references companies(id)`
  - `created_at timestamptz default now()`, `updated_at timestamptz default now()`
  - Index: `email` (unique), `company_id` (btree)

- **companies**
  - `id uuid primary key`, `name text not null`, `domain text`, `industry text`, `size_band text`
  - `created_by uuid references profiles(id)`, `created_at timestamptz default now()`
  - Index: `domain` (unique where not null)

- **workspace_settings**
  - `id uuid primary key`, `company_id uuid references companies(id) not null`
  - `default_workspace text`, `feature_flags jsonb default '{}'::jsonb`, `privacy_mode text`
  - `created_at timestamptz default now()`, `updated_at timestamptz default now()`
  - Index: `company_id` (unique)

- **agent_runs**
  - `id uuid primary key`, `company_id uuid references companies(id)`
  - `user_id uuid references profiles(id)`, `status text`, `input jsonb`, `output_summary text`
  - `started_at timestamptz default now()`, `completed_at timestamptz`
  - Index: `company_id`, `user_id`, partial on `status` for open runs

## 4) Row Level Security (RLS) approach
- Default deny on all custom tables; enable RLS and create explicit policies.
- `profiles`: user can `select/update` only their row (`auth.uid() = id`).
- `companies`: users can `select` companies linked to their profile’s `company_id`; writes restricted to service role or admin role claim.
- `workspace_settings`: same company-bound policy; only service role updates.
- `agent_runs`: users can `select/insert` when `company_id` matches their profile `company_id`; only service role can update status/output fields.
- Use JWT claims for roles (e.g., `role` or `is_admin`) to gate admin-level policies.
- Service role key used only server-side (FastAPI) for privileged updates/batch jobs.

## 5) Required environment variables (no secrets here)
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` (frontend public)
- `SUPABASE_SERVICE_ROLE_KEY` (backend only, never in frontend)
- `SUPABASE_JWT_AUD` (if custom, else default)
- `SUPABASE_JWT_SECRET` (backend verification when needed)
- Optional: `SUPABASE_STORAGE_BUCKET` (if/when storage added)

## 6) Frontend integration approach
- Use `@supabase/supabase-js` with the anon key; initialize client once per request (SSR) or per session (client components) using the standard helper (no code added yet).
- Authentication flow: Supabase handles sign-in; store session in cookies; hydrate Next app with the user session on server components where possible.
- Data access: use PostgREST via Supabase client for `profiles/companies/workspace_settings/agent_runs` reads that are safe under RLS; avoid direct service key usage in the browser.
- For AI/agent actions, continue calling FastAPI; Supabase only supplies identity and lightweight metadata.

## 7) Backend integration approach
- Create a Supabase client in FastAPI using the service role key for privileged operations (still behind RLS but with elevated role).
- Sync identity: on user login event (webhook or backend call), ensure a `profiles` row exists; update profile fields from FastAPI as source of truth for roles.
- Reads that need strong filtering can go through Supabase RPC/PostgREST; heavy joins/analytics remain in FastAPI or existing stores.
- For agent runs: FastAPI writes `agent_runs` (with service key) to persist run metadata; frontend reads via RLS-scoped anon key.

## 8) Migration sequence (staged)
1) Create Supabase project and set environment variables (no secrets committed).
2) Define SQL for tables above and indexes (separate migration script, not yet applied here).
3) Enable RLS and add the policies described; test with anon vs service role tokens.
4) Wire FastAPI to upsert `profiles` on auth events; add lightweight health check to Supabase from backend.
5) Update frontend to read `profiles/companies/workspace_settings` via Supabase client where applicable; keep agent actions via FastAPI.
6) Gradually move selected reads (company basics, workspace flags) to Supabase; monitor latency/error metrics.
7) Add storage bucket later if needed; add additional tables only after v1 stability.

## 9) Risks and decisions still required
- Identity authority: Supabase as sole auth vs coexistence with any existing auth (choose one to avoid drift).
- Multi-tenant isolation model: single schema with RLS vs per-tenant schemas (currently proposing single schema + RLS).
- Role taxonomy: need agreed roles/claims (e.g., admin vs member) to finalize policies.
- Data residency/compliance: confirm Supabase region and residency requirements.
- Migration safety: backfill of existing users/companies into Supabase with consistent IDs.
- Performance: RLS policy complexity vs query latency; ensure indexes cover predicates.

## 10) Clear next implementation step
- Draft a SQL migration file (kept in-repo, e.g., `supabase/sql/001_init.sql`) that creates the four tables, indexes, and RLS policies above, but **do not apply it yet**.
