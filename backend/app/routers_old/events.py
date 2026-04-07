from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import uuid4

router = APIRouter(prefix="/events", tags=["events"])

EVENT_STORE = {}


class EventCreate(BaseModel):
    title: str
    region: str
    topics: List[str] = Field(default_factory=list)
    summary: Optional[str] = None
    severity: int = 50
    source: Optional[str] = None


@router.post("")
async def create_event(payload: EventCreate):
    event_id = str(uuid4())

    event = {
        "id": event_id,
        "title": payload.title,
        "region": payload.region,
        "topics": payload.topics,
        "summary": payload.summary,
        "severity": payload.severity,
        "source": payload.source,
    }

    EVENT_STORE[event_id] = event
    return {"message": "Event created", "event": event}


@router.get("")
async def list_events():
    return {"count": len(EVENT_STORE), "events": list(EVENT_STORE.values())}


@router.get("/{event_id}")
async def get_event(event_id: str):
    return EVENT_STORE.get(event_id) or {"error": "Event not found"}