from __future__ import annotations

from models import AdaptiveExposureResult, BehaviouralSignals, CompanyIdentity, ExposureInputs

RISK_KEYS = ["energy", "supply_chain", "inflation", "consumer_demand", "market_volatility"]


class AdaptiveExposureEngine:
    def compute(
        self,
        identity: CompanyIdentity | None,
        user_exposure: ExposureInputs,
        memory: BehaviouralSignals,
    ) -> AdaptiveExposureResult:
        baseline = identity.baseline_exposure_assumptions if identity else {key: 0.5 for key in RISK_KEYS}
        user_map = user_exposure.model_dump()

        focus_boosts = {key: 0.0 for key in RISK_KEYS}
        if memory.most_discussed_risk_category:
            focus_boosts[memory.most_discussed_risk_category] = 0.08

        dynamic = {}
        multipliers = {}

        severity = memory.preferred_severity_assumption or 0.5
        behaviour_scalar = 0.9 + (severity * 0.2)

        for key in RISK_KEYS:
            dynamic[key] = round((baseline.get(key, 0.5) * 0.5) + (user_map[key] * 0.35) + focus_boosts[key], 3)
            multipliers[key] = round(0.8 + (dynamic[key] * behaviour_scalar), 3)

        dominant = max(dynamic, key=dynamic.get)
        svi = round(sum(dynamic.values()) / len(dynamic) * 100, 1)

        focus_signal = "Balanced executive focus"
        if memory.most_discussed_risk_category:
            focus_signal = f"Recent focus: {memory.most_discussed_risk_category.replace('_', ' ')}"
        if memory.opportunity_bias > memory.mitigation_bias + 0.15:
            focus_signal += " · opportunity-leaning"
        elif memory.mitigation_bias > memory.opportunity_bias + 0.15:
            focus_signal += " · mitigation-leaning"

        return AdaptiveExposureResult(
            dynamic_exposure_coefficients=dynamic,
            risk_sensitivity_multipliers=multipliers,
            scenario_vulnerability_index=svi,
            dominant_risk_sensitivity=dominant,
            behavioural_focus_signal=focus_signal,
        )

    def weighted_scores(self, adaptive: AdaptiveExposureResult, scenario_type: str) -> dict[str, float]:
        scenario_weight = {
            "oil_shock": {"energy": 1.25, "supply_chain": 1.1, "inflation": 1.15, "consumer_demand": 0.9, "market_volatility": 1.05},
            "trade_disruption": {"energy": 0.95, "supply_chain": 1.3, "inflation": 1.1, "consumer_demand": 0.95, "market_volatility": 1.05},
            "regulatory_shift": {"energy": 1.05, "supply_chain": 1.0, "inflation": 0.95, "consumer_demand": 1.0, "market_volatility": 1.15},
            "cyber_incident": {"energy": 0.8, "supply_chain": 0.9, "inflation": 0.85, "consumer_demand": 0.9, "market_volatility": 1.2},
            "demand_contraction": {"energy": 0.85, "supply_chain": 0.9, "inflation": 1.0, "consumer_demand": 1.3, "market_volatility": 1.1},
        }[scenario_type]

        scores = {}
        for key, multiplier in adaptive.risk_sensitivity_multipliers.items():
            scores[key] = round(min(multiplier * scenario_weight[key] * 50, 100), 1)
        return scores
