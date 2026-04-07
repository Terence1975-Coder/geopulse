from typing import Dict, Tuple

CATEGORY_PROFILE_KEYS = {
    "Energy Risk": "energy_dependency_level",
    "Supply Chain Risk": "import_export_exposure",
    "Inflation Risk": "consumer_sensitivity_level",
    "Market Volatility": "financial_leverage_sensitivity",
}


def apply_company_adjustment(category: str, base_score: int, profile: Dict) -> Tuple[int, str]:
    sensitivity_key = CATEGORY_PROFILE_KEYS.get(category)
    sensitivity = int(profile.get(sensitivity_key, 50))

    sector = profile.get("sector", "").lower()
    sub_sector = profile.get("sub_sector", "").lower()
    priorities = [p.lower() for p in profile.get("strategic_priorities", [])]

    multiplier = 1.0 + ((sensitivity - 50) / 100)

    if category == "Supply Chain Risk" and ("logistics" in sector or "distribution" in sub_sector):
        multiplier += 0.15
    if category == "Energy Risk" and ("manufacturing" in sector or "industrial" in sub_sector):
        multiplier += 0.12
    if category == "Inflation Risk" and ("retail" in sector or "consumer" in sub_sector):
        multiplier += 0.10
    if category == "Market Volatility" and ("finance" in sector or "investment" in sector):
        multiplier += 0.12

    if "resilience" in priorities:
        multiplier -= 0.03
    if "expansion" in priorities:
        multiplier += 0.04
    if "cost control" in priorities:
        multiplier += 0.02

    adjusted = max(15, min(98, round(base_score * multiplier)))
    explanation = (
        f"Adjusted for {profile.get('company_name', 'company')} profile using sector, strategic priorities, "
        f"and sensitivity levels."
    )
    return adjusted, explanation