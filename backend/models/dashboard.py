from __future__ import annotations

from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel


class RiskSnapshot(BaseModel):
    overall_risk_score: float
    company_adjusted_score: float
    posture: str
    category_scores: Dict[str, float]
    top_clusters: List[str]
    urgency: str
    confidence: float
    horizon: str
    contributing_agents: List[dict]
    momentum: str
    timestamp: datetime


class OpportunityHighlight(BaseModel):
    title: str
    executive_summary: str
    category: str
    confidence: int
    time_relevance: str
    business_implication: str
    suggested_action: str
    detected_at: Optional[datetime] = None


class DashboardResponse(BaseModel):
    overall_risk_score: float
    company_adjusted_score: float
    posture: str

    opportunity_score: float
    opportunity_posture: str
    opportunity_category_scores: Dict[str, float]
    top_opportunity_clusters: List[str]
    opportunity_highlights: List[OpportunityHighlight]

    summary: str
    category_scores: Dict[str, float]
    top_clusters: List[str]

    urgency: str
    confidence: float
    horizon: str
    contributing_agents: List[dict]

    momentum: str
    updated_at: datetime