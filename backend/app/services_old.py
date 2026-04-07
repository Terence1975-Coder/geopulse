import csv
import io
import uuid
from typing import Dict, List

EVENTS: Dict[str, dict] = {}
ANALYSES: Dict[str, dict] = {}
COMPANIES: Dict[str, dict] = {}
COMPANY_ANALYSES: Dict[str, dict] = {}
SOURCES: Dict[str, dict] = {}

def level_score(value: str) -> float:
    mapping = {"low": 0.3, "medium": 0.6, "high": 1.0}
    return mapping.get((value or "medium").lower(), 0.6)

def relevance_score(company: dict, headline: str, body: str, region: str = "", topics: List[str] = None) -> float:
    topics = topics or []
    text = f"{headline} {body} {region} {' '.join(topics)}".lower()

    region_match = 1.0 if company.get("primary_country", "").lower() in text else 0.4
    supplier_match = 1.0 if any(r.lower() in text for r in company.get("key_supplier_regions", [])) else 0.5
    industry_match = 1.0 if company.get("industry", "").lower() in text else 0.5
    energy_match = level_score(company.get("fuel_energy_sensitivity"))
    supply_match = level_score(company.get("supply_chain_complexity"))
    trade_match = max(level_score(company.get("import_dependency")), level_score(company.get("export_dependency")))
    margin_match = level_score(company.get("margin_sensitivity"))

    score = (
        region_match * 0.18 +
        supplier_match * 0.18 +
        industry_match * 0.14 +
        energy_match * 0.14 +
        supply_match * 0.14 +
        trade_match * 0.11 +
        margin_match * 0.11
    )
    return round(min(score, 1.0), 2)

def create_event(payload: dict):
    event_id = str(uuid.uuid4())
    payload["event_id"] = event_id
    EVENTS[event_id] = payload
    return EVENTS[event_id]

def list_events():
    return list(EVENTS.values())[::-1]

def get_event(event_id: str):
    return EVENTS.get(event_id)

def analyze_event(event_id: str):
    event = EVENTS.get(event_id)
    if not event:
        return None

    source_confidence_boost = 0.0
    matched_source = find_source_by_name_or_url(event.get("source_name", ""), event.get("source_url", ""))
    if matched_source:
        source_confidence_boost = round((matched_source.get("trust_score", 0.8) - 0.5) * 0.3, 2)

    confidence = round(min(0.62 + source_confidence_boost, 0.98), 2)

    analysis = {
        "event": {
            "title": event["headline"],
            "summary": event["body"],
            "type": infer_event_type(event),
            "status": "confirmed",
            "source_name": event.get("source_name", "Manual"),
            "region": event.get("region", ""),
            "topics": event.get("topics", [])
        },
        "risk_scores": {
            "energy_risk": infer_energy_risk(event),
            "supply_chain_risk": infer_supply_chain_risk(event),
            "inflation_risk": infer_inflation_risk(event),
            "consumer_demand_impact": infer_demand_risk(event),
            "financial_market_volatility": infer_market_risk(event),
            "overall_business_risk_index": infer_overall_risk(event),
            "trend": "rising",
            "confidence": confidence
        },
        "sector_impacts": infer_sector_impacts(event),
        "opportunities": infer_opportunities(event),
        "scenarios": infer_scenarios(event),
        "executive_summary": infer_summary(event),
        "recommended_actions": infer_actions(event),
        "source_assessment": {
            "matched_trusted_source": matched_source["source_name"] if matched_source else None,
            "source_trust_score": matched_source.get("trust_score") if matched_source else None
        }
    }

    analysis_id = str(uuid.uuid4())
    ANALYSES[analysis_id] = {"analysis_id": analysis_id, "event_id": event_id, "analysis": analysis}
    return {"analysis_id": analysis_id, "status": "complete", "analysis": analysis}

def create_company(payload: dict):
    company_id = str(uuid.uuid4())
    COMPANIES[company_id] = {"company_id": company_id, **payload}
    return COMPANIES[company_id]

def list_companies():
    return list(COMPANIES.values())[::-1]

