from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional

from backend.db import SessionLocal
from backend.services.company_document_service import process_document
from backend.services.company_profile_service import (
    get_company_profile,
    get_latest_company_profile,
    save_or_update_company_profile,
    serialise_company_profile,
)

router = APIRouter(prefix="/company", tags=["company"])


class CompanyProfilePayload(BaseModel):
    id: Optional[str] = None
    company_name: str = ""
    sector: str = ""
    sub_sector: str = ""
    regions: List[str] = Field(default_factory=list)
    products_services: List[str] = Field(default_factory=list)
    customer_segments: List[str] = Field(default_factory=list)
    supplier_dependencies: List[str] = Field(default_factory=list)
    logistics_dependencies: List[str] = Field(default_factory=list)
    energy_dependency: float = 0.0
    import_export_exposure: float = 0.0
    consumer_sensitivity: float = 0.0
    regulatory_exposure: float = 0.0
    financial_sensitivity: float = 0.0
    margin_pressure_points: List[str] = Field(default_factory=list)
    strategic_priorities: List[str] = Field(default_factory=list)
    growth_objectives: List[str] = Field(default_factory=list)
    risk_tolerance: str = ""
    recommendation_style: str = ""
    competitor_context: List[str] = Field(default_factory=list)
    known_risk_areas: List[str] = Field(default_factory=list)
    known_opportunity_areas: List[str] = Field(default_factory=list)
    notes: str = ""


@router.get("/profile/latest")
async def get_latest_profile():
    db = SessionLocal()
    try:
        profile = get_latest_company_profile(db)
        return {"profile": serialise_company_profile(profile)}
    finally:
        db.close()


@router.get("/profile/{company_id}")
async def get_profile(company_id: str):
    db = SessionLocal()
    try:
        profile = get_company_profile(db, company_id)
        if not profile:
            raise HTTPException(status_code=404, detail="Company profile not found")
        return {"profile": serialise_company_profile(profile)}
    finally:
        db.close()


@router.post("/profile")
async def save_profile(payload: CompanyProfilePayload):
    db = SessionLocal()
    try:
        saved = save_or_update_company_profile(db, payload.model_dump())
        return {"ok": True, "profile": saved}
    finally:
        db.close()


@router.post("/upload")
async def upload_document(payload: Dict[str, Any]):
    result = process_document(
        text=payload.get("text", ""),
        name=payload.get("name", "doc"),
        doc_type=payload.get("type", "text")
    )
    return result