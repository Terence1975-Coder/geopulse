from backend.modules.agent_orchestration.schemas import CompanyProfileOutput


class CompanyMemoryService:
    def run(self, context: dict) -> CompanyProfileOutput:
        return CompanyProfileOutput(
            sector="Inferred sector",
            business_type="B2B / operating company",
            strategic_priorities=[
                "Margin protection",
                "Supply resilience",
                "Commercial stability",
            ],
            geographic_dependencies=[
                "UK core market",
                "Imported cost sensitivity",
            ],
            margin_sensitivities=[
                "Energy/input costs",
                "Logistics costs",
            ],
            consumer_demand_exposure=[
                "Moderate exposure to weakened customer demand",
            ],
            supply_chain_dependencies=[
                "Supplier concentration risk",
                "External shipping cost exposure",
            ],
            profile_summary="GeoPulse has enriched the company profile using the current reasoning chain.",
            confidence=80,
        )