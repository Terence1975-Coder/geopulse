from __future__ import annotations

from typing import Any, Dict, List, Tuple


def _risk_posture(score: int) -> str:
    if score >= 80:
        return "High Alert"
    if score >= 65:
        return "Heightened Attention"
    if score >= 45:
        return "Company-Adjusted Monitoring"
    return "Stable Monitoring"


def _opportunity_posture(score: int) -> str:
    if score >= 75:
        return "Action Window Open"
    if score >= 60:
        return "Favourable Momentum"
    if score >= 40:
        return "Emerging Opportunity"
    return "Limited Near-Term Opening"


def _urgency_from_signals(signals: List[Dict[str, Any]]) -> str:
    if any((s.get("severity") == "high" and s.get("freshness_minutes", 9999) < 60) for s in signals):
        return "Immediate"
    if any((s.get("severity") in {"high", "medium"} and s.get("freshness_minutes", 9999) <= 360) for s in signals):
        return "Near-Term"
    return "Monitor"


def _horizon_from_signals(signals: List[Dict[str, Any]]) -> str:
    if any(s.get("freshness_minutes", 9999) < 60 for s in signals):
        return "Immediate"
    if any(s.get("freshness_minutes", 9999) <= 360 for s in signals):
        return "Short-term"
    return "Medium-term"


def _build_risk_explanations(risk_signals: List[Dict[str, Any]]) -> List[str]:
    explanations: List[str] = []

    if any("energy" in str(s.get("cluster_tag", "")).lower() for s in risk_signals):
        explanations.append("Energy-linked pressure is appearing across active signals with material executive relevance.")

    if any("supply" in str(s.get("cluster_tag", "")).lower() for s in risk_signals):
        explanations.append("Supply chain disruption indicators remain elevated, increasing continuity and delivery risk.")

    if any("regulatory" in str(s.get("cluster_tag", "")).lower() for s in risk_signals):
        explanations.append("Regulatory and compliance pressure is increasing the need for board-defensible response planning.")

    if not explanations and risk_signals:
        explanations.append("Multiple active risk signals are clustering around cost, continuity, and executive visibility.")

    return explanations[:3]


def _build_opportunity_explanations(opportunity_signals: List[Dict[str, Any]]) -> List[str]:
    explanations: List[str] = []

    if any("resilience" in str(s.get("cluster_tag", "")).lower() for s in opportunity_signals):
        explanations.append("Resilience demand is rising, creating room for higher-value advisory and implementation offers.")

    if any("timing" in str(s.get("cluster_tag", "")).lower() for s in opportunity_signals):
        explanations.append("Market timing conditions suggest a nearer-term commercial opening rather than a distant watch item.")

    if any("competitor" in str(s.get("summary", "")).lower() for s in opportunity_signals):
        explanations.append("Competitor weakness signals are improving the odds of differentiated offer capture.")

    if not explanations and opportunity_signals:
        explanations.append("Positive signals are aligning around demand, timing, and commercial response readiness.")

    return explanations[:3]


def build_dashboard_summary(signals: List[Dict[str, Any]]) -> Dict[str, Any]:
    risk_signals = [s for s in signals if s.get("kind") == "risk"]
    opportunity_signals = [s for s in signals if s.get("kind") == "opportunity"]

    risk_score_float = sum(
        float(s.get("signal_strength", 0.0)) * 100 for s in risk_signals[:5]
    ) / max(1, min(len(risk_signals), 5))

    opportunity_score_float = sum(
        float(s.get("signal_strength", 0.0)) * 100 for s in opportunity_signals[:5]
    ) / max(1, min(len(opportunity_signals), 5))

    risk_score = int(round(risk_score_float)) if risk_signals else 28
    opportunity_score = int(round(opportunity_score_float)) if opportunity_signals else 24

    avg_confidence = int(
        round(
            (
                sum(float(s.get("confidence_score", 0.0)) for s in signals) / max(1, len(signals))
            )
            * 100
        )
    )

    risk_explanations = _build_risk_explanations(risk_signals)
    opportunity_explanations = _build_opportunity_explanations(opportunity_signals)

    risk_supporting_signal_ids = [s["id"] for s in risk_signals[:3]]
    opportunity_supporting_signal_ids = [s["id"] for s in opportunity_signals[:3]]

    posture = _risk_posture(risk_score)
    opportunity_posture = _opportunity_posture(opportunity_score)
    urgency = _urgency_from_signals(signals)
    horizon = _horizon_from_signals(signals)

    summary = (
        "GeoPulse is detecting an active external picture shaped by current risk pressure "
        "alongside credible opportunity openings. The leading implications centre on cost, "
        "continuity, resilience demand, and timing-sensitive commercial response."
    )

    return {
        "overall_risk_score": risk_score,
        "risk_score": risk_score,
        "risk_explanation": risk_explanations,
        "risk_supporting_signal_ids": risk_supporting_signal_ids,
        "opportunity_score": opportunity_score,
        "opportunity_explanation": opportunity_explanations,
        "opportunity_supporting_signal_ids": opportunity_supporting_signal_ids,
        "company_adjusted_score": risk_score,
        "posture": posture,
        "opportunity_posture": opportunity_posture,
        "urgency": urgency,
        "confidence": avg_confidence,
        "horizon": horizon,
        "summary": summary,
        "live_signal_count": len(signals),
        "positive_signal_count": len(opportunity_signals),
        "agent_snapshots": {
            "analyst": "Current signal clustering points to heightened attention across continuity, cost, and resilience demand.",
            "advisor": "Management should prioritise board-defensible actions that protect downside while testing near-term commercial upside.",
            "profile_agent": "Best fit will come from aligning signals to company-specific margin sensitivity, operating exposure, and strategic priorities.",
        },
    }