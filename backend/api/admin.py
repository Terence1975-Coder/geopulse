import os
from typing import List

import httpx
from fastapi import APIRouter, Depends, Header, HTTPException


router = APIRouter(prefix="/admin", tags=["admin"])

ADMIN_TOKEN = os.getenv("ADMIN_TOKEN")
SUPABASE_URL = (os.getenv("SUPABASE_URL") or "").rstrip("/")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or ""


def require_admin_token(x_admin_token: str | None = Header(default=None)) -> bool:
    if ADMIN_TOKEN:
        if x_admin_token != ADMIN_TOKEN:
            raise HTTPException(status_code=401, detail="Unauthorized")
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

