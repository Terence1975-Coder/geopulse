import os
from typing import Any, Dict, List, Optional

import httpx
from fastapi import APIRouter, Depends, Header, HTTPException, Query
from pydantic import BaseModel, Field

from backend.services.supabase_workspace import (
    CalibrationPayload,
    fetch_workspace_settings,
    supabase_headers,
    upsert_workspace_settings,
)


router = APIRouter(prefix="/admin", tags=["admin"])

ADMIN_TOKEN = os.getenv("ADMIN_TOKEN")
SUPABASE_URL = (os.getenv("SUPABASE_URL") or "").rstrip("/")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or ""


async def require_admin_token(x_admin_token: Optional[str] = Header(None)) -> bool:
    if not ADMIN_TOKEN:
        raise HTTPException(status_code=401, detail="Admin token not configured")
    if x_admin_token != ADMIN_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid admin token")
    return True


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


@router.get("/agent-runs/recent")
async def recent_agent_runs(
    limit: int = Query(default=10, ge=1, le=50),
    _: bool = Depends(require_admin_token),
) -> Dict[str, Any]:
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise HTTPException(status_code=503, detail="Supabase not configured")

    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    }

    columns = ",".join(
        [
            "id",
            "company_id",
            "user_id",
            "status",
            "input",
            "output_summary",
            "started_at",
            "completed_at",
        ]
    )

    url = (
        f"{SUPABASE_URL}/rest/v1/agent_runs"
        f"?select={columns}"
        f"&order=started_at.desc"
        f"&limit={limit}"
    )

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=exc.response.status_code,
            detail=f"Supabase agent_runs query failed: {exc.response.text}",
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Could not fetch recent agent runs: {str(exc)}",
        ) from exc

    raw_runs = response.json()

    runs = []
    for run in raw_runs:
        input_payload = run.get("input") or {}
        if not isinstance(input_payload, dict):
            input_payload = {}

        runs.append(
            {
                "id": run.get("id"),
                "company_id": run.get("company_id"),
                "user_id": run.get("user_id"),
                "stage": input_payload.get("stage"),
                "status": run.get("status"),
                "input_hash": input_payload.get("input_hash"),
                "input_preview": input_payload.get("input_preview"),
                "context_summary": input_payload.get("context_summary"),
                "output_summary": run.get("output_summary"),
                "started_at": run.get("started_at"),
                "completed_at": run.get("completed_at"),
            }
        )

    return {
        "ok": True,
        "limit": limit,
        "runs": runs,
    }


@router.post("/company/profile/save")
async def save_company_profile_calibration(
    payload: CalibrationPayload,
    _: bool = Depends(require_admin_token),
) -> Dict[str, Any]:
    record = await upsert_workspace_settings(payload.company_id, payload.calibration)
    calibration = (record.get("feature_flags") or {}).get("calibration", {})
    return {"ok": True, "workspace_settings": record, "calibration": calibration}


@router.get("/company/profile/latest")
async def latest_company_profile_calibration(
    company_id: Optional[str] = None,
    _: bool = Depends(require_admin_token),
) -> Dict[str, Any]:
    record = await fetch_workspace_settings(company_id)
    if not record:
        raise HTTPException(status_code=404, detail="No calibration found")
    calibration = (record.get("feature_flags") or {}).get("calibration", {})
    return {"workspace_settings": record, "calibration": calibration}
