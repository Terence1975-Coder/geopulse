import math
from datetime import datetime, timedelta
from typing import Dict, List
from sqlalchemy.orm import Session
from models import Signal, Event


RISK_CATEGORIES = [
    "Energy Risk",
    "Supply Chain Risk",
    "Inflation Risk",
    "Demand Risk",
    "Market Volatility",
]

KEYWORD_MAP = {
    "Energy Risk": [
        "oil", "gas", "energy", "pipeline", "opec", "electricity", "power", "refinery", "fuel"
    ],
    "Supply Chain Risk": [
        "shipping", "port", "container", "logistics", "customs", "route", "red sea", "freight", "factory"
    ],
    "Inflation Risk": [
        "inflation", "prices", "commodity", "cost", "tariff", "food prices", "fuel prices"
    ],
    "Demand Risk": [
        "consumer", "spending", "retail", "confidence", "demand", "sales", "jobs"
    ],
    "Market Volatility": [
        "market", "stocks", "bond", "volatility", "currency", "fx", "equity", "yield", "trading"
    ],
}


def split_tags(tag_string: str) -> List[str]:
    return [t.strip() for t in tag_string.split(",") if t.strip()]


def hours_since(ts: datetime) -> float:
    delta = datetime.utcnow() - ts
    return max(delta.total_seconds() / 3600, 0.0)


def recency_weight(ts: datetime, decay_hours: float = 48.0) -> float:
    age = hours_since(ts)
    return math.exp(-(age / decay_hours))


def _keyword_hits(text: str, category: str) -> int:
    lowered = text.lower()
    return sum(1 for kw in KEYWORD_MAP[category] if kw in lowered)


def _tag_bonus(tags: List[str], category: str) -> float:
    joined = " ".join(tags).lower()
    if category == "Energy Risk" and any(t in joined for t in ["energy", "oil", "gas", "utilities"]):
        return 10
    if category == "Supply Chain Risk" and any(t in joined for t in ["shipping", "logistics", "manufacturing", "trade"]):
        return 10
    if category == "Inflation Risk" and any(t in joined for t in ["prices", "commodities", "inflation"]):
        return 10
    if category == "Demand Risk" and any(t in joined for t in ["consumer", "retail", "automotive"]):
        return 10
    if category == "Market Volatility" and any(t in joined for t in ["finance", "markets", "fx", "equities"]):
        return 10
    return 0


def compute_risk_breakdown(
    headline: str,
    body: str,
    region: str,
    tags: List[str],
    severity: int,
    credibility: float,
    timestamp: datetime,
    strength_modifier: float = 1.0,
) -> Dict[str, float]:
    text = f"{headline} {body} {region} {' '.join(tags)}"
    recency = recency_weight(timestamp, decay_hours=48.0)
    severity_factor = severity / 100.0
    credibility_factor = max(0.2, min(1.0, credibility))
    strength = max(0.5, min(1.5, strength_modifier))

    scores = {}

    for category in RISK_CATEGORIES:
        hits = _keyword_hits(text, category)
        base = 8 + (hits * 12) + _tag_bonus(tags, category)
        weighted = base * severity_factor * credibility_factor * recency * strength * 2.2
        if "Middle East" in region and category in ["Energy Risk", "Market Volatility"]:
            weighted *= 1.1
        if "Asia" in region and category == "Supply Chain Risk":
            weighted *= 1.1
        if "Europe" in region and category in ["Inflation Risk", "Demand Risk"]:
            weighted *= 1.05

        scores[category] = round(min(weighted, 100), 1)

    return scores


def summarize_analysis(scores: Dict[str, float], headline: str, region: str, credibility: float) -> str:
    sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    top_1, top_2 = sorted_scores[0], sorted_scores[1]

    credibility_label = "high" if credibility >= 0.8 else "moderate" if credibility >= 0.55 else "low"

    return (
        f"{headline} is currently exerting the strongest pressure on {top_1[0].lower()} "
        f"and {top_2[0].lower()} in {region}. "
        f"The source credibility is {credibility_label}, so GeoPulse weights this signal accordingly."
    )


def recommended_actions(scores: Dict[str, float]) -> str:
    actions = []

    if scores["Energy Risk"] >= 55:
        actions.append("Review energy-price exposure and hedge sensitivity in fuel or utilities-linked operations.")
    if scores["Supply Chain Risk"] >= 55:
        actions.append("Check supplier concentration, shipping corridors, lead times, and critical stock buffers.")
    if scores["Inflation Risk"] >= 55:
        actions.append("Model margin compression and prepare short-term pricing or procurement responses.")
    if scores["Demand Risk"] >= 55:
        actions.append("Monitor customer sentiment and revisit demand assumptions across affected sectors.")
    if scores["Market Volatility"] >= 55:
        actions.append("Tighten treasury watchlists and monitor FX, equities, and financing conditions.")

    if not actions:
        actions.append("Maintain watch status and continue monitoring for confirmation or escalation.")

    return " ".join(actions)


