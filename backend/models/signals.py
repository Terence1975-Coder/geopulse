from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class Signal(BaseModel):
    id: str
    source: str
    title: str
    summary: str
    region: str
    signal_type: str
    confidence: int = Field(ge=0, le=100)
    timestamp: datetime
    tags: List[str] = []
    potential_severity: int = Field(ge=0, le=100)
    raw_url: Optional[str] = None
    urgency: str = "medium"          # low | medium | high | critical
    horizon: str = "30-day"          # immediate | 30-day | strategic


class IngestResponse(BaseModel):
    ingested_count: int
    transformed_count: int
    latest_signal_ids: List[str]