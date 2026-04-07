from backend.modules.agent_orchestration.schemas import (
    AgentChainState,
    EngageResponse,
)
from backend.modules.agent_orchestration.routing import route_best_agent
from backend.modules.agent_orchestration.context_builder import build_shared_chain_context
from backend.modules.privacy_guard.service import PrivacyGuardService
from backend.modules.analysis_engine.service import AnalysisEngine
from backend.modules.advisory_engine.service import AdvisoryEngine
from backend.modules.planning_engine.service import PlanningEngine
from backend.modules.company_memory.service import CompanyMemoryService


class AgentOrchestrator:
    def __init__(self) -> None:
        self.privacy_guard = PrivacyGuardService()
        self.analysis_engine = AnalysisEngine()
        self.advisory_engine = AdvisoryEngine()
        self.planning_engine = PlanningEngine()
        self.company_memory_service = CompanyMemoryService()

    def _ensure_privacy(self, chain_state: AgentChainState) -> None:
        preview = self.privacy_guard.preview(chain_state.raw_input)
        chain_state.anonymized_input = preview.anonymized_input
        chain_state.privacy_risk_level = preview.privacy_risk_level
        chain_state.privacy_preview = preview

    def run_analysis(self, chain_state: AgentChainState) -> None:
        self._ensure_privacy(chain_state)
        routing = route_best_agent("analyze", chain_state)
        context = build_shared_chain_context(chain_state)
        chain_state.analysis = self.analysis_engine.run(context)
        if "analyze" not in chain_state.completed_steps:
            chain_state.completed_steps.append("analyze")
        chain_state.selected_agent_map["analyze"] = routing["agent"]
        chain_state.selected_model_map["analyze"] = routing["model"]
        chain_state.confidence_scores["analyze"] = chain_state.analysis.confidence

    def run_advice(self, chain_state: AgentChainState) -> None:
        if not chain_state.analysis:
            self.run_analysis(chain_state)
            chain_state.auto_ran_steps.append("analyze")
        routing = route_best_agent("advise", chain_state)
        context = build_shared_chain_context(chain_state)
        chain_state.advice = self.advisory_engine.run(context)
        if "advise" not in chain_state.completed_steps:
            chain_state.completed_steps.append("advise")
        chain_state.selected_agent_map["advise"] = routing["agent"]
        chain_state.selected_model_map["advise"] = routing["model"]
        chain_state.confidence_scores["advise"] = chain_state.advice.confidence
        chain_state.prior_outputs_used = [*set(chain_state.prior_outputs_used + ["analysis"])]

    def run_plan(self, chain_state: AgentChainState) -> None:
        if not chain_state.analysis:
            self.run_analysis(chain_state)
            chain_state.auto_ran_steps.append("analyze")
        )