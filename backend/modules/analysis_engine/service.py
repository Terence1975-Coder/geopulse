from backend.modules.agent_orchestration.schemas import AnalysisOutput


class AnalysisEngine:
    def run(self, context: dict) -> AnalysisOutput:
        text = context["anonymized_input"]
        return AnalysisOutput(
            summary=f"GeoPulse analysis of: {text[:140]}",
            key_risks=[
                "Margin pressure from cost volatility",
                "Operational sensitivity to external shocks",
            ],
            opportunities=[
                "Reprice selectively",
                "Diversify suppliers or routes",
            ],
            drivers=[
                "Input cost movement",
                "Demand softness",
                "Sector exposure",
            ],
            exposure_logic=[
                "Cost rises can compress gross margin quickly",
                "Weak demand reduces pricing power",
            ],
            confidence=82,
        )