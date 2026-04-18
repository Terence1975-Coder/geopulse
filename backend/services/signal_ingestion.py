from __future__ import annotations

import hashlib
import json
import math
import os
import re
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple
from urllib.parse import urlparse

try:
    import feedparser  # type: ignore
except Exception:  # pragma: no cover
    feedparser = None


# -----------------------------------------------------------------------------
# V8.4 — GeoPulse Signal Intelligence Upgrade Layer
# -----------------------------------------------------------------------------
# Goals:
# - Deterministic deduplication
# - Stronger business relevance filtering
# - Richer clustering with minimal "Market News" fallback
# - Conservative risk-first classification
# - Better signal selection for agent reasoning
# - Additive-only metadata: business_impact_score
#
# This file is intentionally self-contained so it can be dropped into the
# current backend with minimal blast radius.
# -----------------------------------------------------------------------------


UTC = timezone.utc

DEFAULT_SIGNAL_STORE_PATH = os.getenv(
    "GEOPULSE_SIGNAL_STORE_PATH",
    str(Path("backend/data/live_signals.json")),
)

DEFAULT_FEED_URLS: List[str] = [
    # Safe defaults. Replace / extend with your live list if you already have one.
    "https://feeds.reuters.com/reuters/businessNews",
    "https://feeds.reuters.com/reuters/worldNews",
    "https://www.ft.com/rss/home",
    "https://www.marketwatch.com/rss/topstories",
]

STOPWORDS = {
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "by",
    "for",
    "from",
    "in",
    "into",
    "is",
    "it",
    "of",
    "on",
    "or",
    "the",
    "to",
    "with",
    "will",
    "amid",
    "after",
    "before",
    "over",
    "under",
    "up",
    "down",
}

# Expanded clustering intelligence.
RSS_CLUSTER_HINTS: Dict[str, Tuple[str, ...]] = {
    "Supply Chain": (
        "supply chain",
        "logistics",
        "freight",
        "shipping",
        "port",
        "container",
        "lead time",
        "inventory",
        "warehouse",
        "procurement",
        "shortage",
        "bottleneck",
        "route disruption",
        "distribution",
        "fulfilment",
    ),
    "Energy / Shipping": (
        "oil",
        "gas",
        "lng",
        "diesel",
        "power",
        "electricity",
        "grid",
        "utility",
        "energy",
        "fuel",
        "shipping lane",
        "red sea",
        "tanker",
        "freight rate",
        "bunker fuel",
    ),
    "Capital / Finance": (
        "interest rate",
        "borrowing",
        "credit",
        "debt",
        "capital",
        "financing",
        "funding",
        "valuation",
        "private equity",
        "venture",
        "bank",
        "lending",
        "margin",
        "liquidity",
        "cash flow",
        "insolvency",
        "bankruptcy",
        "earnings",
        "profit warning",
    ),
    "Regulatory Pressure": (
        "regulation",
        "regulatory",
        "compliance",
        "antitrust",
        "competition authority",
        "fine",
        "penalty",
        "sanction",
        "reporting rules",
        "supervision",
        "data protection",
        "privacy rules",
        "carbon reporting",
        "esg disclosure",
    ),
    "Trade / Policy": (
        "tariff",
        "trade deal",
        "export control",
        "import duty",
        "trade barrier",
        "customs",
        "industrial policy",
        "subsidy",
        "policy support",
        "trade restriction",
        "trade ministry",
        "trade agreement",
    ),
    "Labour / Workforce": (
        "labour",
        "labor",
        "workforce",
        "wage",
        "union",
        "strike",
        "hiring",
        "layoff",
        "redundancy",
        "skills shortage",
        "employment",
        "staffing",
        "pay rise",
    ),
    "Demand / Commercial": (
        "demand",
        "orders",
        "bookings",
        "sales",
        "spending",
        "consumer",
        "retail",
        "pricing",
        "price cut",
        "discounting",
        "revenue growth",
        "slowdown",
        "commercial pipeline",
        "procurement activity",
        "enterprise spend",
    ),
    "Technology / AI": (
        "ai",
        "artificial intelligence",
        "software",
        "cloud",
        "cyber",
        "semiconductor",
        "chip",
        "automation",
        "saas",
        "platform",
        "data centre",
        "datacenter",
        "compute",
        "model deployment",
    ),
    "Resilience Demand": (
        "resilience",
        "continuity",
        "business continuity",
        "contingency",
        "risk mitigation",
        "operational resilience",
        "preparedness",
        "hardening",
    ),
    "Market Timing": (
        "window",
        "momentum",
        "accelerates",
        "surge",
        "softens",
        "rebound",
        "turnaround",
        "headwind",
        "tailwind",
        "timing",
        "near-term",
        "outlook",
        "guidance",
    ),
}

