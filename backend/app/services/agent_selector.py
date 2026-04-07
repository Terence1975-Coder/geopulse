from app.models import AgentReference

AGENTS = {
    "Geopolitical Strategist":"conflict & escalation expert",
    "Energy Market Analyst":"energy price transmission expert",
    "Supply Chain Specialist":"logistics disruption modeller",
    "Macroeconomist":"inflation & growth transmission expert",
    "Financial Risk Manager":"volatility & liquidity expert",
    "Corporate Strategy Consultant":"board level decision advisor",
}

def select_agents(question,event,scenario_input,company_profile):

    text=(question or "").lower()

    chosen=["Corporate Strategy Consultant"]

    if "oil" in text or "energy" in text:
        chosen.append("Energy Market Analyst")

    if "shipping" in text or "port" in text:
        chosen.append("Supply Chain Specialist")

    if "inflation" in text:
        chosen.append("Macroeconomist")

    if "war" in text or "conflict" in text:
        chosen.append("Geopolitical Strategist")

    return [AgentReference(name=a,reason=AGENTS[a]) for a in chosen]