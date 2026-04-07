import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.db import get_db
from backend.models import ResourceBankItem, CompanyMemory
from backend.schemas import (
    ResourceBankItemCreate,
    CompanyMemoryUpsertRequest,
    AgentEngageRequest,
)
from backend.services.anonymizer import anonymize_text
from backend.services.memory_service import upsert_company_memory
from backend.services.orchestration_service import execute_chain
from backend.services.trust_service import normalize_tags
from backend.services.multi_path_chain import run_multi_path_chain

router = APIRouter(prefix="/intel", tags=["intel"])


@router.get("/resource-bank")
def get_resource_bank(db: Session = Depends(get_db)):
    items = db.query(ResourceBankItem).order_by(ResourceBankItem.id.desc()).all()
    return {
        "total": len(items),
        "items": [
            {
                "id": str(item.id),
                "title": item.title,
                "source_type": item.source_type,
                "trust_score": item.trust_score,
                "tags": normalize_tags(item.tags),
            }
            for item in items
        ],
    }


@router.post("/resource-bank")
def create_resource_bank_item(
    payload: ResourceBankItemCreate,
    db: Session = Depends(get_db),
):
    item = ResourceBankItem(
        title=payload.title,
        source_type=payload.source_type,
        content=payload.content,
        tags=",".join(payload.tags),
        trust_score=payload.trust_score,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return {"ok": True, "id": item.id}


@router.post("/privacy-preview")
def privacy_preview(payload: dict):
    text = payload.get("input", "")
    return anonymize_text(text)


@router.post("/memory/upsert")
def memory_upsert(
    payload: CompanyMemoryUpsertRequest,
    db: Session = Depends(get_db),
):
    item = upsert_company_memory(
        db=db,
        company_name=payload.company_name,
        company_id=payload.company_id,
        market_focus=payload.market_focus,
        strategic_priorities=payload.strategic_priorities,
        recommendation_posture=payload.recommendation_posture,
        profile_json=payload.profile_json,
    )
    return {
        "ok": True,
        "company_name": item.company_name,
    }


@router.get("/memory/{company_name}")
def get_memory(company_name: str, db: Session = Depends(get_db)):
    item = (
        db.query(CompanyMemory)
        .filter(CompanyMemory.company_name == company_name)
        .first()
    )

    if not item:
        return {"found": False}

    return {
        "found": True,
        "company_name": item.company_name,
        "company_id": item.company_id,
        "market_focus": item.market_focus,
        "strategic_priorities": json.loads(item.strategic_priorities or "[]"),
        "recommendation_posture": item.recommendation_posture,
        "profile_json": json.loads(item.profile_json or "{}"),
    }

@router.post("/agent/engage")
async def agent_engage(payload: AgentEngageRequest, db: Session = Depends(get_db)):
    if payload.stage == "multi_path":
        from backend.services.multi_path_chain import run_multi_path_chain

        company_context = getattr(payload, "company_context", None) or {}

        if payload.company_name:
            company_context["company_name"] = payload.company_name

        multi_path_output = await run_multi_path_chain(
            input_text=payload.input,
            company_context=company_context,
        )

        return {
            "output": multi_path_output,
            "multi_path_output": multi_path_output,
            "context_summary": {
                "mode": "multi_path",
                "company_name": payload.company_name,
            },
            "meta": {
                "stage": "multi_path",
                "engine": "GeoPulse Multi-Path Intelligence Chain",
            },
        }

    return execute_chain(
        db=db,
        input_text=payload.input,
        requested_stage=payload.stage,
        company_name=payload.company_name,
        previous_chain_state=payload.previous_chain_state,
    )

    @router.post("/agent/engage")
async def agent_engage(payload: AgentEngageRequest, db: Session = Depends(get_db)):
    if payload.stage == "multi_path":
        from backend.services.multi_path_chain import run_multi_path_chain

        company_context = getattr(payload, "company_context", None) or {}

        if payload.company_name:
            company_context["company_name"] = payload.company_name

        multi_path_output = await run_multi_path_chain(
            input_text=payload.input,
            company_context=company_context,
        )

        return {
            "output": multi_path_output,
            "multi_path_output": multi_path_output,
            "context_summary": {
                "mode": "multi_path",
                "company_name": payload.company_name,
            },
            "meta": {
                "stage": "multi_path",
                "engine": "GeoPulse Multi-Path Intelligence Chain",
            },
        }

    return execute_chain(
        db=db,
        input_text=payload.input,
        requested_stage=payload.stage,
        company_name=payload.company_name,
        previous_chain_state=payload.previous_chain_state,
    )

    # ✅ EXISTING SYSTEM (UNCHANGED)
    return execute_chain(
        db=db,
        input_text=payload.input,
        requested_stage=payload.stage,
        company_name=payload.company_name,
        previous_chain_state=payload.previous_chain_state,
        )   previous_chain_state=payload.previous_chain_state,
    )