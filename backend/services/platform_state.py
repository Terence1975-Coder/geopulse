from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

from backend.intel.schemas import (
    ChainOutputs,
    CompanyProfile,
    DashboardSummary,
    ExplanationPayload,
    GovernanceSettings,
    PersistedPlatformState,
    PlatformConfig,
    SupportingSignalReference,
)

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
STATE_FILE = DATA_DIR / "platform_state.json"


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class PlatformStateStore:
    def __init__(self) -> None:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        if not STATE_FILE.exists():
            self.save_state(PersistedPlatformState())

    def load_state(self) -> PersistedPlatformState:
        try:
            payload = json.loads(STATE_FILE.read_text(encoding="utf-8"))
            return PersistedPlatformState.model_validate(payload)
        except Exception:
            state = PersistedPlatformState()
            self.save_state(state)
            return state

    def save_state(self, state: PersistedPlatformState) -> PersistedPlatformState:
        state.updated_at = utc_now_iso()
        STATE_FILE.write_text(
            json.dumps(state.model_dump(mode="json"), indent=2),
            encoding="utf-8",
        )
        return state

    def save_company_profile(self, profile: CompanyProfile) -> CompanyProfile:
        state = self.load_state()
        state.company_profile = profile
        self.save_state(state)
        return state.company_profile

    def save_config(self, config: PlatformConfig) -> PlatformConfig:
        state = self.load_state()
        state.config = config
        self.save_state(state)
        return state.config

    def save_governance(self, governance: GovernanceSettings) -> GovernanceSettings:
        state = self.load_state()
        state.governance = governance
        self.save_state(state)
        return state.governance

    def save_latest_chain(
        self,
        chain_outputs: ChainOutputs,
        latest_chain_response: Dict[str, Any],
        company_profile: CompanyProfile | None = None,
    ) -> PersistedPlatformState:
        state = self.load_state()
        state.latest_chain_outputs = chain_outputs
        state.latest_chain_response = latest_chain_response
        if company_profile:
            state.company_profile = company_profile
        return self.save_state(state)


def _try_load_live_signals(limit: int = 24) -> List[Dict[str, Any]]:
    try:
        from backend.services.signal_ingestion import get_latest_signals  # type: ignore

        try:
            result = get_latest_signals(limit=limit, auto_refresh=True)
        except TypeError:
            result = get_latest_signals(limit=limit)

        if isinstance(result, tuple):
            raw_signals = result[0]
        else:
            raw_signals = result

        return raw_signals or []
    except Exception:
        return []


def normalise_signal(raw: Dict[str, Any]) -> Dict[str, Any]:
    confidence = raw.get("confidence")
    if confidence is None:
        confidence = raw.get("confidence_score", 0)

    if isinstance(confidence, float) and confidence <= 1:
        confidence_pct = round(confidence * 100)
    else:
        confidence_pct = round(float(confidence or 0))

    return {
        "id": str(raw.get("id", "")),
        "headline": raw.get("headline", raw.get("title", "Untitled signal")),
        "summary": raw.get("summary", raw.get("description", "")),
        "source": raw.get("source", "Unknown source"),
        "region": raw.get("region"),
        "cluster_tag": raw.get("cluster_tag", raw.get("cluster", "General")),
        "kind": raw.get("kind", "risk"),
        "severity": raw.get("severity", "medium"),
        "confidence": confidence_pct,
        "confidence_score": round(confidence_pct / 100, 2),
        "freshness_label": raw.get("freshness_label", raw.get("relative_time", "Unknown")),
        "updated_at": raw.get("updated_at"),
        "detected_at": raw.get("detected_at"),
        "timestamp": raw.get("timestamp"),
        "relative_time": raw.get("relative_time"),
        "lifecycle": raw.get("lifecycle"),
        "freshness_minutes": raw.get("freshness_minutes"),
    }


def get_live_signals(limit: int = 24) -> List[Dict[str, Any]]:
    raw = _try_load_live_signals(limit=limit)
    return [normalise_signal(item) for item in raw]


