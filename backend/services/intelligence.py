import json
from collections import defaultdict
from datetime import datetime
from typing import Dict, List, Optional

from models import Analysis, Event


def parse_json_list(raw_value: str) -> List[str]:
    try:
        parsed = json.loads(raw_value or "[]")
        return parsed if isinstance(parsed, list) else []
    except json.JSONDecodeError:
        return []


def analysis_to_read_dict(analysis: Analysis) -> Dict:
    return {
        "id": analysis.id,
        "event_id": analysis.event_id,
        "overall_risk": analysis.overall_risk,
        "energy_risk": analysis.energy_risk,
        "supply_chain_risk": analysis.supply_chain_risk,
        "inflation_risk": analysis.inflation_risk,
        "market_volatility_risk": analysis.market_volatility_risk,
        "consumer_demand_risk": analysis.consumer_demand_risk,
        "sentiment": analysis.sentiment,
        "summary": analysis.summary,
        "opportunity": analysis.opportunity,
        "related_group": analysis.related_group,
        "recommended_actions": parse_json_list(analysis.recommended_actions_json),
        "topic_tags": parse_json_list(analysis.topic_tags_json),
        "created_at": analysis.created_at,
    }


def event_to_read_dict(
    event: Event,
    latest_analysis: Optional[Analysis] = None,
    analysis_count: int = 0,
) -> Dict:
    return {
        "id": event.id,
        "headline": event.headline,
        "body": event.body,
        "created_at": event.created_at,
        "updated_at": event.updated_at,
        "analysis_count": analysis_count,
        "latest_analysis": analysis_to_read_dict(latest_analysis) if latest_analysis else None,
    }


def build_latest_analysis_map(analyses: List[Analysis]) -> Dict[str, Analysis]:
    latest_map: Dict[str, Analysis] = {}
    for analysis in analyses:
        if analysis.event_id not in latest_map:
            latest_map[analysis.event_id] = analysis
    return latest_map


def build_analysis_count_map(analyses: List[Analysis]) -> Dict[str, int]:
    counts: Dict[str, int] = defaultdict(int)
    for analysis in analyses:
        counts[analysis.event_id] += 1
    return counts


def build_related_events(
    current_event_id: str,
    current_tags: List[str],
    events: List[Event],
    latest_analysis_map: Dict[str, Analysis],
) -> List[Dict]:
    related = []

    for event in events:
        if event.id == current_event_id:
            continue

        latest = latest_analysis_map.get(event.id)
        if not latest:
            continue

        other_tags = set(parse_json_list(latest.topic_tags_json))
        shared = list(set(current_tags).intersection(other_tags))
        if shared:
            related.append(
                {
                    "event_id": event.id,
                    "headline": event.headline,
                    "shared_tags": sorted(shared),
                    "overall_risk": latest.overall_risk,
                    "sentiment": latest.sentiment,
                    "analyzed_at": latest.created_at,
                }
            )

    related.sort(
        key=lambda item: (
            -len(item["shared_tags"]),
            -(item["overall_risk"] or 0),
        )
    )
    return related[:5]


def build_dashboard(events: List[Event], analyses: List[Analysis]) -> Dict:
    total_events = len(events)
    analyzed_events = len({a.event_id for a in analyses})
    pending_events = total_events - analyzed_events

    if not analyses:
        empty_event_cards = [
            event_to_read_dict(event, None, 0) for event in events[:5]
        ]
        return {
            "total_events": total_events,
            "analyzed_events": analyzed_events,
            "pending_events": pending_events,
            "current_overall_risk": 0.0,
            "previous_overall_risk": 0.0,
            "risk_delta": 0.0,
            "recent_average_risk": 0.0,
            "average_energy_risk": 0.0,
            "average_supply_chain_risk": 0.0,
            "average_inflation_risk": 0.0,
            "average_market_volatility_risk": 0.0,
            "average_consumer_demand_risk": 0.0,
            "highest_risk_category": "none",
            "latest_analyzed_events": empty_event_cards,
        }

    latest_map = build_latest_analysis_map(analyses)
    count_map = build_analysis_count_map(analyses)

    latest_analyses = list(latest_map.values())
    latest_analyses.sort(key=lambda a: a.created_at, reverse=True)

    current_overall = round(sum(a.overall_risk for a in latest_analyses) / len(latest_analyses), 1)

    if len(latest_analyses) > 1:
        previous_slice = latest_analyses[1 : min(6, len(latest_analyses))]
        previous_overall = round(
            sum(a.overall_risk for a in previous_slice) / len(previous_slice), 1
        ) if previous_slice else current_overall
    else:
        previous_overall = current_overall

    averages = {
        "average_energy_risk": round(sum(a.energy_risk for a in latest_analyses) / len(latest_analyses), 1),
        "average_supply_chain_risk": round(sum(a.supply_chain_risk for a in latest_analyses) / len(latest_analyses), 1),
        "average_inflation_risk": round(sum(a.inflation_risk for a in latest_analyses) / len(latest_analyses), 1),
        "average_market_volatility_risk": round(sum(a.market_volatility_risk for a in latest_analyses) / len(latest_analyses), 1),
        "average_consumer_demand_risk": round(sum(a.consumer_demand_risk for a in latest_analyses) / len(latest_analyses), 1),
    }

    category_map = {
        "energy": averages["average_energy_risk"],
        "supply_chain": averages["average_supply_chain_risk"],
        "inflation": averages["average_inflation_risk"],
        "market_volatility": averages["average_market_volatility_risk"],
        "consumer_demand": averages["average_consumer_demand_risk"],
    }

    latest_cards = []
    event_lookup = {event.id: event for event in events}
    for analysis in latest_analyses[:5]:
        event = event_lookup.get(analysis.event_id)
        if event:
            latest_cards.append(
                event_to_read_dict(
                    event,
                    latest_analysis=analysis,
                    analysis_count=count_map.get(event.id, 0),
                )
            )

    return {
        "total_events": total_events,
        "analyzed_events": analyzed_events,
        "pending_events": pending_events,
        "current_overall_risk": current_overall,
        "previous_overall_risk": previous_overall,
        "risk_delta": round(current_overall - previous_overall, 1),
        "recent_average_risk": round(
            sum(a.overall_risk for a in latest_analyses[:5]) / len(latest_analyses[:5]),
            1,
        ),
        "highest_risk_category": max(category_map, key=category_map.get),
        "latest_analyzed_events": latest_cards,
        **averages,
    }


