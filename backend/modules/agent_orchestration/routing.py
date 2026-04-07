from .schemas import AgentChainState


def route_best_agent(task_type: str, chain_state: AgentChainState) -> dict:
    if task_type == "analyze":
        return {
            "agent": "Analyst Agent",
            "model": "primary-reasoning-model",
        }
    if task_type == "advise":
        return {
            "agent": "Advisor Agent",
            "model": "commercial-strategy-model",
        }
    if task_type == "plan":
        return {
            "agent": "Planning Agent",
            "model": "structured-execution-model",
        }
    if task_type == "build_profile":
        return {
            "agent": "Company Profile Agent",
            "model": "memory-synthesis-model",
        }
    return {
        "agent": "GeoPulse Core Agent",
        "model": "fallback-model",
    }