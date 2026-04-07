from __future__ import annotations

from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class AgentContribution(BaseModel):
    agent: str
    reason: str
    perspective_tags: List[str] = []
    insight_points: List[str] = []
    executive_implications: List[str] = []
    recommended_actions: List[str] = []


class EventItem(BaseModel):
    id: str
    headline: str
    body: str
    category: str
    severity: int = Field(ge=0, le=100)
    region: str
    tags: List[str] = []
    timestamp: datetime
    source: str = "manual"
    source_signal_id: Optional[str] = None

    urgency: str = "medium"
    confidence: int = Field(default=65, ge=0, le=100)
    horizon: str = "30-day"

    related_event_ids: List[str] = []
    cluster_id: Optional[str] = None

    agent_contributions: List[AgentContribution] = []
    executive_summary: str = ""
    recommended_actions: List[str] = []


class EventCluster(BaseModel):
    cluster_id: str
    label: str
    summary: str
    related_event_ids: List[str] = []
    dominant_risk_category: str
    trend_status: str
    confidence: int = Field(ge=0, le=100)
    last_updated: datetime
    urgency: str = "medium"
    horizon: str = "30-day"


class EventCreateRequest(BaseModel):
    headline: str
    body: str
    category: str = "general"
    severity: int = 50
    region: str = "Global"
    tags: List[str] = []
    urgency: str = "medium"
    confidence: int = 65
    horizon: str = "30-day"


class EventListResponse(BaseModel):
    events: Dict[str, EventItem]