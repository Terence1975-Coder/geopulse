from __future__ import annotations

import os
from typing import Any, Dict, List, Optional

import httpx
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from backend.db import SessionLocal
from backend.services.company_document_service import process_document
from backend.services.company_profile_service import (
    get_company_profile,
    get_latest_company_profile,
    save_or_update_company_profile,
    serialise_company_profile,
)
from backend.services.supabase_workspace import (
    CalibrationPayload,
    fetch_workspace_settings,
    upsert_workspace_settings,
)

router = APIRouter(prefix="/company", tags=["company"])

COMPANIES_HOUSE_BASE_URL = "https://api.company-information.service.gov.uk"


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


def _get_companies_house_api_key() -> str:
    api_key = os.getenv("COMPANIES_HOUSE_API_KEY", "").strip()

    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="COMPANIES_HOUSE_API_KEY is not configured.",
        )

    return api_key


async def _companies_house_get(
    path: str,
    params: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    api_key = _get_companies_house_api_key()
    url = f"{COMPANIES_HOUSE_BASE_URL}{path}"

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.get(
                url,
                params=params or {},
                auth=(api_key, ""),
            )
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Companies House request failed: {str(exc)}",
        ) from exc

    if response.status_code == 404:
        raise HTTPException(status_code=404, detail="Company not found.")

    if response.status_code >= 400:
        raise HTTPException(
            status_code=response.status_code,
            detail=response.text or "Companies House API request failed.",
        )

    return response.json()


@router.get("/companies/search")
async def search_companies(
    q: str = Query(..., min_length=2),
) -> Dict[str, List[Dict[str, Any]]]:
    data = await _companies_house_get(
        "/search/companies",
        params={
            "q": q,
            "items_per_page": 10,
        },
    )

    results: List[Dict[str, Any]] = []

    for item in data.get("items", []):
        results.append(
            {
                "title": item.get("title", ""),
                "company_number": item.get("company_number", ""),
                "description": item.get("description", ""),
                "company_status": item.get("company_status", ""),
                "address_snippet": item.get("address_snippet", ""),
                "company_type": item.get("company_type", ""),
                "date_of_creation": item.get("date_of_creation", ""),
            }
        )

    return {"results": results}


@router.get("/companies/{company_number}")
async def get_company_from_companies_house(company_number: str) -> Dict[str, Any]:
    data = await _companies_house_get(f"/company/{company_number}")

    registered_office_address = data.get("registered_office_address", {}) or {}

    return {
        "company_name": data.get("company_name"),
        "company_number": data.get("company_number"),
        "company_status": data.get("company_status"),
        "company_type": data.get("type"),
        "date_of_creation": data.get("date_of_creation"),
        "incorporation_date": data.get("date_of_creation"),
        "sic_codes": data.get("sic_codes", []),
        "registered_office_address": registered_office_address,
        "jurisdiction": data.get("jurisdiction"),
        "accounts": data.get("accounts", {}),
        "confirmation_statement": data.get("confirmation_statement", {}),
        "registered_address_text": ", ".join(
            str(part)
            for part in [
                registered_office_address.get("address_line_1"),
                registered_office_address.get("address_line_2"),
                registered_office_address.get("locality"),
                registered_office_address.get("region"),
                registered_office_address.get("postal_code"),
                registered_office_address.get("country"),
            ]
            if part
        ),
    }


@router.get("/profile/latest")
async def get_latest_profile(company_id: Optional[str] = None):
    record = await fetch_workspace_settings(company_id)
    if record:
        calibration = (record.get("feature_flags") or {}).get("calibration")
        if calibration:
            return {"profile": calibration}

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


@router.post("/profile/save")
async def save_profile_supabase(payload: CalibrationPayload):
    record = await upsert_workspace_settings(payload.company_id, payload.calibration)
    calibration = (record.get("feature_flags") or {}).get("calibration", {})
    return {"ok": True, "workspace_settings": record, "profile": calibration}


@router.post("/upload")
async def upload_document(payload: Dict[str, Any]):
    result = process_document(
        text=payload.get("text", ""),
        name=payload.get("name", "doc"),
        doc_type=payload.get("type", "text"),
    )
    return result
