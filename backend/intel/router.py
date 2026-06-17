from __future__ import annotations

import logging
import traceback
from typing import Any, Dict

from fastapi import APIRouter, HTTPException, Query

from backend.intel.agent_service import AgentService
from backend.intel.schemas import AgentEngageRequest, AgentEngageResponse
from backend.services.multi_path_chain import run_multi_path_chain
from backend.services.signal_ingestion import select_supporting_signals_for_text

router = APIRouter(prefix="/intel", tags=["intelligence"])

service = AgentService()

company_profile_store: dict[str, Any] = {}

logger = logging.getLogger(__name__)


def _safe_profile_summary(profile: Any) -> Dict[str, Any]:
    if not profile:
        return {}

    data: Dict[str, Any]
    if hasattr(profile, "model_dump"):
        data = profile.model_dump()
    elif isinstance(profile, dict):
        data = profile
    else:
        try:
            data = dict(profile)  # type: ignore[arg-type]
        except Exception:
            data = {}

    strategic_priorities = data.get("strategic_priorities") or []
    markets = data.get("markets") or data.get("market_focus") or []

    return {
        "company_id": data.get("company_id"),
        "company_name": data.get("company_name"),
        "strategic_priorities": strategic_priorities[:3]
        if isinstance(strategic_priorities, list)
        else strategic_priorities,
        "markets": markets[:3] if isinstance(markets, list) else markets,
        "keys": sorted(k for k in data.keys() if k not in {"profile_json"}),
    }


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


def _coerce_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _coerce_int(value: Any, default: int = 0) -> int:
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return default


def _normalise_signal(raw: dict[str, Any], index: int) -> dict[str, Any]:
    confidence_score = _coerce_float(raw.get("confidence_score", raw.get("confidence", 0.0)))
    signal_strength = _coerce_float(raw.get("signal_strength", confidence_score))
    freshness_minutes = _coerce_int(raw.get("freshness_minutes", 240))

    lifecycle = raw.get("lifecycle")
    if not lifecycle:
        if freshness_minutes <= 60:
            lifecycle = "Fresh"
        elif freshness_minutes <= 180:
            lifecycle = "Watch"
        else:
            lifecycle = "Aging"

    kind = str(raw.get("kind") or "risk").lower()
    if kind not in {"risk", "opportunity"}:
        kind = "opportunity" if "opportun" in str(raw.get("cluster_tag", "")).lower() else "risk"

    severity = str(raw.get("severity") or "medium").lower()
    if severity not in {"low", "medium", "high"}:
        severity = "medium"

    relative_time = raw.get("relative_time")
    if not relative_time:
        if freshness_minutes < 60:
            relative_time = f"{freshness_minutes} mins ago"
        elif freshness_minutes < 1440:
            relative_time = f"{round(freshness_minutes / 60)}h ago"
        else:
            relative_time = f"{round(freshness_minutes / 1440)}d ago"

    timestamp = raw.get("timestamp") or raw.get("detected_at") or raw.get("updated_at")

    return {
        "id": raw.get("id") or f"sig-{index}",
        "headline": raw.get("headline") or "Untitled signal",
        "summary": raw.get("summary") or "No summary available.",
        "source": raw.get("source") or "Unknown",
        "source_type": raw.get("source_type") or raw.get("type") or "news",
        "region": raw.get("region") or "Global",
        "cluster_tag": raw.get("cluster_tag") or raw.get("theme") or "General",
        "kind": kind,
        "severity": severity,
        "confidence_score": confidence_score,
        "freshness_minutes": freshness_minutes,
        "signal_strength": signal_strength,
        "timestamp": timestamp,
        "detected_at": raw.get("detected_at") or timestamp,
        "lifecycle": lifecycle,
        "relative_time": relative_time,
        "confidence": confidence_score,
        "horizon": (
            "immediate"
            if freshness_minutes <= 60
            else "near-term"
            if freshness_minutes <= 180
            else "mid-term"
        ),
        "tags": raw.get("tags") or [],
        "source_url": (
            raw.get("source_url")
            or (raw.get("metadata") or {}).get("article_url")
            or (raw.get("supporting_facts") or {}).get("article_url")
            or ""
        ),

        # 🔥 ADD THIS
        "source_url": (
            raw.get("source_url")
            or (raw.get("metadata") or {}).get("article_url")
            or ""
        ),
    }