BUSINESS_POSITIVE_TERMS = {
    "investment": 1.6,
    "funding": 1.3,
    "expansion": 1.4,
    "demand": 1.3,
    "growth": 1.2,
    "procurement": 1.2,
    "efficiency": 1.0,
    "resilience": 1.1,
    "partnership": 1.0,
    "contract": 1.2,
    "orders": 1.2,
    "recovery": 0.9,
    "incentive": 1.1,
    "adoption": 0.9,
    "upgrade": 0.8,
}

BUSINESS_NEGATIVE_TERMS = {
    "disruption": 1.7,
    "shortage": 1.6,
    "delay": 1.2,
    "inflation": 1.5,
    "tariff": 1.6,
    "sanction": 1.5,
    "fine": 1.4,
    "penalty": 1.3,
    "strike": 1.4,
    "layoff": 1.0,
    "slowdown": 1.3,
    "decline": 1.2,
    "drop": 1.0,
    "margin pressure": 1.7,
    "cost pressure": 1.6,
    "bankruptcy": 1.8,
    "insolvency": 1.8,
    "warning": 1.1,
    "headwind": 1.0,
    "volatility": 1.2,
    "export control": 1.5,
}

BUSINESS_RELEVANCE_TERMS = {
    # Supply chain / operations
    "supply chain": 2.2,
    "logistics": 2.0,
    "shipping": 1.9,
    "freight": 1.9,
    "inventory": 1.4,
    "warehouse": 1.1,
    "procurement": 1.8,
    # Energy / cost / inflation
    "energy": 1.8,
    "power": 1.2,
    "electricity": 1.4,
    "fuel": 1.4,
    "gas": 1.2,
    "oil": 1.2,
    "inflation": 1.7,
    "cost": 1.5,
    "margin": 1.5,
    # Regulation / trade
    "regulation": 1.8,
    "regulatory": 1.8,
    "compliance": 1.4,
    "tariff": 1.7,
    "trade": 1.3,
    "export": 1.3,
    "import": 1.3,
    "policy": 1.1,
    "subsidy": 1.2,
    # Labour / demand / investment
    "labour": 1.5,
    "labor": 1.5,
    "workforce": 1.5,
    "wage": 1.1,
    "demand": 1.8,
    "consumer": 1.2,
    "sales": 1.2,
    "orders": 1.4,
    "investment": 1.7,
    "funding": 1.4,
    "capital": 1.2,
    "borrowing": 1.2,
    # Technology
    "technology": 1.1,
    "ai": 1.2,
    "artificial intelligence": 1.3,
    "cloud": 0.9,
    "automation": 1.0,
    "semiconductor": 1.0,
    # Executive relevance
    "resilience": 1.4,
    "commercial": 1.0,
    "revenue": 1.3,
    "earnings": 1.4,
}

# Pure politics / generic public affairs terms that should be filtered unless
# the article also has clear business impact.
PURE_POLITICS_TERMS = {
    "election",
    "polling",
    "cabinet",
    "minister",
    "prime minister",
    "president",
    "campaign",
    "parliament",
    "congress",
    "senate",
    "party leader",
    "manifesto",
    "coalition talks",
    "vote count",
    "approval rating",
    "foreign minister",
}

BUSINESS_IMPACT_OVERRIDE_TERMS = {
    "tariff",
    "trade",
    "subsidy",
    "regulation",
    "regulatory",
    "sanction",
    "export control",
    "inflation",
    "energy",
    "oil",
    "gas",
    "shipping",
    "supply chain",
    "wage",
    "labor",
    "labour",
    "investment",
    "funding",
    "earnings",
    "demand",
    "consumer spending",
    "pricing",
}


# -----------------------------------------------------------------------------
# Text helpers
# -----------------------------------------------------------------------------


def _utcnow() -> datetime:
    return datetime.now(tz=UTC)


def _safe_iso(dt: datetime) -> str:
    return dt.astimezone(UTC).isoformat()


