from __future__ import annotations

import math
import uuid
import feedparser
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, Iterable, List, Optional, Tuple

from sqlalchemy import desc
from sqlalchemy.orm import Session

from backend.db import SessionLocal
from backend.models.signal import Signal


SOURCE_RELIABILITY = {
    "financial_times": 0.92,
    "reuters": 0.95,
    "bloomberg": 0.94,
    "government": 0.97,
    "companies_house": 0.96,
    "oecd": 0.95,
    "manual": 0.60,
    "rss": 0.72,
    "api": 0.83,
    "unknown": 0.55,
}

SEVERITY_WEIGHT = {
    "low": 0.35,
    "medium": 0.62,
    "high": 0.88,
    "critical": 1.00,
}

POSITIVE_KEYWORDS = {
    "expansion",
    "growth",
    "win",
    "resilience",
    "efficiency",
    "recovery",
    "demand",
    "investment",
    "partnership",
    "opening",
    "opportunity",
}

NEGATIVE_KEYWORDS = {
    "disruption",
    "sanction",
    "attack",
    "shortage",
    "inflation",
    "delay",
    "volatility",
    "shutdown",
    "outage",
    "strike",
    "risk",
}

HIGH_STRENGTH_KEYWORDS = {
    "critical",
    "urgent",
    "immediate",
    "major",
    "severe",
    "material",
    "board-level",
    "significant",
}

RSS_FEEDS: List[Tuple[str, str, str]] = [
    ("Financial Times", "https://www.ft.com/rss/home/uk", "UK"),
    ("BBC Business", "https://feeds.bbci.co.uk/news/business/rss.xml", "UK"),
    ("OECD", "https://www.oecd.org/newsroom/rss.xml", "Global"),
]

RSS_CLUSTER_HINTS = {
    "supply": "Supply Chain",
    "shipping": "Energy / Shipping",
    "freight": "Supply Chain",
    "logistics": "Supply Chain",
    "regulation": "Regulatory Pressure",
    "regulatory": "Regulatory Pressure",
    "compliance": "Regulatory Pressure",
    "energy": "Energy / Shipping",
    "resilience": "Resilience Demand",
    "demand": "Resilience Demand",
    "investment": "Market Timing",
    "competitor": "Market Timing",
    "market": "Market Timing",
}