def analyze_company(event_id: str, company_id: str):
    event = EVENTS.get(event_id)
    company = COMPANIES.get(company_id)
    if not event or not company:
        return None

    base = analyze_event(event_id)
    if not base:
        return None

    relevance = relevance_score(
        company,
        event["headline"],
        event["body"],
        event.get("region", ""),
        event.get("topics", [])
    )

    company_analysis = {
        "company_id": company_id,
        "company_name": company["company_name"],
        "profile_used": True,
        "relevance_score": relevance,
        "company_specific_risk": {
            "overall_company_exposure": round(relevance * 10),
            "fuel_cost_exposure": 6 if company.get("fuel_energy_sensitivity") == "high" else 4,
            "supplier_disruption_exposure": 8 if company.get("supply_chain_complexity") == "high" else 5,
            "customer_demand_exposure": 5,
            "margin_pressure_exposure": 7 if company.get("margin_sensitivity") == "high" else 4
        },
        "business_impact": {
            "why_this_matters": "This event may affect costs, supply continuity, logistics planning, and margin protection for this company.",
            "most_exposed_functions": ["procurement", "operations", "pricing"],
            "likely_operational_effects": ["higher supply uncertainty", "more planning complexity"],
            "likely_commercial_effects": ["margin pressure", "pricing review required"]
        },
        "company_actions": [
            "review supplier regions",
            "stress-test margin assumptions",
            "prepare customer communication plan"
        ],
        "upgrade_note": "Personalization active"
    }

    company_analysis_id = str(uuid.uuid4())
    COMPANY_ANALYSES[company_analysis_id] = company_analysis

    return {
        "analysis_id": base["analysis_id"],
        "status": "complete",
        "analysis": base["analysis"],
        "company_analysis": company_analysis
    }

def dashboard_brief():
    latest_analysis = list(ANALYSES.values())[-1]["analysis"] if ANALYSES else None
    latest_company = list(COMPANY_ANALYSES.values())[-1] if COMPANY_ANALYSES else None

    top_sources = sorted(
        [s for s in SOURCES.values() if s.get("active", True)],
        key=lambda x: (x.get("trust_score", 0), x.get("priority_weight", 0)),
        reverse=True
    )[:5]

    return {
        "status": "ok" if latest_analysis else "empty",
        "cards": {
            "top_event": latest_analysis["event"]["title"] if latest_analysis else None,
            "overall_risk": latest_analysis["risk_scores"]["overall_business_risk_index"] if latest_analysis else None,
            "analysis": latest_analysis,
            "company_overlay": latest_company,
            "trusted_sources_count": len(SOURCES),
            "top_sources": top_sources
        }
    }

def create_source(payload: dict):
    source_id = str(uuid.uuid4())
    record = {"source_id": source_id, **payload}
    SOURCES[source_id] = record
    return record

def list_sources():
    return list(SOURCES.values())[::-1]

def paste_sources(lines: str):
    created = []
    for raw_line in lines.splitlines():
        line = raw_line.strip()
        if not line:
            continue

        if "," in line:
            parts = [p.strip() for p in line.split(",")]
            source_name = parts[0] if len(parts) > 0 else "Unknown"
            base_url = parts[1] if len(parts) > 1 else parts[0]
            source_type = parts[2] if len(parts) > 2 else "news"
            country = parts[3] if len(parts) > 3 else "Global"
            region = parts[4] if len(parts) > 4 else "Global"
            topics = [t.strip() for t in (parts[5].split("|") if len(parts) > 5 and parts[5] else [])]
        else:
            source_name = line
            base_url = line
            source_type = "news"
            country = "Global"
            region = "Global"
            topics = []

        created.append(create_source({
            "source_name": source_name,
            "base_url": clean_domain(base_url),
            "source_type": source_type,
            "country": country,
            "region": region,
            "topics": topics,
            "trust_score": 0.85,
            "priority_weight": 0.8,
            "active": True,
            "notes": "Imported from pasted list"
        }))
    return created

def upload_sources_csv_text(csv_text: str):
    f = io.StringIO(csv_text)
    reader = csv.DictReader(f)
    created = []

    for row in reader:
        topics_raw = row.get("topics", "") or ""
        topics = [t.strip() for t in topics_raw.replace(";", "|").split("|") if t.strip()]

        created.append(create_source({
            "source_name": row.get("source_name", "Unknown"),
            "base_url": clean_domain(row.get("base_url", "")),
            "source_type": row.get("source_type", "news"),
            "country": row.get("country", "Global"),
            "region": row.get("region", "Global"),
            "topics": topics,
            "trust_score": safe_float(row.get("trust_score", 0.8), 0.8),
            "priority_weight": safe_float(row.get("priority_weight", 0.8), 0.8),
            "active": str(row.get("active", "true")).lower() in ["true", "1", "yes", "y"],
            "notes": row.get("notes", "")
        }))
    return created

def safe_float(value, default):
    try:
        return float(value)
    except Exception:
        return default

def clean_domain(value: str):
    v = (value or "").strip().lower()
    v = v.replace("https://", "").replace("http://", "")
    v = v.split("/")[0]
    return v