def _parse_datetime(value: Any) -> Optional[datetime]:
    if isinstance(value, datetime):
        return value.astimezone(UTC) if value.tzinfo else value.replace(tzinfo=UTC)

    if not value:
        return None

    text = str(value).strip()
    if not text:
        return None

    try:
        if text.endswith("Z"):
            text = text[:-1] + "+00:00"
        parsed = datetime.fromisoformat(text)
        return parsed.astimezone(UTC) if parsed.tzinfo else parsed.replace(tzinfo=UTC)
    except Exception:
        return None


def _normalise_ws(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").strip())


def _normalise_text(text: str) -> str:
    text = _normalise_ws(text).lower()
    text = re.sub(r"[“”\"'`]", "", text)
    text = re.sub(r"[^a-z0-9%&/\-\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _tokenise(text: str) -> List[str]:
    return [
        token
        for token in re.findall(r"[a-z0-9][a-z0-9/\-]+", _normalise_text(text))
        if token not in STOPWORDS
    ]


def _keyword_hits(text: str, weighted_terms: Dict[str, float]) -> float:
    haystack = _normalise_text(text)
    score = 0.0
    for term, weight in weighted_terms.items():
        if term in haystack:
            score += weight
    return score


def _source_host(source: str, link: str) -> str:
    if source and str(source).strip():
        return _normalise_text(str(source))
    try:
        return urlparse(link).netloc.lower().replace("www.", "")
    except Exception:
        return "unknown-source"


def _stable_signal_id(source: str, headline: str) -> str:
    key = f"{_normalise_text(source)}|{_normalise_text(headline)}"
    digest = hashlib.sha1(key.encode("utf-8")).hexdigest()[:16]
    return f"sig_{digest}"


def _relative_time(minutes: int) -> str:
    if minutes < 60:
        return f"{minutes} mins ago"
    hours = round(minutes / 60)
    if hours < 24:
        return f"{hours}h ago"
    days = round(hours / 24)
    return f"{days}d ago"


def _lifecycle_from_minutes(minutes: int) -> str:
    if minutes <= 60:
        return "Fresh"
    if minutes <= 360:
        return "Active"
    return "Aging"


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def _as_float_01(value: Any, default: float = 0.0) -> float:
    try:
        num = float(value)
    except Exception:
        return default
    if num > 1.0:
        num = num / 100.0
    return _clamp(num, 0.0, 1.0)


# -----------------------------------------------------------------------------
# Business relevance / clustering / classification
# -----------------------------------------------------------------------------


def is_business_relevant(headline: str, summary: str) -> bool:
    text = f"{headline or ''} {summary or ''}".strip()
    norm = _normalise_text(text)

    if not norm:
        return False

    relevance_score = _keyword_hits(norm, BUSINESS_RELEVANCE_TERMS)

    politics_hits = sum(1 for term in PURE_POLITICS_TERMS if term in norm)
    override_hits = sum(1 for term in BUSINESS_IMPACT_OVERRIDE_TERMS if term in norm)

    # Strong business language always passes.
    if relevance_score >= 2.2:
        return True

    # Politics without business spillover gets filtered out.
    if politics_hits >= 2 and override_hits == 0:
        return False

    # Generic political story with no business impact.
    if politics_hits >= 1 and relevance_score < 1.2 and override_hits == 0:
        return False

    # Too generic / soft.
    if relevance_score < 1.0:
        return False

    return True


def infer_cluster_tag(headline: str, summary: str) -> str:
    text = _normalise_text(f"{headline} {summary}")
    best_cluster = "Market News"
    best_score = 0.0

    for cluster, hints in RSS_CLUSTER_HINTS.items():
        score = 0.0
        for hint in hints:
            if hint in text:
                score += 1.0 if " " in hint else 0.7
        if score > best_score:
            best_cluster = cluster
            best_score = score

    # Near-zero fallback to Market News:
    # infer from wider executive business cues before giving up.
    if best_cluster == "Market News":
        if any(term in text for term in ("price", "margin", "cost", "inflation", "earnings")):
            return "Capital / Finance"
        if any(term in text for term in ("consumer", "demand", "sales", "orders", "retail")):
            return "Demand / Commercial"
        if any(term in text for term in ("cloud", "ai", "software", "chip", "cyber")):
            return "Technology / AI"
        if any(term in text for term in ("tariff", "trade", "policy", "export", "import")):
            return "Trade / Policy"
        if any(term in text for term in ("power", "oil", "gas", "energy", "shipping")):
            return "Energy / Shipping"
        if any(term in text for term in ("labour", "labor", "wage", "strike", "hiring")):
            return "Labour / Workforce"
        if any(term in text for term in ("resilience", "continuity", "mitigation")):
            return "Resilience Demand"

    return best_cluster


def infer_kind(headline: str, summary: str, cluster_tag: str = "") -> str:
    text = _normalise_text(f"{headline} {summary} {cluster_tag}")

    positive_score = _keyword_hits(text, BUSINESS_POSITIVE_TERMS)
    negative_score = _keyword_hits(text, BUSINESS_NEGATIVE_TERMS)

    # Cluster-aware risk bias.
    if cluster_tag in {
        "Supply Chain",
        "Energy / Shipping",
        "Regulatory Pressure",
        "Labour / Workforce",
        "Capital / Finance",
    }:
        negative_score += 0.35

    if cluster_tag in {"Resilience Demand", "Demand / Commercial", "Technology / AI"}:
        positive_score += 0.15

    # Default bias = risk.
    if positive_score >= negative_score + 1.1:
        return "opportunity"
    return "risk"


def infer_severity(headline: str, summary: str, kind: str, cluster_tag: str = "") -> str:
    text = _normalise_text(f"{headline} {summary} {cluster_tag}")
    severity_score = 0.0

    high_terms = (
        "crisis",
        "halt",
        "collapse",
        "surge",
        "plunge",
        "severe",
        "major",
        "sharp",
        "record high",
        "record low",
        "bankruptcy",
        "insolvency",
        "war",
        "attack",
        "shutdown",
        "disruption",
    )
    medium_terms = (
        "pressure",
        "volatility",
        "slowdown",
        "softens",
        "warning",
        "delay",
        "uncertainty",
        "watch",
    )

    for term in high_terms:
        if term in text:
            severity_score += 1.0
    for term in medium_terms:
        if term in text:
            severity_score += 0.45

    if kind == "risk" and cluster_tag in {"Supply Chain", "Energy / Shipping", "Regulatory Pressure"}:
        severity_score += 0.4

    if severity_score >= 1.8:
        return "high"
    if severity_score >= 0.7:
        return "medium"
    return "low"


def compute_business_impact_score(
    headline: str,
    summary: str,
    cluster_tag: str,
    severity: str,
    signal_strength: float,
    confidence_score: float,
) -> float:
    text = _normalise_text(f"{headline} {summary}")
    relevance_density = _keyword_hits(text, BUSINESS_RELEVANCE_TERMS)
    cluster_bonus = 0.25 if cluster_tag != "Market News" else 0.0
    severity_bonus = {"low": 0.08, "medium": 0.18, "high": 0.32}.get(severity, 0.0)

    raw = (
        (min(relevance_density, 5.0) / 5.0) * 0.40
        + signal_strength * 0.25
        + confidence_score * 0.20
        + severity_bonus
        + cluster_bonus
    )
    return round(_clamp(raw, 0.0, 1.0), 3)


def compute_signal_strength(
    headline: str,
    summary: str,
    kind: str,
    severity: str,
    cluster_tag: str,
) -> float:
    text = _normalise_text(f"{headline} {summary}")
    relevance = _keyword_hits(text, BUSINESS_RELEVANCE_TERMS)
    polarity = _keyword_hits(text, BUSINESS_NEGATIVE_TERMS if kind == "risk" else BUSINESS_POSITIVE_TERMS)

    severity_weight = {"low": 0.08, "medium": 0.18, "high": 0.30}.get(severity, 0.0)
    cluster_weight = 0.08 if cluster_tag != "Market News" else 0.0

    raw = (min(relevance, 4.0) / 4.0) * 0.48 + min(polarity, 3.0) / 3.0 * 0.14 + severity_weight + cluster_weight
    return round(_clamp(raw, 0.0, 1.0), 3)


def compute_confidence_score(
    headline: str,
    summary: str,
    source: str,
    link: str,
) -> float:
    text = _normalise_text(f"{headline} {summary}")
    host = _source_host(source, link)

    base = 0.62

    if any(name in host for name in ("reuters", "bloomberg", "ft.com", "financialtimes", "wsj", "apnews")):
        base += 0.18
    elif any(name in host for name in ("marketwatch", "cnbc", "fortune", "forbes")):
        base += 0.10
    else:
        base += 0.04

    if len(text) > 140:
        base += 0.04
    if _keyword_hits(text, BUSINESS_RELEVANCE_TERMS) >= 2.0:
        base += 0.05

    return round(_clamp(base, 0.0, 0.98), 3)


# -----------------------------------------------------------------------------
# Normalisation and store
# -----------------------------------------------------------------------------


def _guess_region(entry: Dict[str, Any], text: str) -> str:
    explicit = str(entry.get("region") or "").strip()
    if explicit:
        return explicit

    text = _normalise_text(text)

    if "uk" in text or "britain" in text or "united kingdom" in text:
        return "UK"
    if "europe" in text or "eu " in f"{text} " or "eurozone" in text:
        return "Europe"
    if "us " in f"{text} " or "u.s." in text or "united states" in text or "america" in text:
        return "United States"
    if "china" in text:
        return "China"
    if "asia" in text:
        return "Asia"
    if "global" in text or "world" in text:
        return "Global"

    return "Global"


def _entry_timestamp(entry: Dict[str, Any], now: Optional[datetime] = None) -> datetime:
    now = now or _utcnow()

    for key in ("published", "published_at", "updated", "updated_at", "timestamp", "detected_at"):
        parsed = _parse_datetime(entry.get(key))
        if parsed:
            return parsed

    structured = entry.get("published_parsed") or entry.get("updated_parsed")
    if structured and hasattr(structured, "tm_year"):
        try:
            return datetime(
                structured.tm_year,
                structured.tm_mon,
                structured.tm_mday,
                structured.tm_hour,
                structured.tm_min,
                structured.tm_sec,
                tzinfo=UTC,
            )
        except Exception:
            pass

    return now


def _to_signal_dict(entry: Dict[str, Any], now: Optional[datetime] = None) -> Optional[Dict[str, Any]]:
    now = now or _utcnow()

    headline = _normalise_ws(str(entry.get("headline") or entry.get("title") or ""))
    summary = _normalise_ws(
        str(
            entry.get("summary")
            or entry.get("description")
            or entry.get("snippet")
            or ""
        )
    )
    source = _normalise_ws(str(entry.get("source") or entry.get("publisher") or ""))
    link = _normalise_ws(str(entry.get("url") or entry.get("link") or ""))

    if not headline:
        return None

    if not is_business_relevant(headline, summary):
        return None

    source_name = source or _source_host("", link)
    timestamp = _entry_timestamp(entry, now=now)
    freshness_minutes = max(0, int((now - timestamp).total_seconds() // 60))
    cluster_tag = infer_cluster_tag(headline, summary)
    kind = infer_kind(headline, summary, cluster_tag=cluster_tag)
    severity = infer_severity(headline, summary, kind=kind, cluster_tag=cluster_tag)
    signal_strength = compute_signal_strength(
        headline=headline,
        summary=summary,
        kind=kind,
        severity=severity,
        cluster_tag=cluster_tag,
    )
    confidence_score = compute_confidence_score(
        headline=headline,
        summary=summary,
        source=source_name,
        link=link,
    )
    business_impact_score = compute_business_impact_score(
        headline=headline,
        summary=summary,
        cluster_tag=cluster_tag,
        severity=severity,
        signal_strength=signal_strength,
        confidence_score=confidence_score,
    )

    signal_id = _stable_signal_id(source_name, headline)
    region = _guess_region(entry, f"{headline} {summary}")
    lifecycle = _lifecycle_from_minutes(freshness_minutes)

    return {
        "id": signal_id,
        "headline": headline,
        "summary": summary,
        "source": source_name,
        "source_type": entry.get("source_type") or "rss",
        "url": link or None,
        "source_url": link or None,
        "region": region,
        "cluster_tag": cluster_tag,
        "kind": kind,
        "severity": severity,
        "confidence_score": confidence_score,
        "freshness_minutes": freshness_minutes,
        "signal_strength": signal_strength,
        "business_impact_score": business_impact_score,  # additive only
        "timestamp": _safe_iso(timestamp),
        "detected_at": entry.get("detected_at") or _safe_iso(now),
        "updated_at": _safe_iso(now),
        "lifecycle": lifecycle,
        "relative_time": _relative_time(freshness_minutes),
    }


def _ensure_store_dir(path: str) -> None:
    Path(path).parent.mkdir(parents=True, exist_ok=True)


def _load_signal_store(path: str = DEFAULT_SIGNAL_STORE_PATH) -> List[Dict[str, Any]]:
    try:
        file_path = Path(path)
        if not file_path.exists():
            return []
        data = json.loads(file_path.read_text(encoding="utf-8"))
        return data if isinstance(data, list) else []
    except Exception:
        return []


def _save_signal_store(signals: List[Dict[str, Any]], path: str = DEFAULT_SIGNAL_STORE_PATH) -> None:
    _ensure_store_dir(path)
    Path(path).write_text(
        json.dumps(signals, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )


def _deduplicate_signals(signals: Iterable[Dict[str, Any]]) -> List[Dict[str, Any]]:
    # Deterministic key = stable id derived from source + headline.
    by_id: Dict[str, Dict[str, Any]] = {}

    for signal in signals:
        signal_id = str(signal.get("id") or "").strip()
        if not signal_id:
            continue

        existing = by_id.get(signal_id)
        if existing is None:
            by_id[signal_id] = dict(signal)
            continue

        # Same article updates existing record rather than creating a duplicate.
        existing_ts = _parse_datetime(existing.get("timestamp")) or datetime.min.replace(tzinfo=UTC)
        new_ts = _parse_datetime(signal.get("timestamp")) or datetime.min.replace(tzinfo=UTC)

        chosen = dict(existing)
        chosen.update(signal if new_ts >= existing_ts else existing)

        # Preserve earliest detected_at for continuity.
        existing_detected = _parse_datetime(existing.get("detected_at"))
        new_detected = _parse_datetime(signal.get("detected_at"))
        earliest = min(
            [dt for dt in (existing_detected, new_detected) if dt is not None],
            default=None,
        )
        if earliest:
            chosen["detected_at"] = _safe_iso(earliest)

        by_id[signal_id] = chosen

    return list(by_id.values())


def upsert_signals(
    incoming_signals: Iterable[Dict[str, Any]],
    path: str = DEFAULT_SIGNAL_STORE_PATH,
) -> List[Dict[str, Any]]:
    current = _load_signal_store(path=path)
    combined = _deduplicate_signals([*current, *incoming_signals])

    # Recompute freshness/lifecycle on write.
    now = _utcnow()
    refreshed: List[Dict[str, Any]] = []
    for signal in combined:
        ts = _parse_datetime(signal.get("timestamp")) or now
        freshness_minutes = max(0, int((now - ts).total_seconds() // 60))
        signal["freshness_minutes"] = freshness_minutes
        signal["relative_time"] = _relative_time(freshness_minutes)
        signal["lifecycle"] = _lifecycle_from_minutes(freshness_minutes)
        signal["updated_at"] = _safe_iso(now)
        refreshed.append(signal)

    refreshed.sort(
        key=lambda s: (
            float(s.get("business_impact_score", 0.0)),
            float(s.get("signal_strength", 0.0)),
            float(s.get("confidence_score", 0.0)),
            -int(s.get("freshness_minutes", 999999)),
        ),
        reverse=True,
    )

    _save_signal_store(refreshed, path=path)
    return refreshed


# -----------------------------------------------------------------------------
# RSS refresh
# -----------------------------------------------------------------------------


def _feed_entries_to_signals(
    entries: Iterable[Dict[str, Any]],
    now: Optional[datetime] = None,
) -> List[Dict[str, Any]]:
    now = now or _utcnow()
    signals: List[Dict[str, Any]] = []

    for entry in entries:
        signal = _to_signal_dict(entry, now=now)
        if signal:
            signals.append(signal)

    return _deduplicate_signals(signals)


def refresh_live_signals(
    feed_urls: Optional[List[str]] = None,
    path: str = DEFAULT_SIGNAL_STORE_PATH,
    max_entries_per_feed: int = 25,
) -> List[Dict[str, Any]]:
    urls = feed_urls or DEFAULT_FEED_URLS
    now = _utcnow()

    if feedparser is None:
        # Graceful fallback: preserve existing store if feedparser is unavailable.
        return get_live_signals(path=path)

    collected_entries: List[Dict[str, Any]] = []

    for url in urls:
        try:
            parsed = feedparser.parse(url)
        except Exception:
            continue

        source_name = urlparse(url).netloc.replace("www.", "")
        for item in list(getattr(parsed, "entries", []) or [])[:max_entries_per_feed]:
            entry = dict(item)
            entry["source"] = entry.get("source") or source_name
            entry["source_type"] = "rss"
            entry["link"] = entry.get("link") or url
            collected_entries.append(entry)

    incoming_signals = _feed_entries_to_signals(collected_entries, now=now)

    if not incoming_signals:
        return get_live_signals(path=path)

    return upsert_signals(incoming_signals, path=path)


# Backward-compatible alias if old code calls a different refresh name.
refresh_signals_from_rss = refresh_live_signals


def get_live_signals(
    limit: Optional[int] = None,
    path: str = DEFAULT_SIGNAL_STORE_PATH,
) -> List[Dict[str, Any]]:
    now = _utcnow()
    signals = _load_signal_store(path=path)

    refreshed: List[Dict[str, Any]] = []
    for signal in signals:
        ts = _parse_datetime(signal.get("timestamp")) or now
        freshness_minutes = max(0, int((now - ts).total_seconds() // 60))
        signal["freshness_minutes"] = freshness_minutes
        signal["relative_time"] = _relative_time(freshness_minutes)
        signal["lifecycle"] = _lifecycle_from_minutes(freshness_minutes)
        refreshed.append(signal)

    refreshed.sort(
        key=lambda s: (
            float(s.get("business_impact_score", 0.0)),
            float(s.get("signal_strength", 0.0)),
            float(s.get("confidence_score", 0.0)),
            -int(s.get("freshness_minutes", 999999)),
        ),
        reverse=True,
    )

    if limit is not None:
        return refreshed[:limit]
    return refreshed


# -----------------------------------------------------------------------------
# Agent signal selection
# -----------------------------------------------------------------------------


def _extract_query_features(text: str) -> Dict[str, Any]:
    norm = _normalise_text(text or "")
    tokens = set(_tokenise(norm))
    matched_clusters = set()

    for cluster, hints in RSS_CLUSTER_HINTS.items():
        for hint in hints:
            if hint in norm:
                matched_clusters.add(cluster)
                break

    return {
        "tokens": tokens,
        "clusters": matched_clusters,
    }


def _score_signal_relevance(
    signal: Dict[str, Any],
    query_features: Dict[str, Any],
) -> float:
    score = 0.0

    headline = _normalise_text(signal.get("headline", ""))
    summary = _normalise_text(signal.get("summary", ""))

    signal_tokens = set(_tokenise(f"{headline} {summary}"))
    overlap = query_features["tokens"].intersection(signal_tokens)

    if overlap:
        score += min(0.4, 0.05 * len(overlap))

    if signal.get("cluster_tag") in query_features["clusters"]:
        score += 0.4

    confidence = _as_float_01(signal.get("confidence_score", 0.0), 0.0)
    strength = _as_float_01(signal.get("signal_strength", 0.0), 0.0)

    score += 0.1 * confidence
    score += 0.1 * strength

    freshness = float(signal.get("freshness_minutes", 999999) or 999999)
    if freshness < 60:
        score += 0.1
    elif freshness < 180:
        score += 0.05

    return round(score, 3)


def select_supporting_signals_for_text(
    text: str,
    limit: int = 3,
) -> List[Dict[str, Any]]:
    signals = get_live_signals(limit=None)

    if not signals:
        signals = refresh_live_signals()

    if not isinstance(signals, list) or not signals:
        return []

    query_features = _extract_query_features(text)

    scored: List[Tuple[float, Dict[str, Any]]] = []

    for signal in signals:
        if not isinstance(signal, dict):
            continue

        relevance = _score_signal_relevance(signal, query_features)
        scored.append((relevance, signal))

    scored.sort(key=lambda x: x[0], reverse=True)

    selected = [item[1] for item in scored[:limit]]
    if selected:
        return selected

    fallback = sorted(
        [s for s in signals if isinstance(s, dict)],
        key=lambda s: (
            float(s.get("business_impact_score", 0.0) or 0.0),
            float(s.get("signal_strength", 0.0) or 0.0),
            float(s.get("confidence_score", 0.0) or 0.0),
        ),
        reverse=True,
    )

    return fallback[:limit]