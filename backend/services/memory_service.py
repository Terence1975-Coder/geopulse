from __future__ import annotations

import json
from typing import Any, Dict, Iterable, List, Optional

from sqlalchemy import desc, or_
from sqlalchemy.orm import Session

from backend.db import Base, SessionLocal, engine
import backend.models  # noqa: F401
from backend.models import AgentChainRun, CompanyMemory
from backend.services.signal_ingestion import get_latest_signals, upsert_signals


def _json_dumps(value: Any) -> Optional[str]:
    if value is None:
        return None
    return json.dumps(value, ensure_ascii=False)


def _json_loads(value: Optional[str], fallback: Any) -> Any:
    if not value:
        return fallback
    try:
        return json.loads(value)
    except Exception:
        return fallback


def _split_csv(value: Optional[str]) -> List[str]:
    if not value:
        return []
    return [item.strip() for item in value.split(",") if item.strip()]


def init_persistence() -> None:
    Base.metadata.create_all(bind=engine)


def list_signals(limit: int = 50) -> List[Dict[str, Any]]:
    init_persistence()
    signals, _ = get_latest_signals(limit=limit, auto_refresh=True)
    return signals


def store_signals(items: Iterable[Dict[str, Any]]) -> Dict[str, Any]:
    init_persistence()
    updated = upsert_signals(items)
    return {
        "ok": True,
        "stored": updated,
    }


def save_company_profile(
    company_name: str,
    company_id: Optional[str],
    profile: Dict[str, Any],
) -> Dict[str, Any]:
    init_persistence()
    session: Session = SessionLocal()

    try:
        market_focus = profile.get("markets") or profile.get("market_focus") or []
        strategic_priorities = profile.get("strategic_priorities") or []
        recommendation_posture = (
            profile.get("recommendation_style")
            or profile.get("recommendation_posture")
            or "balanced"
        )

        existing = None
        if company_id:
            existing = (
                session.query(CompanyMemory)
                .filter(CompanyMemory.company_id == company_id)
                .order_by(desc(CompanyMemory.updated_at))
                .first()
            )

        if not existing and company_name:
            existing = (
                session.query(CompanyMemory)
                .filter(CompanyMemory.company_name == company_name)
                .order_by(desc(CompanyMemory.updated_at))
                .first()
            )

        if existing:
            existing.company_name = company_name
            existing.company_id = company_id
            existing.market_focus = ", ".join(market_focus) if isinstance(market_focus, list) else str(market_focus or "")
            existing.strategic_priorities = (
                ", ".join(strategic_priorities)
                if isinstance(strategic_priorities, list)
                else str(strategic_priorities or "")
            )
            existing.recommendation_posture = recommendation_posture
            existing.profile_json = _json_dumps(profile)
            row = existing
        else:
            row = CompanyMemory(
                company_name=company_name,
                company_id=company_id,
                market_focus=", ".join(market_focus) if isinstance(market_focus, list) else str(market_focus or ""),
                strategic_priorities=", ".join(strategic_priorities)
                if isinstance(strategic_priorities, list)
                else str(strategic_priorities or ""),
                recommendation_posture=recommendation_posture,
                profile_json=_json_dumps(profile),
            )
            session.add(row)

        session.commit()
        session.refresh(row)

        return {
            "ok": True,
            "company_name": row.company_name,
            "company_id": row.company_id,
            "profile": _json_loads(row.profile_json, {}),
            "updated_at": row.updated_at.isoformat() if row.updated_at else None,
        }
    finally:
        session.close()


def get_company_profile(
    company_name: Optional[str] = None,
    company_id: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    init_persistence()
    session: Session = SessionLocal()

    try:
        query = session.query(CompanyMemory)

        if company_id and company_name:
            row = (
                query.filter(
                    or_(
                        CompanyMemory.company_id == company_id,
                        CompanyMemory.company_name == company_name,
                    )
                )
                .order_by(desc(CompanyMemory.updated_at))
                .first()
            )
        elif company_id:
            row = (
                query.filter(CompanyMemory.company_id == company_id)
                .order_by(desc(CompanyMemory.updated_at))
                .first()
            )
        elif company_name:
            row = (
                query.filter(CompanyMemory.company_name == company_name)
                .order_by(desc(CompanyMemory.updated_at))
                .first()
            )
        else:
            row = query.order_by(desc(CompanyMemory.updated_at)).first()

        if not row:
            return None

        return {
            "company_name": row.company_name,
            "company_id": row.company_id,
            "market_focus": _split_csv(row.market_focus),
            "strategic_priorities": _split_csv(row.strategic_priorities),
            "recommendation_posture": row.recommendation_posture,
            "profile": _json_loads(row.profile_json, {}),
            "updated_at": row.updated_at.isoformat() if row.updated_at else None,
        }
    finally:
        session.close()


def save_agent_run(
    *,
    company_name: Optional[str],
    input_text: str,
    anonymized_input: Optional[str],
    requested_stage: str,
    completed_steps: List[str],
    chain_outputs: Optional[Dict[str, Any]],
    evidence: Optional[Dict[str, Any]],
    explanation: Optional[Dict[str, Any]],
    privacy: Optional[Dict[str, Any]],
) -> Dict[str, Any]:
    init_persistence()
    session: Session = SessionLocal()

    try:
        outputs = chain_outputs or {}
        row = AgentChainRun(
            company_name=company_name,
            input_text=input_text,
            anonymized_input=anonymized_input,
            requested_stage=requested_stage,
            completed_steps=",".join(completed_steps),
            output_analyse=_json_dumps(outputs.get("analyse")),
            output_advise=_json_dumps(outputs.get("advise")),
            output_plan=_json_dumps(outputs.get("plan")),
            output_profile=_json_dumps(outputs.get("profile")),
            evidence_json=_json_dumps(evidence or {}),
            explanation_json=_json_dumps(explanation or {}),
            privacy_json=_json_dumps(privacy or {}),
        )
        session.add(row)
        session.commit()
        session.refresh(row)

        return {
            "ok": True,
            "run_id": row.id,
            "created_at": row.created_at.isoformat() if row.created_at else None,
        }
    finally:
        session.close()


def list_agent_runs(limit: int = 20) -> List[Dict[str, Any]]:
    init_persistence()
    session: Session = SessionLocal()

    try:
        rows = (
            session.query(AgentChainRun)
            .order_by(desc(AgentChainRun.created_at))
            .limit(max(1, min(limit, 100)))
            .all()
        )

        results: List[Dict[str, Any]] = []
        for row in rows:
            results.append(
                {
                    "id": row.id,
                    "company_name": row.company_name,
                    "input_text": row.input_text,
                    "anonymized_input": row.anonymized_input,
                    "requested_stage": row.requested_stage,
                    "completed_steps": _split_csv(row.completed_steps),
                    "outputs": {
                        "analyse": _json_loads(row.output_analyse, None),
                        "advise": _json_loads(row.output_advise, None),
                        "plan": _json_loads(row.output_plan, None),
                        "profile": _json_loads(row.output_profile, None),
                    },
                    "evidence": _json_loads(row.evidence_json, {}),
                    "explanation": _json_loads(row.explanation_json, {}),
                    "privacy": _json_loads(row.privacy_json, {}),
                    "created_at": row.created_at.isoformat() if row.created_at else None,
                }
            )

        return results
    finally:
        session.close()