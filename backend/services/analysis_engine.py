from typing import Dict, Any, List, Optional
from app.models import EventAnalysis, CategoryScore, DashboardResponse
from app.services.company_profile_engine import apply_company_adjustment


CATEGORY_KEYWORDS = {
    "Energy Risk": ["oil", "gas", "energy", "pipeline", "fuel", "power", "electricity"],
    "Supply Chain Risk": ["port", "shipping", "freight", "logistics", "route", "container", "corridor"],
    "Inflation Risk": ["inflation", "prices", "cost", "commodity", "wage", "food"],
    "Market Volatility": ["market", "stocks", "currency", "bond", "fx", "selloff", "volatility"],
}

DEFAULT_RECOMMENDATIONS = {
    "Energy Risk": "Review energy cost exposure and alternative supply arrangements.",
    "Supply Chain Risk": "Stress-test lead times, suppliers, and transport routes.",
    "Inflation Risk": "Prepare margin defence and pricing response plans.",
    "Market Volatility": "Review liquidity, hedging, and capital timing assumptions.",
}


def _score_text(text: str) -> Dict[str, int]:
    text_lower = text.lower()
    scores = {}
    for category, keywords in CATEGORY_KEYWORDS.items():
        hit_count = sum(1 for kw in keywords if kw in text_lower)
        scores[category] = min(90, 35 + hit_count * 12)
    return scores


def analyze_event(event: Dict[str, Any]) -> EventAnalysis:
    combined_text = f"{event['headline']} {event['body']}"
    base_scores = _score_text(combined_text)
    credibility_boost = int((event.get("credibility", 0.8) - 0.5) * 20)

    categories: List[CategoryScore] = []
    for category, score in base_scores.items():
        final_score = max(20, min(95, score + credibility_boost))
        categories.append(
            CategoryScore(
                name=category,
                score=final_score,
                explanation=f"{category} elevated due to keywords and source credibility."
            )
        )

    severity = round(sum(c.score for c in categories) / len(categories))
    momentum = min(95, severity + 5)
    recommended_actions = [
        DEFAULT_RECOMMENDATIONS[c.name] for c in sorted(categories, key=lambda x: x.score, reverse=True)[:3]
    ]
    tags = [
        t for t in ["conflict", "energy", "shipping", "inflation", "markets", "regulation"]
        if t in combined_text.lower()
    ]

    return EventAnalysis(
        event_id=event["id"],
        summary=f"{event['headline']} may create multi-category business pressure with strongest impact in the highest-scoring risk domains.",
        severity=severity,
        momentum=momentum,
        categories=categories,
        recommended_actions=recommended_actions,
        related_tags=tags,
    )


def _risk_posture(score: int) -> str:
    if score >= 80:
        return "Critical"
    if score >= 65:
        return "Elevated"
    if score >= 45:
        return "Guarded"
    return "Stable"


def build_dashboard(events, analyses, signals, company_profile: Optional[Dict[str, Any]], view: str) -> DashboardResponse:
    category_map = {
        "Energy Risk": [],
        "Supply Chain Risk": [],
        "Inflation Risk": [],
        "Market Volatility": [],
    }

    for signal in signals:
        category_map[signal["category"]].append(signal["score"])

    for analysis in analyses:
        for c in analysis["categories"]:
            category_map[c["name"]].append(c["score"])

    category_scores = []
    for category, values in category_map.items():
        score = round(sum(values) / len(values)) if values else 30
        explanation = "Aggregated from live signals and analyzed events."
        if company_profile and view == "company":
            score, explanation = apply_company_adjustment(category, score, company_profile)
        category_scores.append(CategoryScore(name=category, score=score, explanation=explanation))

    overall = round(sum(c.score for c in category_scores) / len(category_scores))
    posture = _risk_posture(overall)
    top_categories = sorted(category_scores, key=lambda x: x.score, reverse=True)[:2]
    top_recommendations = [
        DEFAULT_RECOMMENDATIONS[c.name] for c in top_categories
    ]

    headline = (
        f"{'Company-adjusted' if view == 'company' else 'Global'} risk posture is {posture.lower()} "
        f"with strongest pressure in {top_categories[0].name}."
    )

    narrative = (
        f"The dashboard blends signal momentum and event analysis into a {'personalised' if view == 'company' else 'global'} "
        f"view. Current concentration is highest in {', '.join(c.name for c in top_categories)}."
    )

    return DashboardResponse(
        view=view,
        headline=headline,
        overall_risk_score=overall,
        risk_posture=posture,
        categories=category_scores,
        top_recommendations=top_recommendations,
        event_count=len(events),
        signal_count=len(signals),
        narrative=narrative,
    )