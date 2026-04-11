from __future__ import annotations

import traceback
from typing import Any, List, Optional

from fastapi import APIRouter, HTTPException, Query

from backend.intel.agent_service import AgentService
from backend.intel.schemas import (
    AgentEngageRequest,
    AgentEngageResponse,
    AgentRunRecord,
    CompanyProfileFetchResponse,
    CompanyProfileSaveRequest,
    CompanyProfileSaveResponse,
    SignalRecord,
    SignalStoreRequest,
    SignalStoreResponse,
)
from backend.services.memory_service import (
    get_company_profile,
    init_persistence,
    list_agent_runs,
    list_signals,
    save_company_profile,
    store_signals,
)
from backend.services.multi_path_chain import run_multi_path_chain

router = APIRouter(prefix="/intel", tags=["intelligence"])

init_persistence()
service = AgentService()


def _normalise_company_context(payload: AgentEngageRequest) -> dict[str, Any]:
    company_context = dict(payload.company_context or {})

    if payload.company_name:
        company_context["company_name"] = payload.company_name

    if payload.company_id:
        company_context["company_id"] = payload.company_id

    if payload.company_profile:
        company_context["company_profile"] = payload.company_profile.model_dump()

    if payload.chain_outputs:
        company_context["chain_outputs"] = payload.chain_outputs.model_dump()

    if payload.conversation_history:
        company_context["conversation_history"] = [
            item.model_dump() if hasattr(item, "model_dump") else item
            for item in payload.conversation_history
        ]

    return company_context


@router.get("/dashboard/summary")
def get_dashboard_summary():
    return {
        "overall_risk_score": 72,
        "opportunity_score": 81,
        "posture": "Heightened Attention",
        "opportunity_posture": "Targeted Upside",
        "urgency": "Moderate",
    }


@router.get("/signals", response_model=List[SignalRecord])
async def get_signals() -> List[SignalRecord]:
    try:
        return list_signals()
    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"get_signals failed: {str(exc)}",
        ) from exc


@router.post("/signals/store", response_model=SignalStoreResponse)
async def store_signal_records(payload: SignalStoreRequest) -> SignalStoreResponse:
    try:
        result = store_signals([item.model_dump() for item in payload.items])
        return SignalStoreResponse(**result)
    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"store_signal_records failed: {str(exc)}",
        ) from exc


@router.get("/runs", response_model=List[AgentRunRecord])
async def get_runs(limit: int = Query(default=20, ge=1, le=100)) -> List[dict[str, Any]]:
    try:
        return list_agent_runs(limit=limit)
    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"get_runs failed: {str(exc)}",
        ) from exc


@router.post("/company-profile/save", response_model=CompanyProfileSaveResponse)
async def save_company_profile_endpoint(
    payload: CompanyProfileSaveRequest,
) -> CompanyProfileSaveResponse:
    try:
        result = save_company_profile(
            company_name=payload.company_name,
            company_id=payload.company_id,
            profile=payload.profile,
        )
        return CompanyProfileSaveResponse(**result)
    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"save_company_profile failed: {str(exc)}",
        ) from exc


@router.get("/company-profile", response_model=Optional[CompanyProfileFetchResponse])
async def get_company_profile_endpoint(
    company_name: Optional[str] = None,
    company_id: Optional[str] = None,
) -> Optional[CompanyProfileFetchResponse]:
    try:
        result = get_company_profile(company_name=company_name, company_id=company_id)
        if not result:
            return None
        return CompanyProfileFetchResponse(**result)
    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"get_company_profile failed: {str(exc)}",
        ) from exc


@router.post("/agent/engage", response_model=AgentEngageResponse)
async def engage_agent(payload: AgentEngageRequest) -> AgentEngageResponse:
    try:
        if payload.stage == "multi_path":
            company_context = _normalise_company_context(payload)

            multi_path_output = await run_multi_path_chain(
                input_text=payload.input,
                company_context=company_context,
            )

            return AgentEngageResponse(
                output=multi_path_output,
                outputs=None,
                chain_outputs=payload.chain_outputs,
                multi_path_output=multi_path_output,
                context_summary={
                    "mode": "multi_path",
                    "company_name": payload.company_name or (
                        payload.company_profile.company_name if payload.company_profile else None
                    ),
                    "company_id": payload.company_id,
                },
                meta={
                    "stage": "multi_path",
                    "engine": "GeoPulse Multi-Path Intelligence Chain",
                    "contract_version": "v8.3",
                },
            )

        return service.engage(payload)

    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"engage_agent failed: {str(exc)}",
        ) from exc