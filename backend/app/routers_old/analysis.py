from fastapi import APIRouter, HTTPException
from app.routers.events import EVENT_STORE

router = APIRouter(prefix="/analyze", tags=["analysis"])


@router.post("/{event_id}")
async def analyze_event(event_id: str):
    event = EVENT_STORE.get(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    topics = [t.lower() for t in event.get("topics", [])]

    energy = 20
    supply_chain = 20
    inflation = 20
    consumer_demand = 20
    market_volatility = 20

    if "oil" in topics or "gas" in topics or "energy" in topics:
        energy += 55
        inflation += 20

    if "shipping" in topics or "trade" in topics or "conflict" in topics:
        supply_chain += 45

    if "inflation" in topics:
        inflation += 40

    if "consumer" in topics or "recession" in topics:
        consumer_demand += 40

    if "markets" in topics or "currency" in topics or "rates" in topics:
        market_volatility += 45

    result = {
        "event_id": event_id,
        "title": event["title"],
        "scores": {
            "energy_risk": min(100, energy),
            "supply_chain_risk": min(100, supply_chain),
            "inflation_risk": min(100, inflation),
            "consumer_demand_risk": min(100, consumer_demand),
            "market_volatility_risk": min(100, market_volatility),
        },
        "executive_summary": f"{event['title']} may materially affect business conditions in {event['region']}.",
        "recommended_actions": [
            "Review exposure to affected regions and suppliers.",
            "Stress-test pricing, margin and demand assumptions.",
            "Prepare contingency sourcing and communications plans.",
        ],
    }

    return result