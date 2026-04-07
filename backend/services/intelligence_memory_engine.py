from __future__ import annotations

from datetime import datetime

from models import BehaviouralSignals, MemoryUpdateRequest


class IntelligenceMemoryEngine:
    def update(self, current: BehaviouralSignals, payload: MemoryUpdateRequest) -> BehaviouralSignals:
        data = current.model_dump()

        if payload.discussed_risk_category:
            data["most_discussed_risk_category"] = payload.discussed_risk_category
        if payload.simulated_scenario_type:
            data["most_simulated_scenario_type"] = payload.simulated_scenario_type
        if payload.severity_assumption is not None:
            data["preferred_severity_assumption"] = payload.severity_assumption
        if payload.executive_question_theme:
            themes = list(dict.fromkeys([*data["executive_question_themes"], payload.executive_question_theme]))
            data["executive_question_themes"] = themes[-8:]
        if payload.mitigation_bias_delta is not None:
            data["mitigation_bias"] = min(max(data["mitigation_bias"] + payload.mitigation_bias_delta, 0.0), 1.0)
        if payload.opportunity_bias_delta is not None:
            data["opportunity_bias"] = min(max(data["opportunity_bias"] + payload.opportunity_bias_delta, 0.0), 1.0)

        data["interaction_count"] += 1
        data["last_updated"] = datetime.utcnow().isoformat()

        return BehaviouralSignals(**data)
