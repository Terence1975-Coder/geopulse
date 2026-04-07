from typing import Dict, List


CATEGORY_KEYWORDS = {
    "energy_risk": {
        "oil": 16,
        "gas": 16,
        "pipeline": 12,
        "refinery": 12,
        "electricity": 10,
        "power": 10,
        "energy": 12,
        "diesel": 8,
        "fuel": 10,
        "sanction": 8,
        "opec": 10,
    },
    "supply_chain_risk": {
        "shipping": 18,
        "port": 14,
        "freight": 14,
        "logistics": 16,
        "factory": 10,
        "border": 10,
        "route": 8,
        "container": 12,
        "warehouse": 8,
        "semiconductor": 12,
        "strike": 12,
    },
    "inflation_risk": {
        "inflation": 18,
        "price": 12,
        "cost": 10,
        "food": 12,
        "tariff": 10,
        "interest rate": 12,
        "wage": 8,
        "consumer prices": 14,
        "import cost": 12,
    },
    "market_volatility_risk": {
        "market": 12,
        "stocks": 12,
        "bond": 10,
        "currency": 12,
        "volatility": 18,
        "investor": 10,
        "bank": 10,
        "equity": 10,
        "selloff": 12,
        "uncertainty": 12,
    },
    "consumer_demand_risk": {
        "consumer": 14,
        "retail": 16,
        "sales": 14,
        "demand": 18,
        "confidence": 12,
        "employment": 10,
        "spending": 12,
        "automotive": 8,
        "dealership": 8,
        "affordability": 12,
    },
}

NEGATIVE_TERMS = [
    "war",
    "conflict",
    "attack",
    "missile",
    "disruption",
    "shortage",
    "collapse",
    "fall",
    "crisis",
    "delay",
    "threat",
    "ban",
    "sanction",
    "shutdown",
    "pressure",
    "inflation",
    "strike",
    "uncertainty",
]

POSITIVE_TERMS = [
    "recovery",
    "agreement",
    "stabilises",
    "stabilizes",
    "improves",
    "growth",
    "eases",
    "surplus",
    "deal",
    "boost",
    "resilient",
    "support",
    "investment",
]

TAG_KEYWORDS = {
    "energy": ["oil", "gas", "pipeline", "refinery", "electricity", "power", "fuel"],
    "shipping": ["shipping", "port", "freight", "container", "route", "logistics"],
    "inflation": ["inflation", "price", "cost", "tariff", "wage"],
    "markets": ["market", "stocks", "currency", "investor", "bond", "bank"],
    "consumer": ["consumer", "retail", "sales", "spending", "confidence", "demand"],
    "automotive": ["automotive", "vehicle", "dealership", "car", "ev"],
    "technology": ["semiconductor", "chip", "technology", "factory"],
    "policy": ["government", "regulation", "sanction", "tariff", "policy"],
}


def clamp(value: float, min_value: float = 0, max_value: float = 100) -> float:
    return max(min_value, min(max_value, value))


def count_term_hits(text: str, terms: List[str]) -> int:
    total = 0
    for term in terms:
        total += text.count(term)
    return total


def extract_tags(text: str) -> List[str]:
    tags = []
    for tag, terms in TAG_KEYWORDS.items():
        if any(term in text for term in terms):
            tags.append(tag)
    return tags[:5] or ["general"]


def build_related_group(tags: List[str]) -> str:
    if len(tags) >= 2:
        return f"{tags[0]} / {tags[1]}"
    return tags[0]


def build_recommended_actions(scores: Dict[str, float], tags: List[str], sentiment: str) -> List[str]:
    ranked = sorted(scores.items(), key=lambda item: item[1], reverse=True)
    actions: List[str] = []

    for category, score in ranked[:3]:
        if category == "energy_risk":
            actions.append(
                "Review fuel, utility, and energy-sensitive operating exposure for the next 30 days."
            )
        elif category == "supply_chain_risk":
            actions.append(
                "Check supplier resilience, alternate routing options, and any at-risk shipments or stock positions."
            )
        elif category == "inflation_risk":
            actions.append(
                "Stress-test pricing, margin protection, and procurement assumptions against cost escalation."
            )
        elif category == "market_volatility_risk":
            actions.append(
                "Monitor cashflow sensitivity, financing conditions, and investor or currency exposure."
            )
        elif category == "consumer_demand_risk":
            actions.append(
                "Track conversion, lead volumes, and discretionary demand softness across key customer segments."
            )

    if "automotive" in tags:
        actions.append(
            "Prepare a short sector note on likely automotive demand shifts, affordability pressure, and EV mix implications."
        )

    if sentiment == "positive":
        actions.append(
            "Assess whether improving conditions create a near-term opportunity to accelerate campaigns, inventory, or investment."
        )

    return actions[:5]


def build_opportunity(tags: List[str], sentiment: str) -> str:
    if "energy" in tags:
        return (
            "Potential opportunity: businesses exposed to energy volatility may accelerate efficiency, solar, storage, or hedging decisions."
        )
    if "shipping" in tags:
        return (
            "Potential opportunity: alternative-route providers, local sourcing, and visibility software may gain demand."
        )
    if "consumer" in tags and sentiment == "positive":
        return (
            "Potential opportunity: improving sentiment may support promotional pushes, premium upsell, and selective expansion."
        )
    if "markets" in tags:
        return (
            "Potential opportunity: heightened uncertainty increases demand for scenario planning, treasury discipline, and risk monitoring."
        )
    return (
        "Potential opportunity: clarify where disruption creates a need for resilience services, substitution, or faster decision support."
    )