def find_source_by_name_or_url(source_name: str, source_url: str):
    source_name_l = (source_name or "").lower()
    source_url_l = clean_domain(source_url or "")
    for s in SOURCES.values():
        if s["source_name"].lower() == source_name_l:
            return s
        if s["base_url"] and s["base_url"] in source_url_l:
            return s
    return None

def infer_event_type(event: dict):
    text = f"{event.get('headline', '')} {event.get('body', '')}".lower()
    if "sanction" in text or "policy" in text or "regulation" in text:
        return "policy_change"
    if "shipping" in text or "port" in text or "strait" in text:
        return "trade_disruption"
    if "oil" in text or "gas" in text or "energy" in text:
        return "energy_shock"
    if "cyber" in text or "attack" in text:
        return "security_threat"
    return "geopolitical_disruption"

def infer_energy_risk(event: dict):
    text = f"{event.get('headline', '')} {event.get('body', '')}".lower()
    return 7 if ("oil" in text or "gas" in text or "energy" in text or "hormuz" in text) else 4

def infer_supply_chain_risk(event: dict):
    text = f"{event.get('headline', '')} {event.get('body', '')}".lower()
    return 7 if ("shipping" in text or "port" in text or "trade" in text or "logistics" in text or "strait" in text) else 4

def infer_inflation_risk(event: dict):
    text = f"{event.get('headline', '')} {event.get('body', '')}".lower()
    return 6 if ("cost" in text or "price" in text or "inflation" in text or "oil" in text) else 4

def infer_demand_risk(event: dict):
    text = f"{event.get('headline', '')} {event.get('body', '')}".lower()
    return 5 if ("consumer" in text or "retail" in text or "demand" in text) else 4

def infer_market_risk(event: dict):
    text = f"{event.get('headline', '')} {event.get('body', '')}".lower()
    return 6 if ("market" in text or "volatility" in text or "oil" in text or "uncertainty" in text) else 4

def infer_overall_risk(event: dict):
    vals = [
        infer_energy_risk(event),
        infer_supply_chain_risk(event),
        infer_inflation_risk(event),
        infer_demand_risk(event),
        infer_market_risk(event)
    ]
    return round(sum(vals) / len(vals))

def infer_sector_impacts(event: dict):
    text = f"{event.get('headline', '')} {event.get('body', '')}".lower()
    impacts = []
    if "shipping" in text or "strait" in text or "port" in text:
        impacts.append({"sector": "logistics", "impact": "route disruption risk", "severity": 7})
    if "oil" in text or "energy" in text or "fuel" in text:
        impacts.append({"sector": "energy", "impact": "fuel price volatility", "severity": 7})
    impacts.append({"sector": "retail", "impact": "import timing uncertainty", "severity": 5})
    return impacts

def infer_opportunities(event: dict):
    text = f"{event.get('headline', '')} {event.get('body', '')}".lower()
    items = [{"theme": "resilience planning", "why": "firms may spend more on scenario planning"}]
    if "fuel" in text or "oil" in text:
        items.append({"theme": "EV demand", "why": "fuel anxiety can improve EV interest"})
    return items

def infer_scenarios(event: dict):
    return [
        {"name": "base_case", "summary": "elevated risk without severe escalation"},
        {"name": "stress_case", "summary": "disruption pushes costs and delays higher"}
    ]

def infer_summary(event: dict):
    return "GeoPulse detects elevated business risk with strongest pressure on supply chains, costs, and fuel-sensitive operations."

def infer_actions(event: dict):
    return [
        "review supplier exposure",
        "stress-test pricing assumptions",
        "monitor shipping and energy costs"
    ]

def seed_demo_sources():
    if SOURCES:
        return
    create_source({
        "source_name": "Reuters",
        "base_url": "reuters.com",
        "source_type": "news",
        "country": "Global",
        "region": "Global",
        "topics": ["geopolitics", "markets", "energy"],
        "trust_score": 0.92,
        "priority_weight": 0.9,
        "active": True,
        "notes": "Seeded trusted source"
    })
    create_source({
        "source_name": "UK Government",
        "base_url": "gov.uk",
        "source_type": "government",
        "country": "UK",
        "region": "Europe",
        "topics": ["policy", "law", "regulation"],
        "trust_score": 0.98,
        "priority_weight": 1.0,
        "active": True,
        "notes": "Seeded trusted source"
    })
    create_source({
        "source_name": "European Commission",
        "base_url": "ec.europa.eu",
        "source_type": "government",
        "country": "EU",
        "region": "Europe",
        "topics": ["policy", "trade", "regulation"],
        "trust_score": 0.96,
        "priority_weight": 0.95,
        "active": True,
        "notes": "Seeded trusted source"
    })