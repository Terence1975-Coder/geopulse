from __future__ import annotations

from models import AdaptiveExposureResult, BehaviouralSignals, CompanyIdentity, DashboardScenarioResponse


class ScenarioEngine:
    def simulate(
        self,
        scenario_type: str,
        identity: CompanyIdentity | None,
        adaptive: AdaptiveExposureResult,
        memory: BehaviouralSignals,
        weighted_scores: dict[str, float],
    ) -> DashboardScenarioResponse:
        company_name = identity.official_name if identity else "Your company"
        sector = identity.sub_sector if identity else "business"

        if scenario_type == "oil_shock":
            by_sector = {
                "Logistics": (
                    "Defensive hedging posture",
                    [
                        "Margin compression accelerates as fuel costs reprice faster than customer contracts.",
                        "Carrier capacity negotiations tighten around peak lanes.",
                        "Working-capital pressure rises as suppliers shorten payment tolerance.",
                    ],
                    [
                        "Reprice indexed contracts within 14 days.",
                        "Segment customers by fuel pass-through flexibility.",
                        "Stress-test route profitability weekly.",
                    ],
                ),
                "Retail": (
                    "Selective protection posture",
                    [
                        "Pass-through lag squeezes basket margin before consumer pricing catches up.",
                        "Footfall softens in price-sensitive segments.",
                        "Promotion mix becomes less efficient as cost volatility rises.",
                    ],
                    [
                        "Rebuild promotional calendar around margin floors.",
                        "Protect top-turning SKUs with supplier renegotiations.",
                        "Use smaller, faster pricing reviews.",
                    ],
                ),
                "Manufacturing": (
                    "Continuity-first posture",
                    [
                        "Production continuity risk increases where energy-intensive lines dominate output.",
                        "Input cost volatility destabilises quote validity windows.",
                        "Inventory strategy becomes more valuable than just-in-time purity.",
                    ],
                    [
                        "Lock core energy exposure where feasible.",
                        "Review plant-level continuity thresholds.",
                        "Shorten commercial quote validity periods.",
                    ],
                ),
            }
        else:
            by_sector = {}

        posture, second_order, actions = by_sector.get(
            sector,
            (
                "Balanced resilience posture",
                [
                    f"{sector} cost structure shows heightened sensitivity under {scenario_type.replace('_', ' ')}.",
                    "Second-order contract and pricing effects could exceed headline disruption.",
                    "Management reaction speed is likely to matter more than static planning.",
                ],
                [
                    "Review pricing, supplier, and liquidity triggers.",
                    "Run a board-level response drill.",
                    "Create a 30-day action threshold dashboard.",
                ],
            ),
        )

        focus_text = memory.most_discussed_risk_category.replace("_", " ") if memory.most_discussed_risk_category else "resilience"
        profile_insight = (
            f"Based on your recent focus on {focus_text}, GeoPulse is weighting the scenario toward "
            f"{adaptive.dominant_risk_sensitivity.replace('_', ' ')} sensitivity for {company_name}."
        )
        reasoning = (
            f"Profile-driven insight · sector inference: {identity.sector if identity else 'Unknown'} / "
            f"{sector} · vulnerability index: {adaptive.scenario_vulnerability_index}"
        )

        return DashboardScenarioResponse(
            scenario_type=scenario_type,
            company_name=company_name,
            posture=posture,
            executive_summary=(
                f"{company_name} is modelled as a {sector.lower()} business with dominant "
                f"{adaptive.dominant_risk_sensitivity.replace('_', ' ')} sensitivity."
            ),
            second_order_effects=second_order,
            recommended_actions=actions,
            reasoning_banner=reasoning,
            profile_driven_insight=profile_insight,
            weighted_risk_scores=weighted_scores,
        )