def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def ensure_aware(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def parse_timestamp(value: Any) -> datetime:
    if isinstance(value, datetime):
        return ensure_aware(value)

    if isinstance(value, str):
        cleaned = value.strip().replace("Z", "+00:00")
        try:
            return ensure_aware(datetime.fromisoformat(cleaned))
        except ValueError:
            pass

    return utc_now()


def calculate_freshness_minutes(timestamp: datetime, now: Optional[datetime] = None) -> int:
    reference = ensure_aware(now or utc_now())
    target = ensure_aware(timestamp)
    delta = reference - target
    return max(0, int(delta.total_seconds() // 60))


def classify_signal_lifecycle(freshness_minutes: int) -> str:
    if freshness_minutes < 60:
        return "Fresh"
    if freshness_minutes <= 360:
        return "Active"
    return "Aging"


def relative_time_label(freshness_minutes: int) -> str:
    if freshness_minutes < 60:
        return f"{freshness_minutes} mins ago"
    hours = freshness_minutes // 60
    if hours < 24:
        return f"{hours} hrs ago"
    days = hours // 24
    return f"{days} days ago"


def source_reliability(source: str, source_type: str) -> float:
    source_key = (source or "").strip().lower().replace(" ", "_")
    if source_key in SOURCE_RELIABILITY:
        return SOURCE_RELIABILITY[source_key]

    type_key = (source_type or "").strip().lower()
    return SOURCE_RELIABILITY.get(type_key, SOURCE_RELIABILITY["unknown"])


def keyword_strength(text: str) -> float:
    lowered = (text or "").lower()
    tokens = set(lowered.replace(",", " ").replace(".", " ").split())

    positive_hits = len(tokens.intersection(POSITIVE_KEYWORDS))
    negative_hits = len(tokens.intersection(NEGATIVE_KEYWORDS))
    emphasis_hits = len(tokens.intersection(HIGH_STRENGTH_KEYWORDS))

    base = 0.40
    base += min(0.18, positive_hits * 0.04)
    base += min(0.18, negative_hits * 0.04)
    base += min(0.16, emphasis_hits * 0.05)

    return max(0.0, min(1.0, base))


def compute_confidence_score(
    source: str,
    source_type: str,
    headline: str,
    summary: str,
) -> float:
    reliability = source_reliability(source, source_type)
    strength = keyword_strength(f"{headline} {summary}")
    score = (reliability * 0.72) + (strength * 0.28)
    return round(max(0.0, min(1.0, score)), 2)


def recency_weight(freshness_minutes: int) -> float:
    if freshness_minutes <= 60:
        return 1.0
    if freshness_minutes <= 360:
        return 0.78
    if freshness_minutes <= 1440:
        return 0.55
    return 0.35


def compute_signal_strength(
    severity: str,
    freshness_minutes: int,
    confidence_score: float,
) -> float:
    severity_component = SEVERITY_WEIGHT.get((severity or "").lower(), 0.62)
    recency_component = recency_weight(freshness_minutes)
    score = (severity_component * 0.50) + (recency_component * 0.30) + (confidence_score * 0.20)
    return round(max(0.0, min(1.0, score)), 2)


def serialise_signal(signal: Signal) -> Dict[str, Any]:
    freshness_minutes = calculate_freshness_minutes(signal.timestamp)
    lifecycle = classify_signal_lifecycle(freshness_minutes)

    return {
        "id": signal.id,
        "headline": signal.headline,
        "summary": signal.summary,
        "region": signal.region,
        "cluster_tag": signal.cluster_tag,
        "kind": signal.kind,
        "severity": signal.severity,
        "source": signal.source,
        "source_type": signal.source_type,
        "confidence_score": round(float(signal.confidence_score or 0.0), 2),
        "freshness_minutes": freshness_minutes,
        "signal_strength": round(float(signal.signal_strength or 0.0), 2),
        "timestamp": ensure_aware(signal.timestamp).isoformat(),
        "lifecycle": lifecycle,
        "relative_time": relative_time_label(freshness_minutes),
        "supporting_facts": signal.supporting_facts or {},
        "metadata": signal.metadata_json or {},
    }

def infer_cluster_tag(headline: str, summary: str) -> str:
    text = f"{headline} {summary}".lower()
    for keyword, cluster in RSS_CLUSTER_HINTS.items():
        if keyword in text:
            return cluster
    return "Market News"


def infer_kind(headline: str, summary: str) -> str:
    text = f"{headline} {summary}".lower()
    positive_hits = sum(1 for word in POSITIVE_KEYWORDS if word in text)
    negative_hits = sum(1 for word in NEGATIVE_KEYWORDS if word in text)
    return "opportunity" if positive_hits >= negative_hits else "risk"


def infer_severity(headline: str, summary: str) -> str:
    text = f"{headline} {summary}".lower()
    if any(word in text for word in {"critical", "urgent", "major", "severe"}):
        return "high"
    if any(word in text for word in {"delay", "volatility", "pressure", "risk"}):
        return "medium"
    return "medium"


def dedupe_signal_items(items: Iterable[Dict[str, Any]]) -> List[Dict[str, Any]]:
    seen: set[str] = set()
    deduped: List[Dict[str, Any]] = []

    for item in items:
        key = (item.get("headline") or "").strip().lower()
        if not key or key in seen:
            continue
        seen.add(key)
        deduped.append(item)

    return deduped

def fetch_rss_signals(max_items_per_feed: int = 8) -> List[Dict[str, Any]]:
    collected: List[Dict[str, Any]] = []
    now = utc_now()

    for source_name, url, region in RSS_FEEDS:
        try:
            parsed = feedparser.parse(url)
        except Exception:
            continue

        entries = getattr(parsed, "entries", []) or []

        for entry in entries[:max_items_per_feed]:
            headline = str(entry.get("title", "")).strip()
            summary = str(
                entry.get("summary", "") or entry.get("description", "")
            ).strip()

            if not headline:
                continue

            published_struct = entry.get("published_parsed") or entry.get("updated_parsed")
            if published_struct:
                try:
                    timestamp = datetime(*published_struct[:6], tzinfo=timezone.utc)
                except Exception:
                    timestamp = now
            else:
                timestamp = now

            collected.append(
                {
                    "id": f"rss_{uuid.uuid4().hex[:12]}",
                    "headline": headline,
                    "summary": summary[:700],
                    "region": region,
                    "cluster_tag": infer_cluster_tag(headline, summary),
                    "kind": infer_kind(headline, summary),
                    "severity": infer_severity(headline, summary),
                    "source": source_name,
                    "source_type": "rss",
                    "timestamp": timestamp.isoformat(),
                    "supporting_facts": {
                        "ingestion_type": "rss",
                        "feed_url": url,
                    },
                    "metadata": {
                        "feed_url": url,
                    },
                }
            )

    return dedupe_signal_items(collected)

def _default_seed_signals() -> List[Dict[str, Any]]:
    now = utc_now()
    return [
        {
            "id": "sig_energy_shipping_001",
            "headline": "Energy shipping volatility pushes board-level cost attention",
            "summary": "Freight and energy-linked shipping pressure are raising cost visibility for UK and European operators.",
            "region": "Europe",
            "cluster_tag": "Energy / Shipping",
            "kind": "risk",
            "severity": "high",
            "source": "Reuters",
            "source_type": "rss",
            "timestamp": (now - timedelta(minutes=18)).isoformat(),
            "supporting_facts": {
                "themes": ["energy", "shipping", "cost pressure"],
                "affected_functions": ["finance", "operations", "procurement"],
            },
        },
        {
            "id": "sig_resilience_demand_002",
            "headline": "Resilience demand opens higher-value advisory window",
            "summary": "Clients are showing stronger demand for resilience, implementation support, and rapid operational advisory.",
            "region": "UK",
            "cluster_tag": "Resilience Demand",
            "kind": "opportunity",
            "severity": "medium",
            "source": "Financial Times",
            "source_type": "rss",
            "timestamp": (now - timedelta(minutes=42)).isoformat(),
            "supporting_facts": {
                "themes": ["demand", "services", "resilience"],
                "affected_functions": ["commercial", "strategy"],
            },
        },
        {
            "id": "sig_supply_chain_003",
            "headline": "Supply chain friction signals remain elevated in key corridors",
            "summary": "Transit unreliability and compliance friction continue to affect continuity planning.",
            "region": "Global",
            "cluster_tag": "Supply Chain",
            "kind": "risk",
            "severity": "high",
            "source": "Bloomberg",
            "source_type": "api",
            "timestamp": (now - timedelta(hours=2, minutes=10)).isoformat(),
            "supporting_facts": {
                "themes": ["continuity", "delays", "compliance"],
                "affected_functions": ["operations", "client delivery"],
            },
        },
        {
            "id": "sig_competitor_weakness_004",
            "headline": "Competitor weakness creates timing window for targeted offers",
            "summary": "Execution delays and slower response times in competitor sets may create a short-term opening.",
            "region": "UK",
            "cluster_tag": "Market Timing",
            "kind": "opportunity",
            "severity": "medium",
            "source": "Manual",
            "source_type": "manual",
            "timestamp": (now - timedelta(hours=5, minutes=5)).isoformat(),
            "supporting_facts": {
                "themes": ["timing", "competitor weakness", "offer launch"],
                "affected_functions": ["sales", "leadership"],
            },
        },
        {
            "id": "sig_regulatory_005",
            "headline": "Regulatory tightening increases documentation and delivery burden",
            "summary": "Compliance pressure is increasing the need for clearer reporting and board-defensible decision support.",
            "region": "Europe",
            "cluster_tag": "Regulatory Pressure",
            "kind": "risk",
            "severity": "medium",
            "source": "Government",
            "source_type": "api",
            "timestamp": (now - timedelta(hours=7, minutes=35)).isoformat(),
            "supporting_facts": {
                "themes": ["regulation", "governance", "compliance"],
                "affected_functions": ["legal", "governance", "leadership"],
            },
        },
    ]


def upsert_signals(items: Iterable[Dict[str, Any]]) -> int:
    session: Session = SessionLocal()
    created_or_updated = 0

    try:
        for item in items:
            signal_id = item.get("id") or f"sig_{uuid.uuid4().hex[:16]}"
            timestamp = parse_timestamp(item.get("timestamp"))
            freshness_minutes = calculate_freshness_minutes(timestamp)
            confidence_score = compute_confidence_score(
                source=item.get("source", "Unknown"),
                source_type=item.get("source_type", "manual"),
                headline=item.get("headline", ""),
                summary=item.get("summary", ""),
            )
            signal_strength = compute_signal_strength(
                severity=item.get("severity", "medium"),
                freshness_minutes=freshness_minutes,
                confidence_score=confidence_score,
            )

            existing = session.get(Signal, signal_id)

            payload = {
                "headline": item.get("headline", "Untitled signal"),
                "summary": item.get("summary", ""),
                "region": item.get("region", "Global"),
                "cluster_tag": item.get("cluster_tag", "General"),
                "kind": item.get("kind", "risk"),
                "severity": item.get("severity", "medium"),
                "source": item.get("source", "Unknown"),
                "source_type": item.get("source_type", "manual"),
                "confidence_score": confidence_score,
                "freshness_minutes": freshness_minutes,
                "signal_strength": signal_strength,
                "timestamp": timestamp,
                "supporting_facts": item.get("supporting_facts") or {},
                "metadata_json": item.get("metadata") or {},
            }

            if existing:
                for key, value in payload.items():
                    setattr(existing, key, value)
            else:
                session.add(Signal(id=signal_id, **payload))

            created_or_updated += 1

        session.commit()
        return created_or_updated
    finally:
        session.close()


LAST_REFRESH: Optional[datetime] = None
REFRESH_INTERVAL_MINUTES = 5


def seed_signals_if_empty() -> None:
    session: Session = SessionLocal()
    try:
        count = session.query(Signal).count()
    finally:
        session.close()

    if count == 0:
        upsert_signals(_default_seed_signals())


def get_latest_signals(limit: int = 50, auto_refresh: bool = True) -> Tuple[List[Dict[str, Any]], bool]:
    global LAST_REFRESH
    refreshed = False

    if auto_refresh:
        seed_signals_if_empty()

        now = utc_now()

        if (
            LAST_REFRESH is None
            or (now - LAST_REFRESH).total_seconds() > REFRESH_INTERVAL_MINUTES * 60
        ):
            rss_signals = fetch_rss_signals(max_items_per_feed=8)

            print(f"[GeoPulse] RSS signals fetched: {len(rss_signals)}")

            if rss_signals:
                upsert_signals(rss_signals)
                print("[GeoPulse] Using RSS signals")
            else:
                upsert_signals(_default_seed_signals())
                print("[GeoPulse] Falling back to seed signals")

            LAST_REFRESH = now
            refreshed = True

    session: Session = SessionLocal()
    refreshed = False

    try:
        rows = (
            session.query(Signal)
            .order_by(desc(Signal.signal_strength), desc(Signal.timestamp))
            .limit(max(1, min(limit, 200)))
            .all()
        )

        if not rows:
            upsert_signals(_default_seed_signals())
            refreshed = True
            rows = (
                session.query(Signal)
                .order_by(desc(Signal.signal_strength), desc(Signal.timestamp))
                .limit(max(1, min(limit, 200)))
                .all()
            )

        return [serialise_signal(row) for row in rows], refreshed
    finally:
        session.close()


def refresh_default_signals() -> Dict[str, Any]:
    updated = upsert_signals(_default_seed_signals())
    return {
        "ok": True,
        "updated": updated,
        "message": "Default pilot signals refreshed.",
    }

def select_supporting_signals_for_text(text: str, limit: int = 3) -> List[Dict[str, Any]]:
    signals, _ = get_latest_signals(limit=50, auto_refresh=True)
    lowered = (text or "").lower()

    def match_score(signal: Dict[str, Any]) -> float:
        haystack = " ".join(
            [
                str(signal.get("headline", "")),
                str(signal.get("summary", "")),
                str(signal.get("cluster_tag", "")),
                str(signal.get("region", "")),
            ]
        ).lower()

        score = float(signal.get("signal_strength", 0.0)) * 0.55
        score += float(signal.get("confidence_score", 0.0)) * 0.25

        for word in set(lowered.split()):
            if len(word) >= 4 and word in haystack:
                score += 0.08

        return score

    ranked = sorted(signals, key=match_score, reverse=True)
    return ranked[:limit]