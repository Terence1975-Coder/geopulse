from __future__ import annotations

from typing import Any, Dict, List, Optional
from typing_extensions import Literal

from pydantic import BaseModel, Field, ConfigDict


TimeHorizon = Literal["short", "medium", "long"]

AgentStage = Literal[
    "analyse",
    "advise",
    "plan",
    "profile",
    "full_chain",
    "multi_path",
]


class SupportingSignalDetail(BaseModel):
    model_config = ConfigDict(extra="allow")

    id: Optional[str] = None
    headline: Optional[str] = None
    summary: Optional[str] = None
    source: Optional[str] = None
    source_type: Optional[str] = None
    region: Optional[str] = None
    cluster_tag: Optional[str] = None
    kind: Optional[str] = None
    severity: Optional[str] = None
    lifecycle: Optional[str] = None

    confidence: Optional[float] = None
    confidence_score: Optional[float] = None
    signal_strength: Optional[float] = None
    freshness_minutes: Optional[int] = None

    timestamp: Optional[str] = None
    detected_at: Optional[str] = None
    updated_at: Optional[str] = None
    relative_time: Optional[str] = None


class StructuredAgentOutput(BaseModel):
    model_config = ConfigDict(extra="allow")

    summary: Optional[str] = None
    headline: Optional[str] = None
    key_insight: Optional[str] = None

    drivers: List[str] = Field(default_factory=list)
    second_order_effects: List[str] = Field(default_factory=list)
    implications: List[str] = Field(default_factory=list)
    recommended_actions: List[str] = Field(default_factory=list)

    confidence: float = 0.0
    time_horizon: Optional[TimeHorizon] = None
    urgency: Optional[str] = None
    time_relevance: Optional[str] = None

    missing_profile_data: List[str] = Field(default_factory=list)
    profile_references: List[str] = Field(default_factory=list)
    based_on_stages: List[str] = Field(default_factory=list)
    based_on_signals: List[str] = Field(default_factory=list)

    supporting_signal_details: List[SupportingSignalDetail] = Field(default_factory=list)

    reasoning_notes: List[str] = Field(default_factory=list)
    explanation_notes: List[str] = Field(default_factory=list)

    decision_context: Optional[str] = None
    tradeoffs: List[str] = Field(default_factory=list)
    dependencies: List[str] = Field(default_factory=list)
    milestones: List[str] = Field(default_factory=list)
    success_metrics: List[str] = Field(default_factory=list)
    review_checkpoints: List[str] = Field(default_factory=list)


class ChainOutputs(BaseModel):
    model_config = ConfigDict(extra="allow")

    analyse: Optional[StructuredAgentOutput] = None
    advise: Optional[StructuredAgentOutput] = None
    plan: Optional[StructuredAgentOutput] = None
    profile: Optional[StructuredAgentOutput] = None


class CompanyProfile(BaseModel):
    model_config = ConfigDict(extra="allow")

    company_name: Optional[str] = None
    company_id: Optional[str] = None

    sector: Optional[str] = None
    markets: List[str] = Field(default_factory=list)
    strategic_priorities: List[str] = Field(default_factory=list)

    operating_model: Optional[str] = None
    cost_sensitivities: List[str] = Field(default_factory=list)
    growth_objectives: List[str] = Field(default_factory=list)

    risk_tolerance: Optional[str] = None
    recommendation_style: Optional[str] = None
    notes: Optional[str] = None


class AgentRunRecord(BaseModel):
    model_config = ConfigDict(extra="allow")

    id: Optional[str] = None
    stage: Optional[str] = None
    status: Optional[str] = None
    input: Optional[str] = None
    output: Optional[Any] = None


class CompanyProfileFetchResponse(BaseModel):
    model_config = ConfigDict(extra="allow")

    success: bool = True
    profile: Optional[Dict[str, Any]] = None
    company_id: Optional[str] = None
    company_name: Optional[str] = None


class CompanyProfileSaveResponse(BaseModel):
    model_config = ConfigDict(extra="allow")

    success: bool = True
    profile: Optional[Dict[str, Any]] = None
    company_id: Optional[str] = None
    company_name: Optional[str] = None


class CompanyProfileSaveRequest(BaseModel):
    model_config = ConfigDict(extra="allow")

    company_id: Optional[str] = None
    company_name: Optional[str] = None
    profile: Dict[str, Any] = Field(default_factory=dict)


class AgentEngageRequest(BaseModel):
    model_config = ConfigDict(extra="allow")

    input: str
    stage: AgentStage = "full_chain"

    company_name: Optional[str] = None
    company_id: Optional[str] = None

    company_profile: Optional[CompanyProfile] = None
    chain_outputs: Optional[ChainOutputs] = None

    conversation_history: List[Dict[str, str]] = Field(default_factory=list)


class AgentEngageResponse(BaseModel):
    model_config = ConfigDict(extra="allow")

    output: Optional[Any] = None
    outputs: Optional[Dict[str, Any]] = None
    chain_outputs: Optional[Any] = None

    multi_path_output: Optional[Any] = None
    context_summary: Optional[Dict[str, Any]] = None
    meta: Optional[Dict[str, Any]] = None