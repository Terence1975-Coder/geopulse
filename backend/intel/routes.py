from __future__ import annotations

from fastapi import APIRouter, HTTPException

from backend.intel.agent_service import AgentService
from backend.intel.schemas import AgentEngageRequest, AgentEngageResponse

router = APIRouter(prefix="/intel", tags=["intelligence"])

service = AgentService()


@router.post("/agent/engage", response_model=AgentEngageResponse)
def engage_agent(payload: AgentEngageRequest) -> AgentEngageResponse:
    try:
        return service.engage(payload)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
        