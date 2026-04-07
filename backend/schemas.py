from typing import List, Optional, Dict, Any
from pydantic import BaseModel


class ResourceBankItemCreate(BaseModel):
    title: str
    source_type: str = "document"
    content: str
    tags: List[str] = []
    trust_score: float = 75.0


class ResourceBankItemResponse(BaseModel):
    id: int
    title: str
    source_type: str
    trust_score: float
    tags: List[str]

    class Config:
        from_attributes = True


class PrivacyReplacement(BaseModel):
    type: str
    original: str
    placeholder: str


class PrivacyPreviewResponse(BaseModel):
    raw_input: str
    anonymized_input: str
    risk_level: str
    replacements: List[PrivacyReplacement]


class AgentEngageRequest(BaseModel):
    input: str
    stage: str
    company_name: Optional[str] = None
    company_id: Optional[str] = None
    previous_chain_state: Optional[Dict[str, Any]] = None


class AgentEvidenceItem(BaseModel):
    title: str
    source_type: str
    trust_score: float
    excerpt: str


class AgentExplanation(BaseModel):
    model: str
    route: str
    reasoning_summary: str
    evidence_used: List[str]
    memory_used: List[str]


class AgentOutputs(BaseModel):
    analyse: Optional[str] = None
    advise: Optional[str] = None
    plan: Optional[str] = None
    profile: Optional[str] = None


class AgentChainState(BaseModel):
    completed_steps: List[str] = []


class AgentEngageResponse(BaseModel):
    input: str
    anonymized_input: str
    privacy: Dict[str, Any]
    chain_state: AgentChainState
    outputs: AgentOutputs
    auto_ran: List[str] = []
    evidence: List[AgentEvidenceItem] = []
    explanation: AgentExplanation


class CompanyMemoryUpsertRequest(BaseModel):
    company_name: str
    company_id: Optional[str] = None
    market_focus: Optional[str] = None
    strategic_priorities: List[str] = []
    recommendation_posture: Optional[str] = None
    profile_json: Optional[Dict[str, Any]] = None