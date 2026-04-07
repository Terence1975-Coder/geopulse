from __future__ import annotations

from models import (
    CompanyIntelligenceConfidence,
    CompanyProfile,
    ConfidenceBreakdown,
)


class ProfileConfidenceEngine:
    def calculate(self, profile: CompanyProfile) -> CompanyIntelligenceConfidence:
        identity_score = 1.0 if profile.identity else 0.15
        exposure_values = list(profile.user_exposure_inputs.model_dump().values())
        filled_exposure = sum(1 for value in exposure_values if value != 0.5) / len(exposure_values)
        behavioural = min(profile.behavioural_signals.interaction_count / 10, 1.0)
        scenario_usage = 1.0 if profile.behavioural_signals.most_simulated_scenario_type else 0.2

        weighted = (
            identity_score * 0.35
            + filled_exposure * 0.25
            + behavioural * 0.25
            + scenario_usage * 0.15
        )

        suggestions = []
        if not profile.identity:
            suggestions.append("Verify company identity to unlock sector-calibrated insights.")
        if filled_exposure < 0.6:
            suggestions.append("Adjust exposure sliders to personalise shock propagation.")
        if behavioural < 0.4:
            suggestions.append("Use the copilot more often to deepen behavioural intelligence.")
        if scenario_usage < 0.5:
            suggestions.append("Run at least one scenario simulation to sharpen posture guidance.")
        if not suggestions:
            suggestions.append("Profile maturity is strong. Continue scenario use for sharper foresight.")

        return CompanyIntelligenceConfidence(
            score=round(weighted * 100, 1),
            profile_completeness_percent=int(round(weighted * 100)),
            suggestions=suggestions,
            breakdown=ConfidenceBreakdown(
                identity_verification=round(identity_score * 100, 1),
                exposure_richness=round(filled_exposure * 100, 1),
                behavioural_depth=round(behavioural * 100, 1),
                scenario_usage=round(scenario_usage * 100, 1),
            ),
        )
