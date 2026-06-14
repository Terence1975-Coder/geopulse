import os
from typing import Any, Dict, List, Optional

import httpx
from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field


router = APIRouter(prefix="/admin", tags=["admin"])

ADMIN_TOKEN = os.getenv("ADMIN_TOKEN")
SUPABASE_URL = (os.getenv("SUPABASE_URL") or "").rstrip("/")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or ""


def require_admin_token(x_admin_token: str | None = Header(default=None)) -> bool:
    if ADMIN_TOKEN:
        if x_admin_token != ADMIN_TOKEN:
            raise HTTPException(status_code=401, detail="Unauthorized")
    return True


def _ensure_supabase_configured() -> None:
    if not (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY):
        raise HTTPException(status_code=500, detail="Supabase is not configured")


def _supabase_headers() -> Dict[str, str]:
    _ensure_supabase_configured()
    return {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }


async def _fetch_workspace_settings(company_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    params: Dict[str, str] = {
        "select": "id,company_id,feature_flags,default_workspace,privacy_mode,created_at,updated_at",
        "order": "updated_at.desc",
        "limit": "1",
    }

    if company_id:
        params["company_id"] = f"eq.{company_id}"

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/workspace_settings",
                headers=_supabase_headers(),
                params=params,
            )
            response.raise_for_status()
            items = response.json()
            return items[0] if isinstance(items, list) and items else None
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=exc.response.status_code,
            detail=f"Supabase fetch failed: {exc.response.text}",
        ) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"Supabase fetch failed: {exc}") from exc


async def _upsert_workspace_settings(
    company_id: str,
    calibration: Dict[str, Any],
) -> Dict[str, Any]:
    existing = await _fetch_workspace_settings(company_id)

    feature_flags: Dict[str, Any] = {}
    if existing and isinstance(existing.get("feature_flags"), dict):
        feature_flags.update(existing.get("feature_flags") or {})

    feature_flags["calibration"] = calibration or {}

    payload: Dict[str, Any] = {
        "company_id": company_id,
        "feature_flags": feature_flags,
    }

    if existing:
        if existing.get("default_workspace") is not None:
            payload["default_workspace"] = existing["default_workspace"]
        if existing.get("privacy_mode") is not None:
            payload["privacy_mode"] = existing["privacy_mode"]

    headers = _supabase_headers()
    headers["Prefer"] = "return=representation,resolution=merge-duplicates"

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.post(
                f"{SUPABASE_URL}/rest/v1/workspace_settings",
                headers=headers,
                params={"on_conflict": "company_id"},
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            if isinstance(data, list) and data:
                return data[0]
            if isinstance(data, dict):
                return data
            raise HTTPException(status_code=502, detail="Supabase upsert returned no data")
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=exc.response.status_code,
            detail=f"Supabase upsert failed: {exc.response.text}",
        ) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"Supabase upsert failed: {exc}") from exc


class CalibrationPayload(BaseModel):
    company_id: str = Field(..., description="Target company_id for calibration persistence")
    calibration: Dict[str, Any] = Field(default_factory=dict)


@router.get("/supabase-status")
async def supabase_status(_: bool = Depends(require_admin_token)) -> dict[str, object]:
    configured = bool(SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)
    tables: List[str] = ["profiles", "companies", "workspace_settings", "agent_runs"]
    visible: List[str] = []

    if configured:
        headers = {
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        }

        async with httpx.AsyncClient(timeout=5.0) as client:
            for table in tables:
                url = f"{SUPABASE_URL}/rest/v1/{table}?select=id&limit=1"
                try:
                    response = await client.get(url, headers=headers)
                    response.raise_for_status()
                    visible.append(table)
                except Exception:
                    # Surface partial visibility; overall ok reflects full visibility
                    continue

    ok = configured and len(visible) == len(tables)

    return {
        "ok": ok,
        "supabase_configured": configured,
        "tables_visible": visible,
    }


@router.post("/company/profile/save")
async def save_company_profile_calibration(
    payload: CalibrationPayload,
    _: bool = Depends(require_admin_token),
) -> Dict[str, Any]:
    record = await _upsert_workspace_settings(payload.company_id, payload.calibration)
    calibration = (record.get("feature_flags") or {}).get("calibration", {})
    return {"ok": True, "workspace_settings": record, "calibration": calibration}


@router.get("/company/profile/latest")
async def latest_company_profile_calibration(
    company_id: Optional[str] = None,
    _: bool = Depends(require_admin_token),
) -> Dict[str, Any]:
    record = await _fetch_workspace_settings(company_id)
    if not record:
        raise HTTPException(status_code=404, detail="No calibration found")
    calibration = (record.get("feature_flags") or {}).get("calibration", {})
    return {"workspace_settings": record, "calibration": calibration}