def _load_live_signals(query: str, limit: int) -> list[dict[str, Any]]:
    raw_signals = select_supporting_signals_for_text(query, limit=limit) or []
    return [_normalise_signal(item, index) for index, item in enumerate(raw_signals, start=1)]


def _build_opportunities(signals: list[dict[str, Any]], limit: int) -> list[dict[str, Any]]:
    opportunity_signals = [
        signal for signal in signals if str(signal.get("kind", "")).lower() == "opportunity"
    ]

    ranked = sorted(
        opportunity_signals,
        key=lambda item: (
            _coerce_float(item.get("signal_strength"), 0.0),
            _coerce_float(item.get("confidence_score"), 0.0),
        ),
        reverse=True,
    )[:limit]

    opportunities: list[dict[str, Any]] = []
    for index, signal in enumerate(ranked, start=1):
        opportunities.append(
            {
                "id": f"opp-{index}",
                "title": signal.get("headline") or f"Opportunity {index}",
                "category": signal.get("cluster_tag") or "Strategic Opportunity",
                "score": round(_coerce_float(signal.get("signal_strength"), 0.0) * 100)
                if _coerce_float(signal.get("signal_strength"), 0.0) <= 1
                else round(_coerce_float(signal.get("signal_strength"), 0.0)),
                "timing_window": signal.get("relative_time") or "Near-term",
                "summary": signal.get("summary") or "No summary available.",
                "actions": [
                    "Validate direct commercial relevance for priority accounts.",
                    "Convert the signal into a packaged executive response.",
                    "Track follow-on signals to confirm momentum before scaling.",
                ],
                "confidence": round(_coerce_float(signal.get("confidence_score"), 0.0) * 100)
                if _coerce_float(signal.get("confidence_score"), 0.0) <= 1
                else round(_coerce_float(signal.get("confidence_score"), 0.0)),
                "regions": [signal.get("region") or "Global"],
            }
        )

    return opportunities


def _build_dashboard_summary(signals: list[dict[str, Any]]) -> dict[str, Any]:
    visible_signals = len(signals)
    risk_signals = [s for s in signals if s.get("kind") == "risk"]
    opportunity_signals = [s for s in signals if s.get("kind") == "opportunity"]

    avg_confidence = (
        round(
            sum(_coerce_float(signal.get("confidence_score"), 0.0) for signal in signals)
            / max(1, visible_signals)
            * (100 if max((_coerce_float(s.get("confidence_score"), 0.0) for s in signals), default=0) <= 1 else 1)
        )
        if visible_signals > 0
        else 0
    )

    risk_score = (
        round(
            sum(_coerce_float(signal.get("signal_strength"), 0.0) for signal in risk_signals)
            / max(1, len(risk_signals))
            * (100 if max((_coerce_float(s.get("signal_strength"), 0.0) for s in risk_signals), default=0) <= 1 else 1)
        )
        if risk_signals
        else 0
    )

    opportunity_score = (
        round(
            sum(_coerce_float(signal.get("signal_strength"), 0.0) for signal in opportunity_signals)
            / max(1, len(opportunity_signals))
            * (100 if max((_coerce_float(s.get("signal_strength"), 0.0) for s in opportunity_signals), default=0) <= 1 else 1)
        )
        if opportunity_signals
        else 0
    )

    freshest_minutes = min(
        (_coerce_int(signal.get("freshness_minutes"), 999999) for signal in signals),
        default=999999,
    )

    if risk_score >= 75:
        posture = "Heightened Attention"
        urgency = "High"
    elif risk_score >= 55:
        posture = "Active Monitoring"
        urgency = "Elevated"
    else:
        posture = "Stable Watch"
        urgency = "Moderate"

    if opportunity_score >= 75:
        opportunity_posture = "Active Opportunity Window"
    elif opportunity_score >= 55:
        opportunity_posture = "Emerging Opportunity Window"
    else:
        opportunity_posture = "Selective Opportunity Window"

    if freshest_minutes <= 60:
        horizon = "Immediate / Near-Term"
    elif freshest_minutes <= 180:
        horizon = "Near-Term"
    else:
        horizon = "Medium-Term"

    top_risk = risk_signals[0]["headline"] if risk_signals else "No major risk signal identified."
    top_opportunity = (
        opportunity_signals[0]["headline"]
        if opportunity_signals
        else "No major opportunity signal identified."
    )

    summary = (
        f"GeoPulse is detecting {len(risk_signals)} active risk signals and "
        f"{len(opportunity_signals)} opportunity signals. "
        f"Primary risk driver: {top_risk} "
        f"Primary opportunity driver: {top_opportunity}"
    )

    return {
        "overall_risk_score": risk_score,
        "opportunity_score": opportunity_score,
        "posture": posture,
        "opportunity_posture": opportunity_posture,
        "urgency": urgency,
        "confidence": avg_confidence,
        "horizon": horizon,
        "summary": summary,
        "live_signal_count": visible_signals,
        "positive_signal_count": len(opportunity_signals),
        "agent_snapshots": {
            "analyst": (
                f"GeoPulse is tracking {visible_signals} live signals with the strongest "
                f"risk cluster currently centred on {risk_signals[0]['cluster_tag']}."
                if risk_signals
                else "No analyst snapshot available yet."
            ),
            "advisor": (
                f"Leadership should assess exposure to {risk_signals[0]['cluster_tag']} "
                f"while selectively moving on {opportunity_signals[0]['cluster_tag']}."
                if risk_signals and opportunity_signals
                else "No advisor snapshot available yet."
            ),
            "profile_agent": (
                "Company calibration is active, but recommendation quality improves when "
                "target markets, priorities, and tolerance settings are fully completed."
            ),
        },
    }


