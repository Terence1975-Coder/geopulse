from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Query

from backend.intel.scoring_service import build_dashboard_summary
from backend.services.signal_ingestion import (
    get_latest_signals,
    refresh_default_signals,
)

router = APIRouter(prefix="/intel", tags=["signals"])


@router.get("/signals")
def get_signals(
    limit: int = Query(default=50, ge=1, le=200),
    kind: Optional[str] = Query(default=None),
):
    signals, refreshed = get_latest_signals(limit=limit, auto_refresh=True)

    if kind:
        signals = [signal for signal in signals if signal.get("kind") == kind]

    return {
        "items": signals,
        "count": len(signals),
        "refreshed": refreshed,
    }


@router.get("/dashboard/summary")
def get_dashboard_summary():
    signals, _ = get_latest_signals(limit=100, auto_refresh=True)
    return build_dashboard_summary(signals)


@router.post("/signals/refresh")
def refresh_signals():
    return refresh_default_signals()