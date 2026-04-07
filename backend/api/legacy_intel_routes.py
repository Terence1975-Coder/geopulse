from fastapi import APIRouter

router = APIRouter(prefix="/intel", tags=["legacy-intel-compat"])


@router.get("/signals")
async def get_signals(limit: int = 50):
    signals = [
        {
            "id": "sig-001",
            "headline": "Resilience demand opens higher-value advisory window",
            "summary": (
                "Clients are showing stronger demand for resilience, implementation "
                "support, and rapid operational advisory."
            ),
            "source": "Financial Times",
            "region": "UK",
            "cluster_tag": "Resilience Demand",
            "severity": "medium",
            "kind": "opportunity",
            "trust_score": 0.80,
            "strength": 0.77,
            "freshness": "Fresh",
            "minutes_ago": 54,
            "timestamp": "2026-04-04T09:00:00Z",
        },
        {
            "id": "sig-002",
            "headline": "Energy and logistics volatility raises delivery cost pressure",
            "summary": (
                "Cross-market volatility is increasing cost and continuity pressure "
                "for service-led businesses with regional exposure."
            ),
            "source": "Reuters",
            "region": "Europe",
            "cluster_tag": "Cost & Continuity Pressure",
            "severity": "high",
            "kind": "risk",
            "trust_score": 0.83,
            "strength": 0.79,
            "freshness": "Fresh",
            "minutes_ago": 38,
            "timestamp": "2026-04-04T09:15:00Z",
        },
        {
            "id": "sig-003",
            "headline": "Compliance complexity creates premium positioning window",
            "summary": (
                "Tighter compliance demands are increasing willingness to pay for "
                "specialist advisory and implementation support."
            ),
            "source": "Bloomberg",
            "region": "UK",
            "cluster_tag": "Compliance Opportunity",
            "severity": "medium",
            "kind": "opportunity",
            "trust_score": 0.78,
            "strength": 0.74,
            "freshness": "Watch",
            "minutes_ago": 112,
            "timestamp": "2026-04-04T08:00:00Z",
        },
        {
            "id": "sig-004",
            "headline": "Client budget caution may slow conversion despite demand",
            "summary": (
                "Demand signals remain positive, but cost scrutiny and ROI expectations "
                "may lengthen buying cycles."
            ),
            "source": "Wall Street Journal",
            "region": "Europe",
            "cluster_tag": "Commercial Friction",
            "severity": "medium",
            "kind": "risk",
            "trust_score": 0.76,
            "strength": 0.71,
            "freshness": "Watch",
            "minutes_ago": 147,
            "timestamp": "2026-04-04T07:30:00Z",
        },
    ]

    return signals[:limit]


@router.get("/dashboard/summary")
async def get_dashboard_summary():
    return {
        "overall_risk_score": 74,
        "opportunity_score": 82,
        "posture": "Heightened Attention",
        "opportunity_posture": "Targeted Upside",
        "urgency": "Medium-High",
        "confidence": 81,
        "horizon": "30-day",
        "summary": (
            "GeoPulse is detecting an active external picture shaped by resilience demand, "
            "cost pressure, and compliance-driven commercial openings. The current priority "
            "is to protect margin while selectively capturing high-fit advisory and implementation demand."
        ),
        "live_signal_count": 4,
        "positive_signal_count": 2,
        "agent_snapshots": {
            "analyst": (
                "The strongest live pattern is resilience-led demand growth alongside execution "
                "and margin pressure."
            ),
            "advisor": (
                "Prioritise offers that can be deployed quickly, priced clearly, and linked to "
                "measurable client outcomes."
            ),
            "profile_agent": (
                "Company calibration remains partial; richer company inputs will improve "
                "relevance and score precision."
            ),
        },
    }