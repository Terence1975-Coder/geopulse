from __future__ import annotations

from collections import Counter, defaultdict
from datetime import datetime, timezone
from typing import Dict, List
from uuid import uuid4

from models.events import EventItem, EventCluster
from storage.state import STATE
from utils.similarity import text_similarity


class EventClusteringEngine:
    def _cluster_key(self, event: EventItem) -> str:
        keywords = set([event.category, event.region.lower(), *[t.lower() for t in event.tags[:3]]])
        return "|".join(sorted(k for k in keywords if k))

    def rebuild_clusters(self) -> Dict[str, EventCluster]:
        groups: Dict[str, List[EventItem]] = defaultdict(list)
        for event in STATE.events.values():
            groups[self._cluster_key(event)].append(event)

        new_clusters: Dict[str, EventCluster] = {}
        for _, events in groups.items():
            if not events:
                continue

            sorted_events = sorted(events, key=lambda e: e.timestamp, reverse=True)
            categories = Counter(e.category for e in events)
            dominant_category = categories.most_common(1)[0][0]
            tags = Counter(tag for e in events for tag in e.tags)
            cluster_label = self._build_label(dominant_category, tags)
            trend_status = self._trend_status(sorted_events)
            confidence = int(sum(e.confidence for e in events) / len(events))
            urgency = self._max_urgency(events)
            horizon = "immediate" if any(e.horizon == "immediate" for e in events) else "30-day"

            cluster = EventCluster(
                cluster_id=str(uuid4()),
                label=cluster_label,
                summary=self._build_summary(sorted_events, dominant_category, trend_status),
                related_event_ids=[e.id for e in events],
                dominant_risk_category=dominant_category,
                trend_status=trend_status,
                confidence=confidence,
                last_updated=sorted_events[0].timestamp,
                urgency=urgency,
                horizon=horizon,
            )
            new_clusters[cluster.cluster_id] = cluster

            for event in events:
                event.cluster_id = cluster.cluster_id
                event.related_event_ids = [e.id for e in events if e.id != event.id]

        STATE.clusters = new_clusters
        return new_clusters

    def _build_label(self, category: str, tags: Counter) -> str:
        top_tags = [tag for tag, _ in tags.most_common(2)]
        if top_tags:
            return f"{category.replace('_', ' ').title()} — {' / '.join(top_tags).title()}"
        return f"{category.replace('_', ' ').title()} Cluster"

    def _trend_status(self, events: List[EventItem]) -> str:
        if len(events) <= 1:
            return "emerging"
        recent = sum(e.severity for e in events[:2]) / min(2, len(events))
        older = sum(e.severity for e in events[2:4]) / max(1, len(events[2:4])) if len(events) > 2 else recent - 3
        if recent - older > 7:
            return "escalating"
        if older - recent > 7:
            return "easing"
        return "stable"

    def _build_summary(self, events: List[EventItem], dominant_category: str, trend_status: str) -> str:
        return (
            f"This cluster groups {len(events)} related developments with dominant {dominant_category} relevance. "
            f"Current momentum appears {trend_status}, indicating a potential thematic risk chain rather than isolated noise."
        )

    def _max_urgency(self, events: List[EventItem]) -> str:
        rank = {"low": 1, "medium": 2, "high": 3, "critical": 4}
        return max((e.urgency for e in events), key=lambda u: rank.get(u, 1))