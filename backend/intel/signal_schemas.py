from __future__ import annotations

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel


SignalSeverity = Literal["low", "medium", "high"]
SignalKind = Literal["risk", "opportunity"]


class SignalResponse(BaseModel):
    id: str
    headline: str
    summary: str
    source: str
    link: str
    timestamp: datetime
    region: str
    cluster_tag: str
    severity: SignalSeverity
    kind: SignalKind
    freshness_label: Optional[str] = None
    status: Optional[str] = None


class SignalListResponse(BaseModel):
    signals: List[SignalResponse]
    count: int
    refreshed: bool = False