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
    """
    Flexible nested signal model to prevent serializer warnings when
    upstream services return signal detail dictionaries.
    """
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
    """
    Main structured output used by context_builder.py and agent_service.py.
    Kept permissive so older / newer payloads do not break execution.
    """
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

    supporting_signal_details: List[SupportingSignalDetail] = Field(
        default_factory=list
    )

    reasoning_notes: List[str] = Field(default_factory=list)
    explanation_notes: List[str] = Field(default_factory=list)

    # Useful compatibility fields for richer stage outputs
    decision_context: Optional[str] = None
    tradeoffs: List[str] = Field(default_factory=list)
    dependencies: List[str] = Field(default_factory=list)
    milestones: List[str] = Field(default_factory=list)
    success_metrics: List[str] = Field(default_factory=list)
    review_checkpoints: List[str] = Field(default_factory=list)

    # Legacy / compatibility fields
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
    """
    Matches what context_builder.py expects to read.
    """
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

    # Backward compatibility fields from earlier versions
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
    
class AgentRunRecord(BaseModel):
    """
    Backward-compatibility model for older router/service imports.
    Keep permissive so older code paths do not break.
    """
    model_config = ConfigDict(extra="allow")

    id: Optional[str] = None
    stage: Optional[str] = None
    status: Optional[str] = None

    input: Optional[str] = None
    output: Optional[Any] = None

    company_id: Optional[str] = None
    company_name: Optional[str] = None

    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    duration_ms: Optional[int] = None

    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    class CompanyProfileFetchResponse(BaseModel):
    """
    Backward-compatibility response model for older profile routes.
    """
    model_config = ConfigDict(extra="allow")

    success: bool = True
    profile: Optional[Dict[str, Any]] = None
    company_id: Optional[str] = None
    company_name: Optional[str] = None
    message: Optional[str] = None


class CompanyProfileSaveResponse(BaseModel):
    """
    Backward-compatibility response model for older profile save routes.
    """
    model_config = ConfigDict(extra="allow")

    success: bool = True
    profile: Optional[Dict[str, Any]] = None
    company_id: Optional[str] = None
    company_name: Optional[str] = None
    saved: bool = True
    message: Optional[str] = None

class AgentEngageResponse(BaseModel):
    model_config = ConfigDict(extra="allow")

    output: Optional[Any] = None
    outputs: Optional[Dict[str, Any]] = None
    chain_outputs: Optional[Any] = None

    analyst_views: Optional[List[Dict[str, Any]]] = None
    analysis_selection: Optional[Dict[str, Any]] = None
    strategic_paths: Optional[List[Dict[str, Any]]] = None
    strategy_decision: Optional[Dict[str, Any]] = None
    execution_plan: Optional[Dict[str, Any]] = None
    interaction_hooks: Optional[Dict[str, Any]] = None

    multi_path_output: Optional[MultiPathOutput] = None
    context_summary: Optional[Dict[str, Any]] = None
    meta: Optional[Dict[str, Any]] = None
    
class CompanyProfileSaveRequest(BaseModel):
    """
    Backward-compatibility request model for older profile save routes.
    """
    model_config = ConfigDict(extra="allow")

    company_id: Optional[str] = None
    company_name: Optional[str] = None
    profile: Dict[str, Any] = Field(default_factory=dict)
