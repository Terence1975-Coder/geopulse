from .schemas import AgentChainState


def build_shared_chain_context(chain_state: AgentChainState) -> dict:
    return {
        "raw_input": chain_state.raw_input,
        "anonymized_input": chain_state.anonymized_input or chain_state.raw_input,
        "analysis": chain_state.analysis.model_dump() if chain_state.analysis else None,
        "advice": chain_state.advice.model_dump() if chain_state.advice else None,
        "plan": chain_state.plan.model_dump() if chain_state.plan else None,
        "company_profile": chain_state.company_profile_draft.model_dump() if chain_state.company_profile_draft else None,
        "completed_steps": chain_state.completed_steps,
        "privacy_risk_level": chain_state.privacy_risk_level,
    }