def category_average(items: List[Dict[str, float]], category: str) -> float:
    if not items:
        return 0.0
    return round(sum(item.get(category, 0.0) for item in items) / len(items), 1)


def _score_entity(entity, is_signal: bool = False) -> Dict[str, float]:
    tags = split_tags(entity.sector_tags)
    strength = entity.signal_strength_modifier if is_signal else 1.0

    return compute_risk_breakdown(
        headline=entity.headline,
        body=entity.short_content if is_signal else entity.body,
        region=entity.region,
        tags=tags,
        severity=entity.severity_hint if is_signal else entity.severity,
        credibility=entity.credibility_score,
        timestamp=entity.timestamp,
        strength_modifier=strength,
    )


def build_dashboard(db: Session) -> dict:
    now = datetime.utcnow()
    signals = db.query(Signal).order_by(Signal.timestamp.desc()).all()
    events = db.query(Event).order_by(Event.timestamp.desc()).all()

    all_items = []

    for s in signals:
        score = _score_entity(s, is_signal=True)
        all_items.append({
            "type": "signal",
            "timestamp": s.timestamp,
            "scores": score,
            "weight": recency_weight(s.timestamp, decay_hours=48.0) * s.credibility_score * s.signal_strength_modifier,
        })

    for e in events:
        score = _score_entity(e, is_signal=False)
        all_items.append({
            "type": "event",
            "timestamp": e.timestamp,
            "scores": score,
            "weight": recency_weight(e.timestamp, decay_hours=60.0) * e.credibility_score * 1.15,
        })

    weighted_totals = {cat: 0.0 for cat in RISK_CATEGORIES}
    total_weight = 0.0

    for item in all_items:
        w = item["weight"]
        total_weight += w
        for cat in RISK_CATEGORIES:
            weighted_totals[cat] += item["scores"][cat] * w

    category_scores = []
    for cat in RISK_CATEGORIES:
        value = round((weighted_totals[cat] / total_weight), 1) if total_weight else 0.0
        category_scores.append({"name": cat, "score": value})

    overall = round(sum(c["score"] for c in category_scores) / len(category_scores), 1) if category_scores else 0.0

    recent_cutoff = now - timedelta(hours=24)
    previous_cutoff = now - timedelta(hours=48)

    recent_items = [i for i in all_items if i["timestamp"] >= recent_cutoff]
    previous_items = [i for i in all_items if previous_cutoff <= i["timestamp"] < recent_cutoff]

    def avg_for_window(items, cat):
        if not items:
            return 0.0
        values = [i["scores"][cat] * i["weight"] for i in items]
        weights = [i["weight"] for i in items]
        return sum(values) / max(sum(weights), 0.0001)

    cat_deltas = {}
    for cat in RISK_CATEGORIES:
        recent_avg = avg_for_window(recent_items, cat)
        previous_avg = avg_for_window(previous_items, cat)
        cat_deltas[cat] = recent_avg - previous_avg

    fastest_rising = max(cat_deltas.items(), key=lambda x: x[1])[0] if cat_deltas else "Energy Risk"
    acceleration = round(sum(cat_deltas.values()) / len(cat_deltas), 1) if cat_deltas else 0.0

    if acceleration > 6:
        momentum = "↑"
        pressure_status = "Risk rising fast"
    elif acceleration < -4:
        momentum = "↓"
        pressure_status = "Pressure easing"
    else:
        momentum = "→"
        pressure_status = "Pressure stabilising"

    fresh_signal_pressure_index = round(
        sum(
            (
                sum(item["scores"].values()) / 5.0
            ) * item["weight"]
            for item in recent_items
            if item["type"] == "signal"
        ),
        1,
    )

    last_24h_signal_intensity = round(
        sum(item["weight"] for item in recent_items if item["type"] == "signal") * 100,
        1,
    )

    return {
        "overall_risk_score": overall,
        "momentum_direction": momentum,
        "risk_acceleration": acceleration,
        "fastest_rising_risk_category": fastest_rising,
        "fresh_signal_pressure_index": fresh_signal_pressure_index,
        "last_24h_signal_intensity": last_24h_signal_intensity,
        "pressure_status": pressure_status,
        "category_scores": category_scores,
        "signal_count": len(signals),
        "event_count": len(events),
    }


def find_related_event_ids(db: Session, event: Event) -> List[str]:
    events = db.query(Event).filter(Event.id != event.id).all()
    current_tags = set(split_tags(event.sector_tags))
    related = []

    for other in events:
        other_tags = set(split_tags(other.sector_tags))
        shared_tags = len(current_tags.intersection(other_tags))
        same_region = event.region == other.region
        similar_source = event.source_name == other.source_name

        score = 0
        if shared_tags > 0:
            score += shared_tags
        if same_region:
            score += 2
        if similar_source:
            score += 1

        if score >= 2:
            related.append(other.id)

    return related[:5]
