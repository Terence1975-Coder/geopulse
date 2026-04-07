from __future__ import annotations

from datetime import date
from typing import Dict, Tuple

from models import CompanyEnrichRequest, CompanyIdentity

SIC_MAP: Dict[str, Tuple[str, str, Dict[str, float]]] = {
    "29100": (
        "Industrial",
        "Manufacturing",
        {
            "energy": 0.85,
            "supply_chain": 0.72,
            "inflation": 0.61,
            "consumer_demand": 0.35,
            "market_volatility": 0.44,
        },
    ),
    "49410": (
        "Transport",
        "Logistics",
        {
            "energy": 0.75,
            "supply_chain": 0.92,
            "inflation": 0.64,
            "consumer_demand": 0.29,
            "market_volatility": 0.48,
        },
    ),
    "47190": (
        "Consumer",
        "Retail",
        {
            "energy": 0.38,
            "supply_chain": 0.66,
            "inflation": 0.58,
            "consumer_demand": 0.89,
            "market_volatility": 0.41,
        },
    ),
    "62012": (
        "Technology",
        "Software",
        {
            "energy": 0.22,
            "supply_chain": 0.27,
            "inflation": 0.43,
            "consumer_demand": 0.41,
            "market_volatility": 0.69,
        },
    ),
}

MOCK_COMPANIES = {
    "geopulse ai": {
        "official_name": "GeoPulse AI Ltd",
        "company_number": "15432109",
        "status": "active",
        "sic_codes": ["62012"],
        "registered_country": "England and Wales",
        "last_filing_date": "2026-01-18",
    },
    "fleet logistics": {
        "official_name": "Fleet Logistics Group Ltd",
        "company_number": "09876543",
        "status": "active",
        "sic_codes": ["49410"],
        "registered_country": "England and Wales",
        "last_filing_date": "2026-02-02",
    },
    "northern retail": {
        "official_name": "Northern Retail Holdings Ltd",
        "company_number": "08765432",
        "status": "active",
        "sic_codes": ["47190"],
        "registered_country": "Scotland",
        "last_filing_date": "2025-11-24",
    },
}


class CompanyIdentityEnrichmentService:
    def enrich(self, request: CompanyEnrichRequest) -> CompanyIdentity:
        if request.company_name:
            key = request.company_name.strip().lower()
            record = MOCK_COMPANIES.get(key)
        else:
            record = None

        if not record and request.company_number:
            record = next(
                (v for v in MOCK_COMPANIES.values() if v["company_number"] == request.company_number),
                None,
            )

        if not record:
            sic = "29100"
            record = {
                "official_name": request.company_name or f"Company {request.company_number}",
                "company_number": request.company_number or "00000000",
                "status": "active",
                "sic_codes": [sic],
                "registered_country": "England and Wales",
                "last_filing_date": "2025-12-18",
            }

        sector, sub_sector, baseline = self._infer_sector(record["sic_codes"])
        recency_signal = self._filing_recency_signal(record["last_filing_date"])

        return CompanyIdentity(
            official_name=record["official_name"],
            company_number=record["company_number"],
            status=record["status"],
            sic_codes=record["sic_codes"],
            registered_country=record["registered_country"],
            last_filing_date=record["last_filing_date"],
            filing_activity_recency_signal=recency_signal,
            sector=sector,
            sub_sector=sub_sector,
            verification_status="mock_enriched",
            baseline_exposure_assumptions=baseline,
        )

    def _infer_sector(self, sic_codes):
        for sic in sic_codes:
            if sic in SIC_MAP:
                return SIC_MAP[sic]
        return (
            "General Business",
            "Diversified",
            {
                "energy": 0.5,
                "supply_chain": 0.5,
                "inflation": 0.5,
                "consumer_demand": 0.5,
                "market_volatility": 0.5,
            },
        )

    def _filing_recency_signal(self, filing_date: str) -> float:
        days = max((date.today() - date.fromisoformat(filing_date)).days, 0)
        if days <= 60:
            return 1.0
        if days <= 180:
            return 0.75
        if days <= 365:
            return 0.5
        return 0.25
