from backend.modules.agent_orchestration.schemas import AdviceOutput


class AdvisoryEngine:
    def run(self, context: dict) -> AdviceOutput:
        return AdviceOutput(
            executive_advice="Protect margin, preserve optionality, and avoid broad reactive pricing changes.",
            practical_actions=[
                "Review highest-risk cost lines immediately",
                "Protect profitable customer segments first",
                "Build supplier fallback options",
            ],
            prioritisation_guidance=[
                "Start with margin exposure hotspots",
                "Then address supplier concentration",
            ],
            commercial_interpretation=[
                "The issue is manageable if pricing, procurement, and demand actions move together",
            ],
            timing_guidance=[
                "Immediate action within 7 days",
                "Short-term reset within 30 days",
            ],
            confidence=84,
        )