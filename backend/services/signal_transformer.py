from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict, List, Tuple
from uuid import uuid4

from models.events import EventItem
from models.signals import Signal
from storage.state import STATE
from utils.similarity import text_similarity


class SignalToEventTransformer:
    CATEGORY_RULES: List[Tuple[str, List[str]]] = [
        ("energy", ["oil", "gas", "power", "energy", "brent"]),
        ("supply_chain", ["shipping", "port", "freight", "logistics", "supply chain"]),
        ("regulatory", ["sanctions", "compliance", "regulatory", "tariff", "trade"]),
        ("political", ["election", "government", "instability", "political"]),
        ("macroeconomic", ["inflation", "currency", "rates", "growth", "slowdown"]),
    ]

    def infer_category(self, signal: Signal) -> str:
        haystack = f"{signal.title} {signal.summary} {' '.join(signal.tags)}".lower()
        for category, keywords in self.CATEGORY_RULES:
            if any(word in haystack for word in keywords):
                return category
        return "general"

    def infer_severity(self, signal: Signal, category: str) -> int:
        base = int(signal.potential_severity)
        if category in {"energy", "supply_chain"}:
            base += 5
        if signal.urgency == "critical":
            base += 10
        elif signal.urgency == "high":
            base += 5
        return max(0, min(100, base))

    def is_duplicate(self, signal: Signal) -> bool:
        for event in STATE.events.values():
            title_score = text_similarity(signal.title, event.headline)
            body_score = text_similarity(signal.summary, event.body)
            if title_score > 0.84 or (title_score > 0.74 and body_score > 0.70):
                return True
        return False

    def transform_signal(self, signal: Signal) -> EventItem | None:
        if self.is_duplicate(signal):
            return None

        category = self.infer_category(signal)
        severity = self.infer_severity(signal, category)

        return EventItem(
            id=str(uuid4()),
            headline=signal.title,
            body=signal.summary,
            category=category,
            severity=severity,
            region=signal.region,
            tags=signal.tags,
            timestamp=signal.timestamp,
            source=signal.source,
            source_signal_id=signal.id,
            urgency=signal.urgency,
            confidence=signal.confidence,
            horizon=signal.horizon,
        )

    def transform_many(self, signals: List[Signal]) -> List[EventItem]:
        created: List[EventItem] = []
        for signal in signals:
            event = self.transform_signal(signal)
            if event:
                STATE.events[event.id] = event
                created.append(event)
        return created