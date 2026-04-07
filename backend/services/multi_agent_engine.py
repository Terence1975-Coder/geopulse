from __future__ import annotations

from typing import List, Dict

from models.events import EventItem, AgentContribution


class MultiAgentIntelligenceEngine:
    def _political_agent(self, event: EventItem) -> AgentContribution | None:
        if event.category not in {"political", "regulatory"} and "election" not in " ".join(event.tags).lower():
            return None
        return AgentContribution(
            agent="Political Risk Analyst",
            reason="The event has government, sanctions, election, or policy implications.",
            perspective_tags=["political", "policy", "regulation"],
            insight_points=[
                "Policy instability may alter market sentiment and cross-border operating conditions.",
                "Escalation in political uncertainty can transmit into compliance cost and investment hesitation.",
            ],
            executive_implications=[
                "Board-level monitoring may be required for jurisdiction exposure.",
                "Supplier and customer commitments in exposed regions may need review.",
            ],
            recommended_actions=[
                "Review region-specific exposure and contingency plans.",
                "Track regulatory updates and scenario triggers.",
            ],
        )

    def _energy_agent(self, event: EventItem) -> AgentContribution | None:
        haystack = f"{event.headline} {event.body} {' '.join(event.tags)}".lower()
        if event.category != "energy" and not any(k in haystack for k in ["oil", "gas", "power", "energy", "brent"]):
            return None
        return AgentContribution(
            agent="Energy Markets Analyst",
            reason="The event affects energy input pricing, volatility, or power cost outlook.",
            perspective_tags=["energy", "cost pressure", "volatility"],
            insight_points=[
                "Energy price volatility can quickly affect operating margins.",
                "Secondary effects may include transport inflation and supplier repricing.",
            ],
            executive_implications=[
                "Energy-intensive operations may experience short-horizon margin compression.",
                "Procurement decisions may benefit from shorter review cycles.",
            ],
            recommended_actions=[
                "Stress-test margin assumptions against higher energy prices.",
                "Identify contracts with energy-linked pass-through exposure.",
            ],
        )

    def _supply_chain_agent(self, event: EventItem) -> AgentContribution | None:
        haystack = f"{event.headline} {event.body} {' '.join(event.tags)}".lower()
        if event.category != "supply_chain" and not any(k in haystack for k in ["shipping", "port", "freight", "logistics", "supply chain"]):
            return None
        return AgentContribution(
            agent="Supply Chain Strategist",
            reason="The event affects logistics reliability, shipping flow, or supplier continuity.",
            perspective_tags=["logistics", "supply chain", "fulfilment"],
            insight_points=[
                "Disruption in ports or shipping lanes can increase lead times and working capital pressure.",
                "Second-order effects may show up before direct supplier outage is visible.",
            ],
            executive_implications=[
                "Customer service levels may suffer if buffer inventory is thin.",
                "Inbound component availability could become more volatile.",
            ],
            recommended_actions=[
                "Review critical supplier concentration and shipping route dependency.",
                "Increase visibility on lead times and alternate fulfilment options.",
            ],
        )

    def _macro_agent(self, event: EventItem) -> AgentContribution | None:
        if event.category not in {"macroeconomic", "energy", "political", "supply_chain"}:
            return None
        return AgentContribution(
            agent="Macroeconomic Analyst",
            reason="The event may influence inflation, growth, currency, or market pricing conditions.",
            perspective_tags=["inflation", "growth", "market impact"],
            insight_points=[
                "External shocks often transmit into pricing, financing conditions, and consumer demand.",
                "Repeated correlated shocks may indicate broader macro stress rather than isolated noise.",
            ],
            executive_implications=[
                "Budget assumptions may need revision if trend persistence increases.",
                "Imported cost volatility may affect pricing decisions.",
            ],
            recommended_actions=[
                "Monitor cost inflation and pricing response options.",
                "Run near-term downside scenarios for demand and financing sensitivity.",
            ],
        )

    def _resilience_agent(self, event: EventItem) -> AgentContribution:
        return AgentContribution(
            agent="Corporate Resilience Advisor",
            reason="Every major event benefits from an operational resilience and decision-readiness lens.",
            perspective_tags=["resilience", "decision support", "continuity"],
            insight_points=[
                "The relevance of this event depends on concentration of exposure and speed of escalation.",
                "Decision quality improves when signals are converted into threshold-led actions.",
            ],
            executive_implications=[
                "Leadership teams should align trigger thresholds, owners, and response timelines.",
            ],
            recommended_actions=[
                "Assign an owner and response trigger for this risk.",
                "Document immediate, 30-day, and strategic response options.",
            ],
        )

    def analyse_event(self, event: EventItem) -> EventItem:
        contributions: List[AgentContribution] = []

        for fn in [
            self._political_agent,
            self._energy_agent,
            self._supply_chain_agent,
            self._macro_agent,
        ]:
            result = fn(event)
            if result:
                contributions.append(result)

        contributions.append(self._resilience_agent(event))

        event.agent_contributions = contributions
        event.recommended_actions = list({
            action
            for contribution in contributions
            for action in contribution.recommended_actions
        })
        event.executive_summary = self._build_summary(event, contributions)
        return event

    def _build_summary(self, event: EventItem, contributions: List[AgentContribution]) -> str:
        agent_names = ", ".join(c.agent for c in contributions[:3])
        return (
            f"{event.headline} is being treated as a {event.urgency} urgency {event.category} development "
            f"with a {event.horizon} horizon. Contributing perspectives include {agent_names}. "
            f"The current view is that this event may influence operating cost, continuity, and executive decision timing."
        )

    def synthesise_dashboard_narrative(self, events: List[EventItem]) -> Dict[str, object]:
        if not events:
            return {
                "summary": "No major active risk events are currently being tracked.",
                "contributing_agents": [],
                "urgency": "low",
                "confidence": 50,
                "horizon": "30-day",
            }

        analysed = [self.analyse_event(event) for event in events]
        top = sorted(analysed, key=lambda e: (e.severity, e.confidence), reverse=True)[:5]

        all_contributions = []
        for event in top:
            all_contributions.extend(event.agent_contributions)

        urgency_rank = {"low": 1, "medium": 2, "high": 3, "critical": 4}
        top_urgency = max((e.urgency for e in top), key=lambda x: urgency_rank.get(x, 1))
        avg_conf = int(sum(e.confidence for e in top) / len(top))
        horizon = "immediate" if any(e.horizon == "immediate" for e in top) else "30-day"

        summary = (
            f"GeoPulse is detecting an active external risk picture shaped by {len(top)} leading developments. "
            f"The highest priority themes indicate pressure across cost, continuity, and executive monitoring. "
            f"Risk interpretation has been enriched by multiple specialist agents to improve action relevance."
        )

        unique_agents = {}
        for c in all_contributions:
            unique_agents[c.agent] = c

        return {
            "summary": summary,
            "contributing_agents": list(unique_agents.values()),
            "urgency": top_urgency,
            "confidence": avg_conf,
            "horizon": horizon,
        }