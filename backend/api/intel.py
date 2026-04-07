from typing import Any, Dict, Optional
from typing_extensions import Literal

from fastapi import APIRouter
from pydantic import BaseModel

from backend.intel.schemas import AgentEngageResponse
from backend.services.multi_path_chain import run_multi_path_chain
from backend.services.orchestration_service import execute_chain
from backend.db import SessionLocal

router = APIRouter(prefix="/intel", tags=["intel"])


class AgentEngageRequest(BaseModel):
    input: str
    stage: Optional[
        Literal["analyse", "advise", "plan", "profile", "full_chain", "multi_path"]
    ] = "full_chain"
    company_name: Optional[str] = None
    company_context: Optional[Dict[str, Any]] = None
    previous_chain_state: Optional[Dict[str, Any]] = None


@router.post("/agent/engage", response_model=AgentEngageResponse)
async def engage_agent(payload: AgentEngageRequest):
    if payload.stage == "multi_path":
        company_context = payload.company_context or {}

        if payload.company_name:
            company_context["company_name"] = payload.company_name

        multi_path_output = await run_multi_path_chain(
            input_text=payload.input,
            company_context=company_context,
        )

        return AgentEngageResponse(
            output=multi_path_output,
            outputs=None,
            chain_outputs=None,
            multi_path_output=multi_path_output,
            context_summary={
                "mode": "multi_path",
                "company_name": payload.company_name,
            },
            meta={
                "stage": "multi_path",
                "engine": "GeoPulse Multi-Path Intelligence Chain",
            },
        )

    db = SessionLocal()
    try:
        result = execute_chain(
            db=db,
            input_text=payload.input,
            requested_stage=payload.stage,
            company_name=payload.company_name,
            previous_chain_state=payload.previous_chain_state,
        )

        return AgentEngageResponse(
            output=result.get("outputs", {}).get(payload.stage) if isinstance(result, dict) else None,
            outputs=result.get("outputs") if isinstance(result, dict) else None,
            chain_outputs=result if isinstance(result, dict) else None,
            multi_path_output=None,
            context_summary={
                "mode": payload.stage,
                "company_name": payload.company_name,
            },
            meta={
                "stage": payload.stage,
                "engine": "GeoPulse Linear Chain",
            },
        )
    finally:
        db.close()