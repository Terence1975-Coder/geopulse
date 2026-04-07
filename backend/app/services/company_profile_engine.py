def apply_company_adjustment(category, base_score, profile):
    sensitivity_map={
        "Energy Risk":"energy_dependency_level",
        "Supply Chain Risk":"import_export_exposure",
        "Inflation Risk":"consumer_sensitivity_level",
        "Market Volatility":"financial_leverage_sensitivity"
    }

    s = profile.get(sensitivity_map.get(category,""),50)
    multiplier = 1 + ((s-50)/120)

    score = max(15,min(98, round(base_score*multiplier)))

    explanation=f"Adjusted for company exposure level {s}"

    return score, explanation