from __future__ import annotations
print("DEBUG: LOADED services/intelligence_orchestrator.py")

from intelligence.opportunity_engine import analyse_opportunities
from models.dashboard import DashboardResponse
from services.event_clustering import EventClusteringEngine
from services.multi_agent_engine import MultiAgentIntelligenceEngine
from services.risk_memory import RiskMemoryEngine
from storage.state import STATE


class IntelligenceOrchestrator:
    def __init__(self) -> None:
        self.cluster_engine = EventClusteringEngine()
        self.risk_memory = RiskMemoryEngine()
        self.agent_engine = MultiAgentIntelligenceEngine()

    def refresh(self) -> DashboardResponse:
        print("DEBUG: RUNNING refresh() from services/intelligence_orchestrator.py")
        self.cluster_engine.rebuild_importclusters()

        events = list(STATE.events.values())

        for event in events:
            self.agent_engine.analyse_event(event)

        snapshot = self.risk_memory.create_snapshot()
        narrative = self.agent_engine.synthesise_dashboard_narrative(events)
        opportunity = analyse_opportunities(events)

        return DashboardResponse(
            overall_risk_score=snapshot.overall_risk,
            company_adjusted_score=snapshot.company_adjusted_score,
            posture=snapshot.posture,

            opportunity_score=opportunity["opportunity_score"],
            opportunity_posture=opportunity["opportunity_posture"],
            opportunity_category_scores=opportunity["opportunity_category_scores"],
            top_opportunity_clusters=opportunity["top_opportunity_clusters"],
            opportunity_highlights=opportunity["opportunity_highlights"],

            summary=narrative["summary"],
            category_scores=snapshot.category_breakdown,
            top_clusters=snapshot.top_active_clusters,

            urgency=narrative["urgency"],
            confidence=narrative["confidence"],
            horizon=narrative["horizon"],
            contributing_agents=narrative["contributing_agents"],

            momentum=snapshot.momentum,
            updated_at=snapshot.timestamp,
        )