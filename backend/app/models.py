from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


class EventCreate(BaseModel):
    headline: str
    body: str
    region: Optional[str] = "Global"
    source: Optional[str] = "Manual"
    credibility: Optional[float] = 0.8


class Event(BaseModel):
    id: str
    headline: str
    body: str
    region: str
    source: str
    credibility: float
    created_at: str


class CategoryScore(BaseModel):
    name: str
    score: int
    delta: int = 0
    explanation: str


class EventAnalysis(BaseModel):
    event_id: str
    summary: str
    severity: int
    momentum: int
    categories: List[CategoryScore]
    recommended_actions: List[str]
    related_tags: List[str]


class CompanyProfile(BaseModel):
    company_name: str = "My Company"
    sector: str = "General Business"
    sub_sector: str = "SME"
    supply_chain_exposure_regions: List[str] = Field(default_factory=list)
    energy_dependency_level: int = 50
    import_export_exposure: int = 50
    consumer_sensitivity_level: int = 50
    financial_leverage_sensitivity: int = 50
    strategic_priorities: List[str] = Field(default_factory=lambda: ["resilience"])


class DashboardResponse(BaseModel):
    view: str
    headline: str
    overall_risk_score: int
    risk_posture: str
    categories: List[CategoryScore]
    top_recommendations: List[str]
    event_count: int
    signal_count: int
    narrative: str


class AgentReference(BaseModel):
    name: str
    reason: str


class CopilotDiscussRequest(BaseModel):
    question: str
    event_id: Optional[str] = None
    signal_id: Optional[str] = None
    scenario_input: Optional[Dict[str, Any]] = None
    company_profile: Optional[CompanyProfile] = None
    view: str = "company"


class CopilotDiscussResponse(BaseModel):
    title: str
    answer: str
    structured_insights: List[str]
    recommended_actions: List[str]
    contributing_agents: List[AgentReference]
    recent_risk_concern: str


class ScenarioSimulationRequest(BaseModel):
    title: str
    scenario_type: str
    severity: int = 50
    region: Optional[str] = "Global"
    category_bias: Optional[str] = None
    narrative_input: Optional[str] = None
    company_profile: Optional[CompanyProfile] = None
    view: str = "company"


class ScenarioSimulationResponse(BaseModel):
    scenario_title: str
    projected_dashboard_risk: int
    projected_posture: str
    category_deltas: List[CategoryScore]
    narrative_explanation: str
    recommended_executive_actions: List[str]