def build_summary(headline: str, scores: Dict[str, float], sentiment: str, tags: List[str]) -> str:
    top_category = max(scores, key=scores.get)
    pretty_names = {
        "energy_risk": "energy risk",
        "supply_chain_risk": "supply chain risk",
        "inflation_risk": "inflation risk",
        "market_volatility_risk": "market volatility",
        "consumer_demand_risk": "consumer demand pressure",
    }
    return (
        f"{headline} is assessed as {sentiment}. "
        f"The strongest impact is in {pretty_names[top_category]}, supported by tags: {', '.join(tags)}."
    )


def analyze_event_text(headline: str, body: str) -> Dict:
    text = f"{headline} {body}".lower()

    scores = {
        "energy_risk": 50.0,
        "supply_chain_risk": 50.0,
        "inflation_risk": 50.0,
        "market_volatility_risk": 50.0,
        "consumer_demand_risk": 50.0,
    }

    for category, keyword_map in CATEGORY_KEYWORDS.items():
        for term, weight in keyword_map.items():
            if term in text:
                scores[category] += weight

    negative_hits = count_term_hits(text, NEGATIVE_TERMS)
    positive_hits = count_term_hits(text, POSITIVE_TERMS)

    for key in scores:
        scores[key] += negative_hits * 1.5
        scores[key] -= positive_hits * 1.2
        scores[key] = round(clamp(scores[key]), 1)

    if negative_hits > positive_hits + 1:
        sentiment = "negative"
    elif positive_hits > negative_hits:
        sentiment = "positive"
    else:
        sentiment = "mixed"

    overall = round(
        clamp(
            (
                scores["energy_risk"]
                + scores["supply_chain_risk"]
                + scores["inflation_risk"]
                + scores["market_volatility_risk"]
                + scores["consumer_demand_risk"]
            )
            / 5
            + (4 if sentiment == "negative" else -3 if sentiment == "positive" else 0)
        ),
        1,
    )

    tags = extract_tags(text)
    related_group = build_related_group(tags)
    recommended_actions = build_recommended_actions(scores, tags, sentiment)
    summary = build_summary(headline, scores, sentiment, tags)
    opportunity = build_opportunity(tags, sentiment)

    return {
        "overall_risk": overall,
        "energy_risk": scores["energy_risk"],
        "supply_chain_risk": scores["supply_chain_risk"],
        "inflation_risk": scores["inflation_risk"],
        "market_volatility_risk": scores["market_volatility_risk"],
        "consumer_demand_risk": scores["consumer_demand_risk"],
        "sentiment": sentiment,
        "summary": summary,
        "opportunity": opportunity,
        "related_group": related_group,
        "recommended_actions": recommended_actions,
        "topic_tags": tags,
    }


def build_assistant_reply(headline: str, analysis: Dict, message: str) -> Dict:
    lowered = message.lower()
    actions = analysis["recommended_actions"]
    top_score = max(
        [
            ("energy", analysis["energy_risk"]),
            ("supply chain", analysis["supply_chain_risk"]),
            ("inflation", analysis["inflation_risk"]),
            ("market volatility", analysis["market_volatility_risk"]),
            ("consumer demand", analysis["consumer_demand_risk"]),
        ],
        key=lambda x: x[1],
    )

    if "priority" in lowered or "first" in lowered:
        reply = (
            f"For '{headline}', the immediate priority is {top_score[0]} because it is the highest-scoring pressure area. "
            f"In the next 24-48 hours, start with: {actions[0]} "
            f"Then move to: {actions[1] if len(actions) > 1 else 'run a short internal status review with owners and deadlines.'}"
        )
    elif "opportunity" in lowered:
        reply = (
            f"The opportunity angle here is: {analysis['opportunity']} "
            f"That means GeoPulse would treat this event not only as a risk signal, but also as a potential demand or strategy trigger."
        )
    elif "cost" in lowered or "margin" in lowered:
        reply = (
            f"The likely cost and margin effect comes through {top_score[0]}. "
            f"Use this event to review procurement timing, pricing flexibility, and inventory exposure. "
            f"A useful first action is: {actions[0]}"
        )
    elif "customer" in lowered or "sales" in lowered or "demand" in lowered:
        reply = (
            f"Customer impact should be monitored through demand softness, confidence shifts, and conversion changes. "
            f"GeoPulse currently scores consumer demand at {analysis['consumer_demand_risk']}. "
            f"Pair sales tracking with: {actions[-1] if actions else 'a quick commercial review.'}"
        )
    else:
        reply = (
            f"GeoPulse reads '{headline}' as {analysis['sentiment']} with overall risk {analysis['overall_risk']}. "
            f"The strongest pressure area is {top_score[0]}. "
            f"Recommended next step: {actions[0]}"
        )

    return {
        "reply": reply,
        "suggested_follow_ups": [
            "What should I do in the next 48 hours?",
            "Where is the business opportunity here?",
            "How could this affect costs and margins?",
            "What customer or sales signals should I monitor?",
        ],
    }
