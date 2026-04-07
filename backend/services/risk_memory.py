from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timezone
from typing import Dict, List

from models.dashboard import RiskSnapshot
from models.events import EventItem
from storage.state import STATE


class RiskMemoryEngine:
    def calculate_category_scores(self, events: List[EventItem]) -> Dict[str, int]:
        buckets: Dict[str, List[int]] = defaultdict(list)

        for event in events:
            buckets[event.category].append(event.severity)

        scores: Dict[str, int] = {}
        for category, values in buckets.items():
            scores[category] = min(100, int(sum(values) / len(values)))

        return dict(scores)

    def calculate_posture(self, overall_risk: int) -> str:
        if overall_risk >= 80:
            return "critical"
        if overall_risk >= 65:
            return "high alert"
        if overall_risk >= 45:
            return "elevated"
        if overall_risk >= 25:
            return "guarded"
        return "stable"

    def calculate_momentum(self, current: int, previous: int) -> str:
        delta = current - previous
        if delta >= 8:
            return "rising sharply"
        if delta >= 3:
            return "rising"
        if delta <= -8:
            return "falling sharply"
        if delta <= -3:
            return "falling"
        return "stable"

    def create_snapshot(self) -> RiskSnapshot:
        events = list(STATE.events.values())

        if events:
            overall_risk = min(100, int(sum(e.severity for e in events) / len(events)))
        else:
            overall_risk = 0

        category_scores = self.calculate_category_scores(events)

        company_adjusted_score = min(
            100,
            overall_risk + self._company_adjustment()
        )

        posture = self.calculate_posture(overall_risk)

        top_clusters = [
            c.label
            for c in sorted(
                STATE.clusters.values(),
                key=lambda x: x.confidence,
                reverse=True
            )[:3]
        ]

        previous_score = (
            int(STATE.risk_history[-1].overall_risk_score)
            if STATE.risk_history
            else overall_risk
        )

        momentum = self.calculate_momentum(overall_risk, previous_score)

        snapshot = RiskSnapshot(
            overall_risk_score=float(overall_risk),
            company_adjusted_score=float(company_adjusted_score),
            posture=posture,
            category_scores=category_scores,
            top_clusters=top_clusters,
            urgency="medium",
            confidence=70.0,
            horizon="30-day",
            contributing_agents=[],
            momentum=momentum,
            timestamp=datetime.now(timezone.utc),
        )

        STATE.risk_history.append(snapshot)
        return snapshot

    def _company_adjustment(self) -> int:
        profile = STATE.company_profile
        energy = int(profile.get("energy_dependency_level", 50))
        trade = int(profile.get("import_export_exposure", 50))
        leverage = int(profile.get("financial_leverage_sensitivity", 50))
        return int((energy + trade + leverage) / 30)

    def get_trends(self) -> Dict[str, object]:
        if not STATE.risk_history:
            snap = self.create_snapshot()
            return {
                "current_overall_risk": snap.overall_risk_score,
                "previous_overall_risk": snap.overall_risk_score,
                "delta": 0,
                "momentum": snap.momentum,
                "posture": snap.posture,
                "snapshots": STATE.risk_history,
            }

        current = STATE.risk_history[-1]
        previous = STATE.risk_history[-2] if len(STATE.risk_history) > 1 else current
        delta = current.overall_risk_score - previous.overall_risk_score

        return {
            "current_overall_risk": current.overall_risk_score,
            "previous_overall_risk": previous.overall_risk_score,
            "delta": delta,
            "momentum": current.momentum,
            "posture": current.posture,
            "snapshots": STATE.risk_history[-20:],
        }