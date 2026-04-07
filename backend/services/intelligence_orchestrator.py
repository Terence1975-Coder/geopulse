from __future__ import annotations

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
        # rebuild clusters
        self.cluster_engine.rebuild_clusters()

        events = list(STATE.events.values())

        # run agents
        for event in events:
            self.agent_engine.analyse_event(event)

        snapshot = self.risk_memory.create_snapshot()
        narrative = self.agent_engine.synthesise_dashboard_narrative(events)
        opportunity = analyse_opportunities(events)

        # 🔴 CRITICAL FIX — convert agent objects to dicts
        contributing_agents = []
        for agent in narrative.get("contributing_agents", []):
            if hasattr(agent, "model_dump"):
                contributing_agents.append(agent.model_dump())
            elif hasattr(agent, "dict"):
                contributing_agents.append(agent.dict())
            elif isinstance(agent, dict):
                contributing_agents.append(agent)
            else:
                contributing_agents.append(vars(agent))

        return DashboardResponse(
            overall_risk_score=snapshot.overall_risk_score,
            company_adjusted_score=snapshot.company_adjusted_score,
            posture=snapshot.posture,
            summary=narrative["summary"],
            category_scores=snapshot.category_scores,
            top_clusters=snapshot.top_clusters,
            urgency=narrative["urgency"],
            confidence=narrative["confidence"],
            horizon=narrative["horizon"],
            contributing_agents=contributing_agents,
            momentum=snapshot.momentum,
            opportunity_score=opportunity["opportunity_score"],
            opportunity_posture=opportunity["opportunity_posture"],
            opportunity_category_scores=opportunity["opportunity_category_scores"],
            top_opportunity_clusters=opportunity["top_opportunity_clusters"],
            opportunity_highlights=opportunity["opportunity_highlights"],
            updated_at=snapshot.timestamp,
        )