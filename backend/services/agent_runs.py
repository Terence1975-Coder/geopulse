from __future__ import annotations

import hashlib
import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional

import httpx
from fastapi import HTTPException

from backend.services.supabase_workspace import (
    SUPABASE_URL,
    ensure_supabase_configured,
    supabase_headers,
)

logger = logging.getLogger(__name__)


def _iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _hash_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def _input_envelope(stage: str, input_text: str, context_summary: Dict[str, Any]) -> Dict[str, Any]:
    preview = input_text[:500] if input_text else None
    return {
        "stage": stage,
        "input_preview": preview,
        "input_hash": _hash_text(input_text) if input_text else None,
        "context_summary": context_summary or {},
    }


async def create_agent_run(
    *,
    company_id: Optional[str],
    stage: str,
    input_text: str,
    context_summary: Dict[str, Any],
) -> Optional[str]:
    try:
        ensure_supabase_configured()
    except HTTPException:
        logger.info("Supabase not configured; skipping agent_runs create")
        return None

    payload: Dict[str, Any] = {
        "company_id": company_id,
        "status": "running",
        "input": _input_envelope(stage, input_text, context_summary),
        "started_at": _iso_now(),
    }

    headers = supabase_headers()
    headers["Prefer"] = "return=representation"

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.post(
                f"{SUPABASE_URL}/rest/v1/agent_runs",
                headers=headers,
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            if isinstance(data, list) and data:
                return data[0].get("id")
            if isinstance(data, dict):
                return data.get("id")
    except Exception as exc:  # pragma: no cover - best-effort logging
        logger.warning("agent_runs create failed: %s", exc, exc_info=True)

    return None


async def _patch_agent_run(run_id: str, payload: Dict[str, Any]) -> None:
    if not run_id:
        return

    headers = supabase_headers()
    headers["Prefer"] = "return=representation"

    async with httpx.AsyncClient(timeout=8.0) as client:
        response = await client.patch(
            f"{SUPABASE_URL}/rest/v1/agent_runs",
            headers=headers,
            params={"id": f"eq.{run_id}"},
            json=payload,
        )
        response.raise_for_status()


def _trim_output_summary(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    return value[:900]


def _error_text(error_message: str) -> str:
    if not error_message:
        return "error"
    return error_message.strip()[:900]


async def complete_agent_run(run_id: Optional[str], output_summary: Optional[str] = None) -> None:
    if not run_id:
        return

    try:
        ensure_supabase_configured()
    except HTTPException:
        return

    payload: Dict[str, Any] = {
        "status": "completed",
        "completed_at": _iso_now(),
    }

    trimmed_summary = _trim_output_summary(output_summary)
    if trimmed_summary:
        payload["output_summary"] = trimmed_summary

    try:
        await _patch_agent_run(run_id, payload)
    except Exception as exc:  # pragma: no cover - best-effort logging
        logger.warning("agent_runs complete update failed: %s", exc, exc_info=True)


async def fail_agent_run(run_id: Optional[str], error_message: str) -> None:
    if not run_id:
        return

    try:
        ensure_supabase_configured()
    except HTTPException:
        return

    payload: Dict[str, Any] = {
        "status": "failed",
        "completed_at": _iso_now(),
        "output_summary": f"error: {_error_text(error_message)}",
    }

    try:
        await _patch_agent_run(run_id, payload)
    except Exception as exc:  # pragma: no cover - best-effort logging
        logger.warning("agent_runs fail update failed: %s", exc, exc_info=True)
