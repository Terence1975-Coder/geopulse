import { getOrCreateSessionId } from "./session";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

export type AgentStage = "analyse" | "advise" | "plan" | "profile";

export interface EngageAgentPayload {
  input: string;
  stage: AgentStage;
  company_name?: string;
  session_id?: string;
}

export interface EngageAgentResponse {
  outputs: Record<string, string>;
  meta: {
    stage: string;
    company_name?: string;
    session_id?: string;
    used_company_memory?: boolean;
    used_conversation_history?: boolean;
    used_chain_state?: boolean;
  };
}

export async function engageAgent(
  payload: EngageAgentPayload
): Promise<EngageAgentResponse> {
  const response = await fetch(`${API_BASE}/intel/agent/engage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...payload,
      company_name: payload.company_name || "TestCo",
      session_id: payload.session_id || getOrCreateSessionId(),
    }),
  });

  if (!response.ok) {
    throw new Error(`Agent request failed: ${response.status}`);
  }

  return response.json();
}