def derive_opportunities(signals: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    opportunity_signals = [signal for signal in signals if signal.get("kind") == "opportunity"]
    ranked = sorted(
        opportunity_signals,
        key=lambda item: (item.get("confidence", 0), item.get("freshness_minutes") or 999999),
        reverse=True,
    )
    return [
        {
            "title": signal.get("headline", "Untitled opportunity"),
            "summary": signal.get("summary", ""),
            "score": int(signal.get("confidence", 0)),
            "horizon": "Short-term" if (signal.get("freshness_minutes") or 999999) <= 360 else "Medium-term",
        }
        for signal in ranked[:6]
    ]


def _to_supporting_refs(signals: List[Dict[str, Any]]) -> List[SupportingSignalReference]:
    refs: List[SupportingSignalReference] = []
    for signal in signals[:4]:
        refs.append(
            SupportingSignalReference(
                id=str(signal.get("id", "")),
                headline=str(signal.get("headline", "")),
                source=str(signal.get("source", "")),
                region=signal.get("region"),
                kind=signal.get("kind"),
                cluster_tag=signal.get("cluster_tag"),
                confidence_score=float(signal.get("confidence_score", 0.0)),
                relative_time=signal.get("relative_time") or signal.get("freshness_label"),
                lifecycle=signal.get("lifecycle"),
                freshness_minutes=signal.get("freshness_minutes"),
            )
        )
    return refs


def _derive_posture(score: int) -> str:
    if score >= 80:
        return "High Alert"
    if score >= 65:
        return "Heightened Attention"
    if score >= 45:
        return "Active Monitoring"
    return "Baseline Monitoring"


def _derive_opportunity_posture(score: int) -> str:
    if score >= 80:
        return "Targeted Upside"
    if score >= 65:
        return "Actionable Window"
    if score >= 45:
        return "Emerging Opportunity"
    return "Watchlist"


def _derive_horizon(signals: List[Dict[str, Any]]) -> str:
    if not signals:
        return "Unknown"
    freshest = min((signal.get("freshness_minutes") or 999999) for signal in signals)
    if freshest < 60:
        return "Immediate"
    if freshest <= 360:
        return "Short-term"
    return "Medium-term"


def derive_dashboard_summary(
    signals: List[Dict[str, Any]],
    state: PersistedPlatformState,
) -> DashboardSummary:
    risk_signals = [s for s in signals if s.get("kind") != "opportunity"]
    opportunity_signals = [s for s in signals if s.get("kind") == "opportunity"]

    risk_score = round(
        sum(int(signal.get("confidence", 0)) for signal in risk_signals[:6]) / max(1, min(len(risk_signals), 6))
    ) if risk_signals else 0
    opportunity_score = round(
        sum(int(signal.get("confidence", 0)) for signal in opportunity_signals[:6]) / max(1, min(len(opportunity_signals), 6))
    ) if opportunity_signals else 0

    blended_confidence = round(
        sum(int(signal.get("confidence", 0)) for signal in signals[:8]) / max(1, min(len(signals), 8))
    ) if signals else 0

    horizon = _derive_horizon(signals)
    urgency = "Immediate attention" if horizon == "Immediate" else "Active monitoring"

    analyst_snapshot = (
        state.latest_chain_outputs.analyse.key_insight
        if state.latest_chain_outputs and state.latest_chain_outputs.analyse
        else "No analyst snapshot available yet."
    )
    advisor_snapshot = (
        state.latest_chain_outputs.advise.key_insight
        if state.latest_chain_outputs and state.latest_chain_outputs.advise
        else "No advisor snapshot available yet."
    )
    profile_snapshot = (
        state.latest_chain_outputs.profile.key_insight
        if state.latest_chain_outputs and state.latest_chain_outputs.profile
        else (
            f"GeoPulse is calibrated around: {', '.join(state.company_profile.strategic_priorities)}."
            if state.company_profile and state.company_profile.strategic_priorities
            else "No profile agent snapshot available yet."
        )
    )

    risk_explanation = ExplanationPayload(
        title="Risk Posture",
        tone="risk",
        score=risk_score,
        posture=_derive_posture(risk_score),
        confidence=blended_confidence,
        horizon=horizon,
        urgency=urgency,
        drivers=[signal.get("headline", "") for signal in risk_signals[:3]] or [
            "No live risk drivers available yet."
        ],
        notes=[
            "Derived from current negative or non-opportunity signals.",
            "Confidence reflects the average strength of recent live signals.",
            "This explanation is now backend-generated rather than UI-guessed.",
        ],
        supporting_signals=_to_supporting_refs(risk_signals),
    )

    opportunity_explanation = ExplanationPayload(
        title="Opportunity Posture",
        tone="opportunity",
        score=opportunity_score,
        posture=_derive_opportunity_posture(opportunity_score),
        confidence=blended_confidence,
        horizon=horizon,
        urgency=f"Positive signals {len(opportunity_signals)}",
        drivers=[signal.get("headline", "") for signal in opportunity_signals[:3]] or [
            "No live opportunity drivers available yet."
        ],
        notes=[
            "Derived from current opportunity-classified live signals.",
            "Higher signal strength raises opportunity confidence.",
            "This explanation is now backend-generated rather than UI-guessed.",
        ],
        supporting_signals=_to_supporting_refs(opportunity_signals),
    )

    profile_name = state.company_profile.company_name or "this company"
    summary = (
        f"GeoPulse is detecting {len(signals)} active live signals shaping current executive posture for {profile_name}. "
        f"Risk posture is {_derive_posture(risk_score)}, opportunity posture is {_derive_opportunity_posture(opportunity_score)}, "
        f"and the current horizon is {horizon.lower()}."
        if signals
        else "No live executive summary is available yet. GeoPulse is ready to use saved company calibration and fallback demo context."
    )

    return DashboardSummary(
        overall_risk_score=risk_score,
        opportunity_score=opportunity_score,
        posture=_derive_posture(risk_score),
        opportunity_posture=_derive_opportunity_posture(opportunity_score),
        urgency=urgency,
        confidence=blended_confidence,
        horizon=horizon,
        summary=summary,
        live_signal_count=len(signals),
        positive_signal_count=len(opportunity_signals),
        agent_snapshots={
            "analyst": analyst_snapshot,
            "advisor": advisor_snapshot,
            "profile_agent": profile_snapshot,
        },
        risk_explanation=risk_explanation,
        opportunity_explanation=opportunity_explanation,
        source_mode="live" if signals else "fallback",
    )