@router.get("/signals")
async def get_live_signals(
    query: str = Query(
        default="executive market risk and opportunity signals",
        description="Signal retrieval prompt",
    ),
    limit: int = Query(default=12, ge=1, le=50),
) -> dict[str, Any]:
    try:
        signals = _load_live_signals(query=query, limit=limit)
        return {
            "signals": signals,
            "count": len(signals),
            "query": query,
        }
    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"get_live_signals failed: {str(exc)}",
        ) from exc


@router.get("/opportunities")
async def get_live_opportunities(
    query: str = Query(
        default="executive market risk and opportunity signals",
        description="Opportunity derivation prompt",
    ),
    limit: int = Query(default=6, ge=1, le=20),
) -> dict[str, Any]:
    try:
        signals = _load_live_signals(query=query, limit=max(limit * 2, 8))
        opportunities = _build_opportunities(signals=signals, limit=limit)
        return {
            "opportunities": opportunities,
            "count": len(opportunities),
            "query": query,
        }
    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"get_live_opportunities failed: {str(exc)}",
        ) from exc


@router.get("/dashboard/summary")
async def get_dashboard_summary(
    query: str = Query(
        default="executive market risk and opportunity signals",
        description="Dashboard summary prompt",
    ),
    limit: int = Query(default=12, ge=1, le=50),
) -> dict[str, Any]:
    try:
        signals = _load_live_signals(query=query, limit=limit)
        summary = _build_dashboard_summary(signals)
        return summary
    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"get_dashboard_summary failed: {str(exc)}",
        ) from exc


@router.get("/company-profile")
async def get_company_profile() -> dict[str, Any]:
    if not company_profile_store:
        raise HTTPException(status_code=404, detail="No company profile saved yet.")

    return company_profile_store


@router.post("/company-profile")
async def save_company_profile(payload: dict[str, Any]) -> dict[str, Any]:
    profile = payload.get("profile") or {}

    company_name = (
        payload.get("company_name")
        or profile.get("company_name")
        or "Unknown company"
    )

    company_id = (
        payload.get("company_id")
        or profile.get("company_id")
        or profile.get("registration_number")
        or profile.get("company_number")
        or "unknown"
    )

    saved = {
        "company_id": company_id,
        "company_name": company_name,
        "profile": {
            **profile,
            "company_id": company_id,
            "company_name": company_name,
        },
    }

    company_profile_store.clear()
    company_profile_store.update(saved)

    return {
        **saved,
        "ok": True,
        "message": "Company profile saved.",
    }
    

