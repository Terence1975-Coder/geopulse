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

## 2026-06-17 — Supabase Persistence Milestone — Agent Context Propagation

Completed frontend agent context propagation so hydrated Supabase company profile data now flows into agent requests.

### Achieved

- Preserved Supabase `company_id` in dashboard profile mapping.
- Derived `companyId` from hydrated company profile state.
- Passed `companyId` into Analyst, Advisor, Planner, Profile Agent, and Agent Chain workspaces.
- Updated Agent Chain to forward `companyId` into full-chain agent calls.
- Confirmed `engageAgent()` request payload includes:
  - `company_id`
  - `company_name`
  - `company_profile`
- Confirmed frontend build passes.
- No Supabase schema changes.
- No auth changes.
- No service-role key exposure.
- No demo fallback company IDs reintroduced.

### Product Impact

GeoPulse now has a working persistence-to-reasoning loop:

Saved Supabase company calibration → dashboard hydration → agent request payload → backend company context → company-aware intelligence output.

This is the first proper memory loop in the product.

## 2026-06-18 — Supabase Agent Run Persistence

### Current Status

GeoPulse has reached a major Supabase persistence milestone.

The product now has:

* Backend Supabase connection confirmed.
* Company profile calibration saved to Supabase.
* Company profile hydration working on dashboard load.
* Hydrated company context passed into agent workflows.
* Safe company-context observability added.
* Supporting signal serialization warnings fixed.
* Backend-only agent run metadata persistence implemented.
* Frontend production build passing.
* GitHub aligned up to latest pushed commit before agent run persistence validation.

### Latest Confirmed Pushed Commit

```bash
f40e013 Fix supporting signal detail serialization warnings
```

### Current Uncommitted Work

Agent run persistence has been implemented but still needs final validation and commit.

Changed files expected:

```text
backend/services/agent_runs.py
backend/intel/agent_service.py
backend/intel/router.py
backend/routers/intel.py
```

### New Capability Added

Backend-only Supabase persistence for agent run metadata on:

```text
POST /intel/agent/engage
```

A new helper was added:

```text
backend/services/agent_runs.py
```

It performs best-effort Supabase writes using backend service-role access only.

Agent run lifecycle:

```text
create running run
→ execute agent flow
→ mark completed with output summary
→ mark failed if an exception occurs
```

Business logic remains unchanged.

### Key Implementation Notes

* Agent service now runs asynchronously.
* Router awaits the agent service.
* Agent run persistence is best-effort.
* Supabase write failure must not break the user-facing agent response.
* Service-role key remains backend-only.
* No frontend Supabase access introduced.
* No auth changes made.

### Tomorrow’s Plan

1. **Validate async backend path**
   - `grep -n "service.engage" backend/intel/router.py` → expect `await service.engage(payload)`

2. **Build check**
   - `npm --prefix frontend run build` → expect successful build and type checks

3. **Start backend**
   - `source .venv/bin/activate && python -m uvicorn backend.main:app --reload --port 8000`

4. **Start frontend**
   - `npm --prefix frontend run dev` and open `http://127.0.0.1:3000/dashboard`

5. **Run Agent Chain test**
   - Prompt: "Assess this opportunity against our company priorities: resilience-led service expansion."
   - Expect `POST /intel/agent/engage` → `200 OK`; no coroutine/Pydantic errors.

6. **Check Supabase agent_runs table**
   - Confirm row with `company_id`, `stage`, `status`, `input_hash/summary`, `context_summary`, `started_at`, `completed_at`, `output_summary`; expect `status = completed`.

7. **Commit if clean**
   - `git status --short`
   - `git add backend/services/agent_runs.py backend/intel/agent_service.py backend/intel/router.py backend/routers/intel.py`
   - `git commit -m "Persist agent run metadata to Supabase"`
   - `git push origin main`
   - `git log --oneline -8`

### Definition of Done

* Frontend build passes.
* Backend starts cleanly.
* Agent Chain returns 200 OK.
* No async coroutine errors occur.
* No Pydantic supporting signal warnings return.
* Supabase `agent_runs` receives a new completed row.
* Git status is clean.
* Latest commit is pushed to GitHub.

### Recommended Next Phase (Do Not Start Auth Yet)

Add a small admin/debug endpoint to inspect recent agent_runs before any frontend history UI:

```text
GET /admin/agent-runs/recent
```

Purpose: verify persisted agent history, inspect company-linked activity, confirm run status/timestamps, and debug before UI work.
