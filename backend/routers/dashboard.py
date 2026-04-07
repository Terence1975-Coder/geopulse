from __future__ import annotations

from fastapi import APIRouter

from services.intelligence_orchestrator import IntelligenceOrchestrator
from services.risk_memory import RiskMemoryEngine
from storage.state import STATE

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

orchestrator = IntelligenceOrchestrator()
risk_memory = RiskMemoryEngine()


@router.get("/company-intelligence")
def get_company_intelligence():
    return orchestrator.refresh()


@router.get("/history")
def get_dashboard_history():
    if not STATE.risk_history:
        orchestrator.refresh()
    return {"history": STATE.risk_history[-30:]}


@router.get("/trends")
def get_dashboard_trends():
    if not STATE.risk_history:
        orchestrator.refresh()
    return risk_memory.get_trends()