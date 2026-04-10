const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "http://127.0.0.1:8000";

import type {
  AgentStage,
  ChainOutputs,
  CompanyProfile,
  EngageAgentRequest,
  EngageAgentResponse,
  WorkspaceMessage,
} from "../types/intelligence";

type EngageAgentParams = {
  input: string;
  stage: AgentStage;
  companyProfile?: CompanyProfile | null;
  companyId?: string;
  companyName?: string;
  companyContext?: Record<string, unknown> | null;
  chainOutputs?: ChainOutputs | null;
  messages?: WorkspaceMessage[];
  conversationHistory?: Array<{ role: string; content: string }>;
  previousChainState?: Record<string, unknown> | null;
};

function normaliseConversationHistory(
  params: EngageAgentParams
): Array<{ role: string; content: string }> {
  if (Array.isArray(params.conversationHistory)) {
    return params.conversationHistory
      .filter((item) => item && typeof item.role === "string")
      .map((item) => ({
        role: item.role,
        content:
          typeof item.content === "string"
            ? item.content
            : JSON.stringify(item.content ?? ""),
      }));
  }

  if (Array.isArray(params.messages)) {
    return params.messages.map((message) => ({
      role: message.role,
      content:
        typeof message.content === "string"
          ? message.content
          : JSON.stringify(message.content ?? ""),
    }));
  }

  return [];
}

export async function engageAgent(
  params: EngageAgentParams
): Promise<EngageAgentResponse> {
  const body: EngageAgentRequest = {
    input: params.input,
    stage: params.stage,
    company_name:
      params.companyName ||
      params.companyProfile?.company_name ||
      undefined,
    company_id:
      params.companyId || params.companyProfile?.company_id || undefined,
    company_profile: params.companyProfile ?? undefined,
    company_context: params.companyContext ?? undefined,
    chain_outputs: params.chainOutputs ?? undefined,
    conversation_history: normaliseConversationHistory(params),
    previous_chain_state: params.previousChainState ?? undefined,
  };

  const base = API_BASE.replace(/\/+$/, "");
  const url = `${base}/intel/agent/engage`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Backend error ${response.status}: ${errorText}`);
  }

  return (await response.json()) as EngageAgentResponse;
}
