from fastapi import APIRouter

from backend.services.signal_ingestion import get_latest_signals
from backend.intel.scoring_service import build_dashboard_summary

router = APIRouter(prefix="/intel/dashboard", tags=["dashboard"])


@router.get("/summary")
def get_dashboard_summary():
    signals, refreshed = get_latest_signals(limit=50, auto_refresh=True)
    summary = build_dashboard_summary(signals)

    return {
        "summary": summary,
        "signals": signals,
        "refreshed": refreshed,
    }