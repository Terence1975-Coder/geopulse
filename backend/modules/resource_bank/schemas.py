from pydantic import BaseModel, Field
from typing import Literal


class ResourceItem(BaseModel):
    id: str
    title: str
    url: str | None = None
    source_type: Literal["url", "pdf", "note", "api", "article"] = "url"
    trust_score: int = 50
    bias_rating: Literal["low", "medium", "high"] = "medium"
    region: str | None = None
    sector: str | None = None
    tags: list[str] = Field(default_factory=list)
    enabled: bool = True


class ResourceBankUpsertRequest(BaseModel):
    items: list[ResourceItem]


class ResourceBankListResponse(BaseModel):
    items: list[ResourceItem] = Field(default_factory=list)
    total: int = 0