from __future__ import annotations
    timing_guidance: list[str] = Field(default_factory=list)
    confidence: int = 0


class PlanOutput(BaseModel):
    objective: str
    immediate: list[str] = Field(default_factory=list)
    short_term: list[str] = Field(default_factory=list)
    medium_term: list[str] = Field(default_factory=list)
    owners: list[str] = Field(default_factory=list)
    checkpoints: list[str] = Field(default_factory=list)
    confidence: int = 0


class CompanyProfileOutput(BaseModel):
    sector: str
    business_type: str
    strategic_priorities: list[str] = Field(default_factory=list)
    geographic_dependencies: list[str] = Field(default_factory=list)
    margin_sensitivities: list[str] = Field(default_factory=list)
    consumer_demand_exposure: list[str] = Field(default_factory=list)
    supply_chain_dependencies: list[str] = Field(default_factory=list)
    profile_summary: str
    confidence: int = 0


class DetectedEntity(BaseModel):
    type: str
    original: str
    placeholder: str


class PrivacyPreviewResponse(BaseModel):
    raw_input: str
    anonymized_input: str
    detected_entities: list[DetectedEntity] = Field(default_factory=list)
    privacy_risk_level: Literal["low", "medium", "high"] = "low"


class AgentChainState(BaseModel):
    session_id: str
    raw_input: str
    anonymized_input: str | None = None
    analysis: AnalysisOutput | None = None
    advice: AdviceOutput | None = None
    plan: PlanOutput | None = None
    company_profile_draft: CompanyProfileOutput | None = None
    completed_steps: list[str] = Field(default_factory=list)
    prior_outputs_used: list[str] = Field(default_factory=list)
    confidence_scores: dict[str, int] = Field(default_factory=dict)
    privacy_risk_level: str | None = None
    selected_agent_map: dict[str, str] = Field(default_factory=dict)
    selected_model_map: dict[str, str] = Field(default_factory=dict)
    privacy_preview: PrivacyPreviewResponse | None = None
    auto_ran_steps: list[str] = Field(default_factory=list)


class EngageRequest(BaseModel):
    session_id: str
    action: ActionType
    input: str
    use_previous_chain: bool = True
    existing_chain_state: AgentChainState | None = None


class EngageResponse(BaseModel):
    selected_agent: str
    selected_model: str
    action: ActionType
    auto_ran_steps: list[str] = Field(default_factory=list)
    prior_outputs_used: list[str] = Field(default_factory=list)
    output: dict
    updated_chain_state: AgentChainState