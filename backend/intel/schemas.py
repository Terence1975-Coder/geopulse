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
    region: Optional[str] = None
    kind: Optional[str] = None
    severity: Optional[str] = None
    lifecycle: Optional[str] = None
    confidence: Optional[float] = None
    confidence_score: Optional[float] = None
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

    missing_profile_data: List[str] = Field(default_factory=list)
    profile_references: List[str] = Field(default_factory=list)
    based_on_stages: List[str] = Field(default_factory=list)
    based_on_signals: List[str] = Field(default_factory=list)
    time_relevance: Optional[str] = None

    supporting_signal_details: List[SupportingSignalDetail] = Field(default_factory=list)

    response: Optional[str] = None
    message: Optional[str] = None
    content: Optional[str] = None
    analysis: Optional[str] = None
    advice: Optional[str] = None
    plan: Optional[str] = None


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

    market_focus: List[str] = Field(default_factory=list)
    recommendation_posture: Optional[str] = None
    profile_json: Dict[str, Any] = Field(default_factory=dict)


class AgentEngageRequest(BaseModel):
    model_config = ConfigDict(extra="allow")

    input: str
    stage: AgentStage = "full_chain"

    company_name: Optional[str] = None
    company_id: Optional[str] = None

    company_profile: Optional[CompanyProfile] = None
    company_context: Optional[Dict[str, Any]] = None

    chain_outputs: Optional[ChainOutputs] = None
    previous_chain_state: Optional[Dict[str, Any]] = None

    conversation_history: List[Dict[str, str]] = Field(default_factory=list)


class MultiAnalystView(BaseModel):
    model_config = ConfigDict(extra="allow")

    id: str
    lens: str
    headline: str
    key_insight: str
    drivers: List[str] = Field(default_factory=list)
    second_order_effects: List[str] = Field(default_factory=list)
    opportunity_signal: str
    risk_signal: str
    confidence: float


class AnalysisSelection(BaseModel):
    model_config = ConfigDict(extra="allow")

    recommended_analyst_id: str
    reason: str
    tradeoffs: List[str] = Field(default_factory=list)


class StrategicPath(BaseModel):
    model_config = ConfigDict(extra="allow")

    id: str
    name: str
    approach: str
    where_it_wins: str
    risks: List[str] = Field(default_factory=list)
    requirements: List[str] = Field(default_factory=list)
    time_horizon: str
    confidence: float

    commercial_impact: Optional[str] = None
    recommended_actions: List[str] = Field(default_factory=list)
    selected_from_analyst: Optional[str] = None


class StrategyDecision(BaseModel):
    model_config = ConfigDict(extra="allow")

    selected_path_id: str
    reason: str
    why_not_others: List[str] = Field(default_factory=list)
    scoring_summary: Dict[str, Any] = Field(default_factory=dict)


class ExecutionPlanPhase(BaseModel):
    model_config = ConfigDict(extra="allow")

    phase: str
    actions: List[str] = Field(default_factory=list)
    owner: str


class ExecutionPlan(BaseModel):
    model_config = ConfigDict(extra="allow")

    objective: str
    selected_path_id: Optional[str] = None
    phases: List[ExecutionPlanPhase] = Field(default_factory=list)


class InteractionAction(BaseModel):
    model_config = ConfigDict(extra="allow")

    id: str
    label: str


class InteractionHooks(BaseModel):
    model_config = ConfigDict(extra="allow")

    primary_recommendation: Optional[str] = None
    alternatives_available: bool = True
    feedback_required: bool = True
    actions: List[InteractionAction] = Field(default_factory=list)


class MultiPathOutput(BaseModel):
    model_config = ConfigDict(extra="allow")

    analyst_views: List[MultiAnalystView] = Field(default_factory=list)
    analysis_selection: AnalysisSelection
    strategic_paths: List[StrategicPath] = Field(default_factory=list)
    strategy_decision: StrategyDecision
    execution_plan: ExecutionPlan
    interaction_hooks: InteractionHooks


class AgentEngageResponse(BaseModel):
    model_config = ConfigDict(extra="allow")

    output: Optional[Any] = None
    outputs: Optional[Dict[str, Any]] = None
    chain_outputs: Optional[Any] = None

    analyst_views: Optional[List[MultiAnalystView]] = None
    analysis_selection: Optional[AnalysisSelection] = None
    strategic_paths: Optional[List[StrategicPath]] = None
    strategy_decision: Optional[StrategyDecision] = None
    execution_plan: Optional[ExecutionPlan] = None
    interaction_hooks: Optional[InteractionHooks] = None

    multi_path_output: Optional[MultiPathOutput] = None
    context_summary: Optional[Dict[str, Any]] = None
    meta: Optional[Dict[str, Any]] = None


class SignalRecord(BaseModel):
    model_config = ConfigDict(extra="allow")

    id: Optional[str] = None
    headline: str
    summary: str = ""
    region: str = "Global"
    cluster_tag: str = "General"
    kind: str = "risk"
    severity: str = "medium"
    source: str = "Unknown"
    source_type: str = "manual"
    timestamp: Optional[str] = None
    supporting_facts: Dict[str, Any] = Field(default_factory=dict)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class SignalStoreRequest(BaseModel):
    items: List[SignalRecord] = Field(default_factory=list)


class SignalStoreResponse(BaseModel):
    ok: bool = True
    stored: int = 0


class CompanyProfileSaveRequest(BaseModel):
    company_name: str
    company_id: Optional[str] = None
    profile: Dict[str, Any] = Field(default_factory=dict)


class CompanyProfileSaveResponse(BaseModel):
    ok: bool = True
    company_name: Optional[str] = None
    company_id: Optional[str] = None
    profile: Dict[str, Any] = Field(default_factory=dict)
    updated_at: Optional[str] = None


class CompanyProfileFetchResponse(BaseModel):
    company_name: Optional[str] = None
    company_id: Optional[str] = None
    market_focus: List[str] = Field(default_factory=list)
    strategic_priorities: List[str] = Field(default_factory=list)
    recommendation_posture: Optional[str] = None
    profile: Dict[str, Any] = Field(default_factory=dict)
    updated_at: Optional[str] = None


class AgentRunRecord(BaseModel):
    model_config = ConfigDict(extra="allow")

    id: int
    company_name: Optional[str] = None
    input_text: str
    anonymized_input: Optional[str] = None
    requested_stage: str
    completed_steps: List[str] = Field(default_factory=list)
    outputs: Dict[str, Any] = Field(default_factory=dict)
    evidence: Dict[str, Any] = Field(default_factory=dict)
    explanation: Dict[str, Any] = Field(default_factory=dict)
    privacy: Dict[str, Any] = Field(default_factory=dict)
    created_at: Optional[str] = None