import { apiFetch } from "@/lib/api";
import { ActionType, AgentChainState, EngageResponse } from "../types/agentConsole";

export async function engageAgent(payload: {
  session_id: string;
  action: ActionType;
  input: string;
  use_previous_chain: boolean;
  existing_chain_state?: AgentChainState;
}): Promise<EngageResponse> {
  return apiFetch<EngageResponse>("/intel/agent/engage", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}