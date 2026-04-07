from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, Optional

from sqlalchemy.orm import Session

from backend.models.company_profile import CompanyProfileModel


LIST_FIELDS = {
    "regions",
    "products_services",
    "customer_segments",
    "supplier_dependencies",
    "logistics_dependencies",
    "margin_pressure_points",
    "strategic_priorities",
    "growth_objectives",
    "competitor_context",
    "known_risk_areas",
    "known_opportunity_areas",
}

NUMERIC_FIELDS = {
    "energy_dependency",
    "import_export_exposure",
    "consumer_sensitivity",
    "regulatory_exposure",
    "financial_sensitivity",
}


def _normalise_payload(data: Dict[str, Any]) -> Dict[str, Any]:
    payload = dict(data)

    for field in LIST_FIELDS:
      value = payload.get(field)
      if value is None:
          payload[field] = []
      elif isinstance(value, list):
          payload[field] = value
      elif isinstance(value, str):
          payload[field] = [
              item.strip() for item in value.split(",") if item.strip()
          ]
      else:
          payload[field] = []

    for field in NUMERIC_FIELDS:
        value = payload.get(field)
        if value is None or value == "":
            payload[field] = 0.0
        else:
            try:
                payload[field] = float(value)
            except (TypeError, ValueError):
                payload[field] = 0.0

    payload["notes"] = str(payload.get("notes") or "")
    payload["company_name"] = str(payload.get("company_name") or "").strip()
    payload["sector"] = str(payload.get("sector") or "").strip()
    payload["sub_sector"] = str(payload.get("sub_sector") or "").strip()
    payload["risk_tolerance"] = str(payload.get("risk_tolerance") or "").strip()
    payload["recommendation_style"] = str(
        payload.get("recommendation_style") or ""
    ).strip()

    payload.setdefault("calibration_summary", {})
    return payload


def _serialise_profile(profile: CompanyProfileModel) -> Dict[str, Any]:
    return {
        "id": profile.id,
        "company_name": profile.company_name,
        "sector": profile.sector,
        "sub_sector": profile.sub_sector,
        "regions": profile.regions or [],
        "products_services": profile.products_services or [],
        "customer_segments": profile.customer_segments or [],
        "supplier_dependencies": profile.supplier_dependencies or [],
        "logistics_dependencies": profile.logistics_dependencies or [],
        "energy_dependency": float(profile.energy_dependency or 0.0),
        "import_export_exposure": float(profile.import_export_exposure or 0.0),
        "consumer_sensitivity": float(profile.consumer_sensitivity or 0.0),
        "regulatory_exposure": float(profile.regulatory_exposure or 0.0),
        "financial_sensitivity": float(profile.financial_sensitivity or 0.0),
        "margin_pressure_points": profile.margin_pressure_points or [],
        "strategic_priorities": profile.strategic_priorities or [],
        "growth_objectives": profile.growth_objectives or [],
        "risk_tolerance": profile.risk_tolerance,
        "recommendation_style": profile.recommendation_style,
        "competitor_context": profile.competitor_context or [],
        "known_risk_areas": profile.known_risk_areas or [],
        "known_opportunity_areas": profile.known_opportunity_areas or [],
        "notes": profile.notes or "",
        "calibration_summary": profile.calibration_summary or {},
        "created_at": profile.created_at.isoformat() if profile.created_at else None,
        "updated_at": profile.updated_at.isoformat() if profile.updated_at else None,
    }


def build_calibration_summary(payload: Dict[str, Any]) -> Dict[str, Any]:
    exposure_flags = []
    if float(payload.get("energy_dependency", 0)) >= 60:
        exposure_flags.append("High energy dependency")
    if float(payload.get("import_export_exposure", 0)) >= 60:
        exposure_flags.append("High import / export exposure")
    if float(payload.get("consumer_sensitivity", 0)) >= 60:
        exposure_flags.append("High consumer sensitivity")
    if float(payload.get("regulatory_exposure", 0)) >= 60:
        exposure_flags.append("High regulatory exposure")
    if float(payload.get("financial_sensitivity", 0)) >= 60:
        exposure_flags.append("High financial sensitivity")

    strongest_opportunity_fit = []
    if payload.get("strategic_priorities"):
        strongest_opportunity_fit.extend(payload["strategic_priorities"][:3])
    elif payload.get("growth_objectives"):
        strongest_opportunity_fit.extend(payload["growth_objectives"][:3])

    completeness_checks = [
        payload.get("company_name"),
        payload.get("sector"),
        payload.get("regions"),
        payload.get("strategic_priorities"),
        payload.get("risk_tolerance"),
        payload.get("recommendation_style"),
    ]
    filled = sum(1 for item in completeness_checks if item)
    completeness = int(round((filled / len(completeness_checks)) * 100))

    gaps = []
    if not payload.get("company_name"):
        gaps.append("company_name")
    if not payload.get("sector"):
        gaps.append("sector")
    if not payload.get("regions"):
        gaps.append("regions")
    if not payload.get("strategic_priorities"):
        gaps.append("strategic_priorities")
    if not payload.get("risk_tolerance"):
        gaps.append("risk_tolerance")
    if not payload.get("recommendation_style"):
        gaps.append("recommendation_style")

    return {
        "what_geopulse_knows": [
            f"Sector: {payload.get('sector') or 'Unknown'}",
            f"Regions: {', '.join(payload.get('regions') or []) or 'Unknown'}",
            f"Strategic priorities: {', '.join(payload.get('strategic_priorities') or []) or 'Unknown'}",
        ],
        "exposure_flags": exposure_flags[:4],
        "strongest_opportunity_fit": strongest_opportunity_fit[:4],
        "profile_gaps": gaps,
        "completeness": completeness,
    }


def get_company_profile(db: Session, company_id: str) -> Optional[CompanyProfileModel]:
    return db.query(CompanyProfileModel).filter_by(id=company_id).first()


def get_latest_company_profile(db: Session) -> Optional[CompanyProfileModel]:
    return (
        db.query(CompanyProfileModel)
        .order_by(CompanyProfileModel.updated_at.desc(), CompanyProfileModel.created_at.desc())
        .first()
    )


def save_or_update_company_profile(db: Session, data: Dict[str, Any]) -> Dict[str, Any]:
    payload = _normalise_payload(data)
    company_id = str(data.get("id") or data.get("company_id") or "").strip()

    profile: Optional[CompanyProfileModel] = None
    if company_id:
        profile = get_company_profile(db, company_id)

    if not profile and payload.get("company_name"):
        profile = (
            db.query(CompanyProfileModel)
            .filter(CompanyProfileModel.company_name == payload["company_name"])
            .order_by(CompanyProfileModel.updated_at.desc(), CompanyProfileModel.created_at.desc())
            .first()
        )

    payload["calibration_summary"] = build_calibration_summary(payload)

    if profile:
        for key, value in payload.items():
            setattr(profile, key, value)
        profile.updated_at = datetime.utcnow()
    else:
        profile = CompanyProfileModel(
            id=str(uuid.uuid4()),
            **payload,
        )
        db.add(profile)

    db.commit()
    db.refresh(profile)
    return _serialise_profile(profile)


def serialise_company_profile(profile: Optional[CompanyProfileModel]) -> Optional[Dict[str, Any]]:
    if not profile:
        return None
    return _serialise_profile(profile)