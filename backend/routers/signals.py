from __future__ import annotations

from fastapi import APIRouter

from models.signals import IngestResponse
from services.signal_ingestion import SignalIngestionService
from services.signal_transformer import SignalToEventTransformer
from services.intelligence_orchestrator import IntelligenceOrchestrator
from storage.state import STATE

router = APIRouter(prefix="/signals", tags=["signals"])

ingestion_service = SignalIngestionService()
transformer = SignalToEventTransformer()
orchestrator = IntelligenceOrchestrator()


@router.post("/ingest", response_model=IngestResponse)
def ingest_signals():
    signals = ingestion_service.ingest()
    for signal in signals:
        STATE.signals[signal.id] = signal

    created_events = transformer.transform_many(signals)
    orchestrator.refresh()

    return IngestResponse(
        ingested_count=len(signals),
        transformed_count=len(created_events),
        latest_signal_ids=[s.id for s in signals],
    )


@router.get("")
def get_signals():
    return {
        "signals": sorted(
            STATE.signals.values(),
            key=lambda s: s.timestamp,
            reverse=True,
        )
    }


@router.get("/latest")
def get_latest_signals():
    latest = sorted(STATE.signals.values(), key=lambda s: s.timestamp, reverse=True)[:10]
    return {"signals": latest}


@router.post("/transform-to-events")
def transform_signals_to_events():
    created_events = transformer.transform_many(list(STATE.signals.values()))
    dashboard = orchestrator.refresh()
    return {
        "transformed_count": len(created_events),
        "event_ids": [e.id for e in created_events],
        "dashboard": dashboard,
    }