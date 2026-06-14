# GeoPulse AI Progress Log

## 2026-06-14 — Supabase Architecture Preparation

### Current Focus

Preparing GeoPulse AI for staged Supabase integration without applying live database changes yet.

### Current App State

* Frontend and FastAPI backend are already working locally.
* Agent execution should remain in FastAPI.
* Supabase is being introduced as the auth, data, and persistence layer.
* Company profile calibration is currently local-only and not yet persisted.
* Agent run metadata is not yet persisted.
* The first Supabase task is migration drafting only.

### Decisions Made

* Supabase should own managed auth, user/company/workspace metadata, and lightweight run persistence.
* FastAPI should continue to own agent orchestration, scoring, signal processing, LLM routing, analytics, and external API integration.
* Use a single-schema, RLS-based tenant model for v1.
* Service role key must remain backend-only.
* Frontend must only use the anon key under RLS.

### Files Expected To Change

* `supabase/sql/001_init.sql`
* `docs/PROGRESS_LOG.md`

### Do Not Do Yet

* Do not apply the migration.
* Do not wire frontend Supabase auth yet.
* Do not move agent logic out of FastAPI.
* Do not expose service-role keys to the frontend.
* Do not change working agent-chain logic.

### Acceptance Checks

* `supabase/sql/001_init.sql` exists.
* `docs/PROGRESS_LOG.md` exists.
* No secrets are committed.
* RLS is enabled for all custom Supabase tables.
* SQL policies are explicit.
* Existing frontend/backend files are not unnecessarily changed.
* `git status --short` clearly shows only the intended file changes.
