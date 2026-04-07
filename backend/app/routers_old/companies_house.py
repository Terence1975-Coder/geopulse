from fastapi import APIRouter, HTTPException, Query
from app.services.companies_house_service import CompaniesHouseService
from app.services.sic_mapper import sic_codes_to_labels

router = APIRouter(prefix="/companies-house", tags=["companies-house"])
service = CompaniesHouseService()


@router.get("/search")
async def search_companies(q: str = Query(..., min_length=2)):
    try:
        data = await service.search_companies(q)
        items = data.get("items", [])
        results = []

        for item in items:
            address_parts = []
            address = item.get("address", {}) or {}

            for key in [
                "address_line_1",
                "address_line_2",
                "locality",
                "region",
                "postal_code",
                "country",
            ]:
                value = address.get(key)
                if value:
                    address_parts.append(value)

            sic_codes = item.get("sic_codes", []) or []

            results.append({
                "company_name": item.get("title") or item.get("company_name"),
                "company_number": item.get("company_number"),
                "company_status": item.get("company_status"),
                "company_type": item.get("company_type"),
                "date_of_creation": item.get("date_of_creation"),
                "address_snippet": ", ".join(address_parts) if address_parts else None,
                "sic_codes": sic_codes,
                "sic_labels": sic_codes_to_labels(sic_codes),
            })

        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Companies House search failed: {str(e)}")


@router.get("/company/{company_number}")
async def get_company(company_number: str):
    try:
        profile = await service.get_company_profile(company_number)

        try:
            registered_address = await service.get_registered_office_address(company_number)
        except Exception:
            registered_address = None

        sic_codes = profile.get("sic_codes", []) or []
        sic_labels = sic_codes_to_labels(sic_codes)

        derived_description = None
        if sic_labels:
            derived_description = f"Officially classified as: {', '.join(sic_labels[:3])}"

        return {
            "company_name": profile.get("company_name"),
            "company_number": profile.get("company_number"),
            "company_status": profile.get("company_status"),
            "company_type": profile.get("type"),
            "date_of_creation": profile.get("date_of_creation"),
            "registered_office_address": registered_address,
            "sic_codes": sic_codes,
            "sic_labels": sic_labels,
            "derived_business_description": derived_description,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Companies House profile lookup failed: {str(e)}")