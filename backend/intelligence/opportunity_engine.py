from __future__ import annotations
from collections import defaultdict
from typing import Dict, List


OPPORTUNITY_KEYWORDS = {
    "Market Expansion": ["growth", "demand", "expansion", "uptick"],
    "Cost Advantage": ["price drop", "cost easing", "margin improvement"],
    "Energy Relief": ["oil prices fall", "gas prices fall", "energy relief"],
    "Supply Chain Improvement": ["logistics recovery", "shipping improves"],
    "Consumer Demand Upside": ["strong spending", "consumer rebound"],
    "Competitor Weakness": ["profit warning", "store closures"],
    "Strategic Investment Window": ["subsidy", "grant", "tax relief"],
    "Partnership / Acquisition Potential": ["acquisition", "joint venture"],
}


def analyse_opportunities(events: List[object]):
    category_scores = defaultdict(float)
    cluster_counts = defaultdict(int)
    highlights = []
    total_score = 0

    for ev in events:
        text = f"{ev.headline} {ev.body}".lower()

        for category, keywords in OPPORTUNITY_KEYWORDS.items():
            if any(k in text for k in keywords):
                category_scores[category] += 10
                cluster_counts[category] += 1
                total_score += 10

                highlights.append(
                    {
                        "title": ev.headline,
                        "executive_summary": f"Positive signal detected in {category.lower()} conditions.",
                        "category": category,
                        "confidence": min(90, 60 + cluster_counts[category] * 5),
                        "time_relevance": "near-term",
                        "business_implication": "May support improved commercial positioning.",
                        "suggested_action": "Review whether this upside can be operationalised.",
                        "detected_at": ev.timestamp,
                    }
                )

    posture = "emerging"
    if total_score > 40:
        posture = "active"
    if total_score > 70:
        posture = "strong window"

    top_clusters = sorted(cluster_counts.keys(), key=lambda x: cluster_counts[x], reverse=True)[:5]

    return {
        "opportunity_score": min(100, total_score),
        "opportunity_posture": posture,
        "opportunity_category_scores": dict(category_scores),
        "top_opportunity_clusters": top_clusters,
        "opportunity_highlights": highlights[:6],
    }