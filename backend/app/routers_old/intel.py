from fastapi import APIRouter, HTTPException
from typing import Any, Dict

from app.routers.company_profiles import COMPANY_PROFILE_STORE
from app.routers.events import EVENT_STORE

router = APIRouter(prefix="/intel", tags=["intel"])


def score_company_exposure(event: Dict[str, Any], company_profile: Dict[str, Any]) -> Dict[str, Any]:
    region = (event.get("region") or "").lower()
    topics = [t.lower() for t in event.get("topics", [])]

    energy = company_profile.get("energy_dependency", 50)
    imports = company_profile.get("import_dependency", 50)
    consumer = company_profile.get("consumer_sensitivity", 50)
    markets = company_profile.get("market_sensitivity", 50)

    energy_risk = 20
    supply_chain_risk = 20
    inflation_risk = 20
    consumer_demand_risk = 20
    financial_market_risk = 20

    if "oil" in topics or "gas" in topics or "energy" in topics:
        energy_risk += int(energy * 0.6)
        inflation_risk += int(energy * 0.2)

    if "shipping" in topics or "trade" in topics or "conflict" in topics:
        supply_chain_risk += int(imports * 0.6)

    if "inflation" in topics:
        inflation_risk += 35

    if "consumer" in topics or "recession" in topics:
        consumer_demand_risk += int(consumer * 0.5)

    if "markets" in topics or "rates" in topics or "currency" in topics:
        financial_market_risk += int(markets * 0.5)

    if region in [r.lower() for r in company_profile.get("supply_chain_regions", [])]:
        supply_chain_risk += 20

    risks = {
        "energy_risk": min(100, energy_risk),
        "supply_chain_risk": min(100, supply_chain_risk),
        "inflation_risk": min(100, inflation_risk),
        "consumer_demand_risk": min(100, consumer_demand_risk),
        "financial_market_risk": min(100, financial_market_risk),
    }

    risks["overall_company_risk"] = round(sum(risks.values()) / len(risks))
    return risks


@router.get("/events")
async def list_events():
    return {"events": list(EVENT_STORE.values())}


@router.post("/sector-impact/{event_id}")
async def sector_impact(event_id: str):
    event = EVENT_STORE.get(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    topics = [t.lower() for t in event.get("topics", [])]

    winners = []
    losers = []

    if "oil" in topics or "gas" in topics or "energy" in topics:
        winners.extend(["Energy traders", "Solar providers", "Battery storage firms"])
        losers.extend(["Airlines", "Hauliers", "Energy-intensive manufacturers"])

    if "shipping" in topics or "conflict" in topics:
        winners.extend(["Nearshoring suppliers", "Risk software vendors", "Domestic logistics alternatives"])
        losers.extend(["Import-heavy retailers", "Global manufacturers", "Just-in-time supply chains"])

    return {
        "event_id": event_id,
        "winners": list(dict.fromkeys(winners)),
        "losers": list(dict.fromkeys(losers)),
        "urgency": "short",
        "confidence": 0.79,
    }


@router.post("/company-impact/{event_id}/{company_number}")
async def company_impact(event_id: str, company_number: str):
    event = EVENT_STORE.get(event_id)
    company = COMPANY_PROFILE_STORE.get(company_number)

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if not company:
        raise HTTPException(status_code=404, detail="Company profile not found")

    risk_scores = score_company_exposure(event, company)

    actions = []
    if risk_scores["energy_risk"] >= 70:
        actions.append("Review fuel, electricity and logistics cost exposure immediately.")
    if risk_scores["supply_chain_risk"] >= 70:
        actions.append("Check supplier concentration and build alternate sourcing options.")
    if risk_scores["inflation_risk"] >= 70:
        actions.append("Re-model pricing and margin assumptions for the next 30-90 days.")
    if risk_scores["consumer_demand_risk"] >= 70:
        actions.append("Stress-test sales volume assumptions and promotional response.")
    if risk_scores["financial_market_risk"] >= 70:
        actions.append("Review FX, interest-rate and financing sensitivity.")

    return {
        "event_id": event_id,
        "company_number": company_number,
        "company_name": company.get("company_name"),
        "risk_scores": risk_scores,
        "executive_actions": actions,
    }


@router.get("/risk-trajectory/{company_number}")
async def risk_trajectory(company_number: str):
    company = COMPANY_PROFILE_STORE.get(company_number)
    if not company:
        raise HTTPException(status_code=404, detail="Company profile not found")

    base = round(
        (
            company.get("energy_dependency", 50)
            + company.get("import_dependency", 50)
            + company.get("consumer_sensitivity", 50)
            + company.get("market_sensitivity", 50)
        ) / 4
    )

    return {
        "company_number": company_number,
        "current_risk": base,
        "seven_day_projection": min(100, base + 4),
        "thirty_day_projection": min(100, base + 8),
        "trend": "rising" if base >= 50 else "stable",
    }


@router.get("/opportunity-scan/{company_number}")
async def opportunity_scan(company_number: str):
    company = COMPANY_PROFILE_STORE.get(company_number)
    if not company:
        raise HTTPException(status_code=404, detail="Company profile not found")

    sic_labels = company.get("sic_labels", [])
    opportunities = []

    if any("motor" in s.lower() or "cars" in s.lower() for s in sic_labels):
        opportunities.append("EV transition advisory and lower-running-cost vehicle mix repositioning")

    if any("transport" in s.lower() or "freight" in s.lower() for s in sic_labels):
        opportunities.append("Supply-chain diversification and route resilience services")

    if company.get("energy_dependency", 50) > 60:
        opportunities.append("Energy procurement optimisation and solar/storage adoption")

    if company.get("import_dependency", 50) > 60:
        opportunities.append("UK/EU supplier substitution and inventory resilience planning")

    return {
        "company_number": company_number,
        "company_name": company.get("company_name"),
        "opportunities": opportunities,
    }