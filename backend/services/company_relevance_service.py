def compute_company_relevance(signal: dict, company: dict):
    score = 0.5
    reasons = []

    if company.get("regions") and signal.get("region") in company["regions"]:
        score += 0.2
        reasons.append("Geographic exposure match")

    if company.get("strategic_priorities"):
        score += 0.1
        reasons.append("Aligns with strategic priorities")

    if company.get("supplier_dependencies"):
        score += 0.1
        reasons.append("Touches supply chain dependencies")

    return {
        "company_relevance_score": round(min(score, 1.0), 2),
        "company_relevance_explanation": reasons,
        "strategic_fit": "High" if score > 0.75 else "Medium"
    }