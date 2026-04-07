from typing import Dict, Any, List, Optional
from app.models import EventAnalysis, CategoryScore, DashboardResponse
from app.services.company_profile_engine import apply_company_adjustment

CATEGORY_KEYWORDS = {
    "Energy Risk": ["oil","gas","energy","pipeline","fuel","power"],
    "Supply Chain Risk": ["port","shipping","freight","logistics","route","container"],
    "Inflation Risk": ["inflation","prices","cost","commodity","wage"],
    "Market Volatility": ["market","stocks","currency","bond","fx","volatility"],
}

def analyze_event(event: Dict[str, Any]) -> EventAnalysis:
    text = (event["headline"] + " " + event["body"]).lower()

    categories = []
    for cat, words in CATEGORY_KEYWORDS.items():
        score = 30 + sum(10 for w in words if w in text)
        categories.append(
            CategoryScore(
                name=cat,
                score=min(score,90),
                explanation=f"{cat} triggered by keyword pattern"
            )
        )

    severity = round(sum(c.score for c in categories)/len(categories))
    momentum = min(95, severity + 5)

    return EventAnalysis(
        event_id=event["id"],
        summary="Event may influence multiple business risk channels.",
        severity=severity,
        momentum=momentum,
        categories=categories,
        recommended_actions=["Review exposure","Monitor escalation","Prepare contingency"],
        related_tags=[]
    )


def build_dashboard(events, analyses, signals, company_profile: Optional[Dict], view:str) -> DashboardResponse:

    base = {
        "Energy Risk":50,
        "Supply Chain Risk":50,
        "Inflation Risk":45,
        "Market Volatility":48
    }

    for s in signals:
        base[s["category"]] += int(s["score"]*0.15)

    for a in analyses:
        for c in a["categories"]:
            base[c["name"]] += int(c["score"]*0.25)

    categories=[]
    for k,v in base.items():
        score=min(round(v/2),95)
        explanation="Aggregated from signals + events"

        if company_profile and view=="company":
            score, explanation = apply_company_adjustment(k,score,company_profile)

        categories.append(CategoryScore(name=k,score=score,explanation=explanation))

    overall=round(sum(c.score for c in categories)/len(categories))

    posture="Stable"
    if overall>75: posture="Critical"
    elif overall>60: posture="Elevated"
    elif overall>45: posture="Guarded"

    return DashboardResponse(
        view=view,
        headline=f"{view} risk posture {posture}",
        overall_risk_score=overall,
        risk_posture=posture,
        categories=categories,
        top_recommendations=["Focus on top risks","Prepare mitigation"],
        event_count=len(events),
        signal_count=len(signals),
        narrative="Composite geopolitical risk interpretation"
    )