from pydantic import BaseModel, Field
from typing import Literal


class DetectedEntity(BaseModel):
    type: str
    original: str
    placeholder: str


class PrivacyPreviewRequest(BaseModel):
    input: str


class PrivacyPreviewResponse(BaseModel):
    raw_input: str
    anonymized_input: str
    detected_entities: list[DetectedEntity] = Field(default_factory=list)
    privacy_risk_level: Literal["low", "medium", "high"] = "low"