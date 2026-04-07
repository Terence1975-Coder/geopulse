from app.models import ScenarioSimulationResponse, CategoryScore

def simulate_scenario(payload,base_dashboard,company_profile):

    deltas=[]
    projected=[]

    for c in base_dashboard.categories:
        d = int(payload.severity/5)
        new=min(98,c.score+d)

        deltas.append(
            CategoryScore(
                name=c.name,
                score=new,
                delta=new-c.score,
                explanation="Scenario pressure applied"
            )
        )
        projected.append(new)

    overall=round(sum(projected)/len(projected))

    posture="Stable"
    if overall>75: posture="Critical"
    elif overall>60: posture="Elevated"
    elif overall>45: posture="Guarded"

    return ScenarioSimulationResponse(
        scenario_title=payload.title,
        projected_dashboard_risk=overall,
        projected_posture=posture,
        category_deltas=deltas,
        narrative_explanation="Scenario increases systemic pressure pathways",
        recommended_executive_actions=[
            "Activate contingency planning",
            "Increase monitoring cadence",
            "Re-prioritise capital deployment"
        ]
    )