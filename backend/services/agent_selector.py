from typing import List, Dict, Any
from app.models import AgentReference

AGENTS = {
    "Geopolitical Strategist": "expert in conflict risk interpretation and regional escalation patterns",
    "Energy Market Analyst": "expert in energy pricing, supply tightness, and transmission into business costs",
    "Supply Chain Specialist": "expert in logistics disruption modelling and route dependency analysis",
    "Macroeconomist": "expert in inflation transmission, growth drag, and second-order effects",
    "Financial Risk Manager": "expert in liquidity pressure, volatility exposure, and hedge posture",
    "Industry Sector Advisor": "expert in sector-specific commercial sensitivity and operating model impacts",
    "Corporate Strategy Consultant": "expert in board-level response options, prioritisation, and strategic posture",
}


def select_agents(question: str, event: Dict[str, Any] | None, scenario_input: Dict[str, Any] | None, company_profile: Dict[str, Any] | None) -> List[AgentReference]:
    text = " ".join(
        [
            question or "",
            event["headline"] if event else "",
            event["body"] if event else "",
            str(scenario_input or ""),
            str(company_profile or ""),
        ]
    ).lower()

    chosen = []

    def add(agent_name: str):
        if agent_name not in [a.name for a in chosen]:
            chosen.append(AgentReference(name=agent_name, reason=AGENTS[agent_name]))

    add("Corporate Strategy Consultant")
    add("Industry Sector Advisor")

    if any(k in text for k in ["conflict", "war", "election", "sanction", "geopolitical", "region"]):
        add("Geopolitical Strategist")
    if any(k in text for k in ["oil", "gas", "energy", "fuel", "electricity"]):
        add("Energy Market Analyst")
    if any(k in text for k in ["port", "shipping", "freight", "supplier", "logistics", "container"]):
        add("Supply Chain Specialist")
    if any(k in text for k in ["inflation", "prices", "cost", "consumer", "demand", "rates"]):
        add("Macroeconomist")
    if any(k in text for k in ["volatility", "liquidity", "fx", "currency", "hedge", "capital", "debt"]):
        add("Financial Risk Manager")

    return chosen[:4]