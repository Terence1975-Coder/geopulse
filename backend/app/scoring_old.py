def level_score(value: str) -> float:
    mapping = {
        "low": 0.3,
        "medium": 0.6,
        "high": 1.0
    }
    return mapping.get((value or "medium").lower(), 0.6)

def relevance_score(company: dict, headline: str, body: str) -> float:
    text = f"{headline} {body}".lower()

    region_match = 1.0 if company.get("primary_country", "").lower() in text else 0.4
    supplier_match = 1.0 if any(r.lower() in text for r in company.get("key_supplier_regions", [])) else 0.5
    energy_match = level_score(company.get("fuel_energy_sensitivity"))
    supply_match = level_score(company.get("supply_chain_complexity"))
    trade_match = max(
        level_score(company.get("import_dependency")),
        level_score(company.get("export_dependency"))
    )
    margin_match = level_score(company.get("margin_sensitivity"))

    score = (
        region_match * 0.20 +
        supplier_match * 0.20 +
        energy_match * 0.15 +
        supply_match * 0.15 +
        trade_match * 0.15 +
        margin_match * 0.15
    )

    return round(min(score, 1.0), 2)