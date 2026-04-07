# GeoPulse AI — V6 Phase 10.1 Bundle

## What this adds
- Company identity enrichment endpoint
- Adaptive exposure modelling
- Behavioural intelligence memory
- Profile confidence scoring
- Profile-driven scenario response layer
- Executive-grade frontend panels

## Suggested folder structure
```text
backend/
  main.py
  models.py
  storage.py
  data/
  services/
    company_identity_enrichment.py
    adaptive_exposure_engine.py
    intelligence_memory_engine.py
    profile_confidence_engine.py
    scenario_engine.py

frontend/
  app/
    page.tsx
  components/
    AdaptiveProfilePanel.tsx
    CompanyIntelligenceOverviewCard.tsx
    CopilotConsole.tsx
    ProfileConfidenceCard.tsx
  lib/
    api.ts
  types/
    index.ts
```

## Run backend
```bash
cd backend
pip install fastapi uvicorn pydantic
uvicorn main:app --reload
```

## Run frontend
```bash
cd frontend
npm install
npm run dev
```

## Frontend env
Create `.env.local`
```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

## Integration notes
- This bundle is designed to slot into the existing Phase 10 project with minimal friction.
- The company enrichment service currently uses a structured mock adapter so the UI and downstream logic work immediately.
- To wire in real Companies House later, replace the mock lookup inside `CompanyIdentityEnrichmentService.enrich()`.
- Persistent memory is lightweight JSON storage so behaviour survives restarts without adding a database yet.