def build_trends(analyses: List[Analysis]) -> Dict:
    if not analyses:
        return {
            "points": [],
            "direction": {
                "overall": "flat",
                "energy": "flat",
                "supply_chain": "flat",
                "inflation": "flat",
                "market_volatility": "flat",
                "consumer_demand": "flat",
            },
        }

    analyses_sorted = sorted(analyses, key=lambda a: a.created_at)
    bucket_map: Dict[str, List[Analysis]] = defaultdict(list)

    for analysis in analyses_sorted:
        label = analysis.created_at.strftime("%Y-%m-%d")
        bucket_map[label].append(analysis)

    points = []
    for label, items in bucket_map.items():
        timestamp = min(item.created_at for item in items)
        points.append(
            {
                "label": label,
                "timestamp": timestamp,
                "event_count": len(items),
                "overall_risk": round(sum(i.overall_risk for i in items) / len(items), 1),
                "energy_risk": round(sum(i.energy_risk for i in items) / len(items), 1),
                "supply_chain_risk": round(sum(i.supply_chain_risk for i in items) / len(items), 1),
                "inflation_risk": round(sum(i.inflation_risk for i in items) / len(items), 1),
                "market_volatility_risk": round(sum(i.market_volatility_risk for i in items) / len(items), 1),
                "consumer_demand_risk": round(sum(i.consumer_demand_risk for i in items) / len(items), 1),
            }
        )

    points.sort(key=lambda p: p["timestamp"])
    points = points[-14:]

    def direction_for(key: str) -> str:
        if len(points) < 2:
            return "flat"
        delta = points[-1][key] - points[0][key]
        if delta > 4:
            return "rising"
        if delta < -4:
            return "softening"
        return "flat"

    return {
        "points": points,
        "direction": {
            "overall": direction_for("overall_risk"),
            "energy": direction_for("energy_risk"),
            "supply_chain": direction_for("supply_chain_risk"),
            "inflation": direction_for("inflation_risk"),
            "market_volatility": direction_for("market_volatility_risk"),
            "consumer_demand": direction_for("consumer_demand_risk"),
        },
    }


def build_recent_activity(events: List[Event], analyses: List[Analysis]) -> List[Dict]:
    activity = []

    latest_map = build_latest_analysis_map(analyses)
    event_lookup = {event.id: event for event in events}

    for event in events:
        activity.append(
            {
                "type": "event_created",
                "event_id": event.id,
                "headline": event.headline,
                "timestamp": event.created_at,
                "description": "New event added to the intelligence record.",
                "severity": "info",
            }
        )

    for analysis in analyses[:12]:
        event = event_lookup.get(analysis.event_id)
        if event:
            severity = "high" if analysis.overall_risk >= 75 else "medium" if analysis.overall_risk >= 60 else "low"
            activity.append(
                {
                    "type": "event_analyzed",
                    "event_id": event.id,
                    "headline": event.headline,
                    "timestamp": analysis.created_at,
                    "description": f"Analysis stored with overall risk {analysis.overall_risk}.",
                    "severity": severity,
                }
            )

    activity.sort(key=lambda item: item["timestamp"], reverse=True)
    return activity[:12]
