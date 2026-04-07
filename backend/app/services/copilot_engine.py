from app.models import CopilotDiscussResponse
from app.services.agent_selector import select_agents

def run_copilot_discussion(payload,event,analysis,company_profile,dashboard,memory):

    agents = select_agents(
        payload.question,
        event,
        payload.scenario_input,
        company_profile
    )

    top = sorted(dashboard.categories,key=lambda x:x.score,reverse=True)[0]

    answer = (
        f"Current dominant pressure channel is {top.name} at score {top.score}. "
        f"Executive attention should prioritise exposure containment and timing of strategic moves."
    )

    return CopilotDiscussResponse(
        title="GeoPulse Copilot",
        answer=answer,
        structured_insights=[
            "Risk concentration detected",
            "Transmission speed may increase",
            "Scenario sensitivity elevated"
        ],
        recommended_actions=[
            "Run scenario tests",
            "Stress supplier network",
            "Brief leadership team"
        ],
        contributing_agents=agents,
        recent_risk_concern=top.name
    )