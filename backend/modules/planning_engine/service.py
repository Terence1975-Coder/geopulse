from backend.modules.agent_orchestration.schemas import PlanOutput


class PlanningEngine:
    def run(self, context: dict) -> PlanOutput:
        return PlanOutput(
            objective="Stabilise margin and build resilience against external volatility",
            immediate=[
                "Review exposed cost categories",
                "Identify top vulnerable suppliers",
                "Prepare leadership briefing",
            ],
            short_term=[
                "Run repricing scenarios",
                "Adjust commercial offers by segment",
            ],
            medium_term=[
                "Diversify supplier base",
                "Strengthen operating contingency model",
            ],
            owners=[
                "CEO",
                "Commercial Director",
                "Operations Lead",
            ],
            checkpoints=[
                "7-day risk review",
                "30-day margin review",
                "60-day resilience review",
            ],
            confidence=86,
        )