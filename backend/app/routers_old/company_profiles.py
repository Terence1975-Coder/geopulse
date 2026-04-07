from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional

from app.services.companies_house_service import CompaniesHouseService
from app.services.sic_mapper import sic_codes_to_labels

router = APIRouter(prefix="/company-profiles", tags=["company-profiles"])
service = CompaniesHouseService()

# Temporary in-memory store for V5
COMPANY_PROFILE_STORE = {}


class CompanyProfileCreate(BaseModel):
    company_name: str
    company_number: str
    description: Optional[str] = None
    sector_override: Optional[str] = None
    countries_of_operation: List[str] = Field(default_factory=list)
    supply_chain_regions: List[str] = Field(default_factory=list)
    energy_dependency: int = 50
    import_dependency: int = 50
    consumer_sensitivity: int = 50
    market_sensitivity: int = 50


@router.post("/create-from-companies-house/{company_number}")
async def create_company_profile_from_companies_house(
    company_number: str,
    payload: CompanyProfileCreate,
):
    try:
        profile = await service.get_company_profile(company_number)

        sic_codes = profile.get("sic_codes", []) or []
        sic_labels = sic_codes_to_labels(sic_codes)

        derived_description = None
        if sic_labels:
            derived_description = f"Officially classified as: {', '.join(sic_labels[:3])}"

        merged = {
            "company_name": profile.get("company_name") or payload.company_name,
            "company_number": profile.get("company_number") or company_number,
            "company_status": profile.get("company_status"),
            "company_type": profile.get("type"),
            "date_of_creation": profile.get("date_of_creation"),
            "sic_codes": sic_codes,
            "sic_labels": sic_labels,
            "derived_business_description": derived_description,
            "user_description": payload.description,
            "sector_override": payload.sector_override,
            "countries_of_operation": payload.countries_of_operation,
            "supply_chain_regions": payload.supply_chain_regions,
            "energy_dependency": payload.energy_dependency,
            "import_dependency": payload.import_dependency,
            "consumer_sensitivity": payload.consumer_sensitivity,
            "market_sensitivity": payload.market_sensitivity,
        }

        COMPANY_PROFILE_STORE[company_number] = merged

        return {
            "message": "Company profile created",
            "profile": merged,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Profile creation failed: {str(e)}")


@router.get("/{company_number}")
async def get_company_profile(company_number: str):
    profile = COMPANY_PROFILE_STORE.get(company_number)
    if not profile:
        raise HTTPException(status_code=404, detail="Company profile not found")
    return profile


@router.get("/")
async def list_company_profiles():
    return {
        "count": len(COMPANY_PROFILE_STORE),
        "profiles": list(COMPANY_PROFILE_STORE.values()),
    }