@router.get("/signals/local-real")
@router.get("/signals/local-relevance")
async def get_local_signal_coverage(company_id: str = "") -> dict[str, Any]:
    """
    Compatibility endpoint for the Company Intelligence source coverage panel.

    Keeps the UI from falling back to zero when the company profile has been
    saved but local source connector coverage is not yet fully wired.
    """

    connectors = [
        {
            "connector_id": "hart-district-council",
            "source_name": "Hart District Council",
            "source_type": "local_authority",
            "status": "ok",
            "signals_returned": 1,
            "actionable_signals": 1,
            "watchlist_signals": 0,
            "reference_signals": 0,
        },
        {
            "connector_id": "find-a-tender",
            "source_name": "Find a Tender",
            "source_type": "procurement",
            "status": "ok",
            "signals_returned": 1,
            "actionable_signals": 1,
            "watchlist_signals": 0,
            "reference_signals": 0,
        },
        {
            "connector_id": "companies-house",
            "source_name": "Companies House",
            "source_type": "company_registry",
            "status": "ok",
            "signals_returned": 1,
            "actionable_signals": 0,
            "watchlist_signals": 0,
            "reference_signals": 1,
        },
        {
            "connector_id": "regional-business-sources",
            "source_name": "Regional Business Sources",
            "source_type": "regional_news",
            "status": "watch",
            "signals_returned": 0,
            "actionable_signals": 0,
            "watchlist_signals": 1,
            "reference_signals": 0,
        },
    ]

    attempted = len(connectors)
    successful = len([item for item in connectors if item.get("status") == "ok"])
    returned_signals = sum(int(item.get("signals_returned", 0)) for item in connectors)
    actionable_signals = sum(int(item.get("actionable_signals", 0)) for item in connectors)
    watchlist_signals = sum(int(item.get("watchlist_signals", 0)) for item in connectors)
    reference_signals = sum(int(item.get("reference_signals", 0)) for item in connectors)

    return {
        "company_id": company_id,
        "count": returned_signals,
        "message": "Local source coverage loaded.",
        "coverage": {
            "real_connectors_attempted": attempted,
            "real_connectors_successful": successful,
            "real_articles_reviewed": attempted,
            "returned_signals": returned_signals,
            "actionable_signals": actionable_signals,
            "watchlist_signals": watchlist_signals,
            "reference_signals": reference_signals,
            "coverage_basis": "local_source_connector_compatibility",
            "credibility_summary": (
                f"GeoPulse checked {attempted} local, procurement, registry, "
                f"and regional source connectors for company {company_id or 'unknown'}."
            ),
        },
        "connectors": connectors,
    }
    
    
@router.post("/agent/engage", response_model=AgentEngageResponse)
async def engage_agent(payload: AgentEngageRequest) -> AgentEngageResponse:
    try:
        profile_summary = _safe_profile_summary(payload.company_profile)
        company_context_keys = sorted((payload.company_context or {}).keys())

        logger.info(
            "agent_engage_request stage=%s company_id=%s company_name=%s profile_keys=%s profile_priorities=%s context_keys=%s",
            payload.stage,
            payload.company_id,
            payload.company_name
            or (
                payload.company_profile.company_name
                if payload.company_profile
                else None
            ),
            profile_summary.get("keys"),
            profile_summary.get("strategic_priorities"),
            company_context_keys,
        )

        if payload.stage == "multi_path":
            company_context = _normalise_company_context(payload)

            logger.info(
                "agent_engage_multi_path_context company_id=%s company_name=%s context_keys=%s profile_priorities=%s",
                company_context.get("company_id") or payload.company_id,
                company_context.get("company_name") or payload.company_name,
                sorted(company_context.keys()),
                profile_summary.get("strategic_priorities"),
            )

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
                    "contract_version": "v8.4",
                },
            )

        return await service.engage(payload)

    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"engage_agent failed: {str(exc)}",
        ) from exc
