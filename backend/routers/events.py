from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, HTTPException

from models.events import EventCreateRequest, EventItem
from services.intelligence_orchestrator import IntelligenceOrchestrator
from storage.state import STATE

router = APIRouter(tags=["events"])
orchestrator = IntelligenceOrchestrator()


@router.get("/events")
def list_events():
    return STATE.events


@router.post("/events")
def create_event(payload: EventCreateRequest):
    event = EventItem(
        id=str(uuid4()),
        headline=payload.headline,
        body=payload.body,
        category=payload.category,
        severity=payload.severity,
        region=payload.region,
        tags=payload.tags,
        timestamp=datetime.now(timezone.utc),
        urgency=payload.urgency,
        confidence=payload.confidence,
        horizon=payload.horizon,
        source="manual",
    )
    STATE.events[event.id] = event
    dashboard = orchestrator.refresh()
    return {"event": event, "dashboard": dashboard}


@router.get("/events/clusters")
def get_event_clusters():
    return {
        "clusters": sorted(
            STATE.clusters.values(),
            key=lambda c: c.last_updated,
            reverse=True,
        )
    }


@router.get("/events/clusters/{cluster_id}")
def get_event_cluster(cluster_id: str):
    cluster = STATE.clusters.get(cluster_id)
    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found")

    events = [STATE.events[event_id] for event_id in cluster.related_event_ids if event_id in STATE.events]
    return {"cluster": cluster, "events": events}