export type AgentStage = "analyse" | "advise" | "plan" | "profile";

export type WorkspaceKey =
  | "executive"
  | "signals"
  | "opportunities"
  | "company"
  | "analyst"
  | "advisor"
  | "planner"
  | "profile-agent"
  | "agent-chain"
  | "governance"
  | "configuration";

export interface AgentEvidenceItem {
  title: string;
  source_type: string;
  trust_score: number;
  excerpt: string;
}

export interface AgentExplanation {
  model: string;
  route: string;
  reasoning_summary: string;
  evidence_used: string[];
  memory_used: string[];
}

export interface AgentChainResponse {
  input: string;
  anonymized_input: string;
  privacy: {
    raw_input?: string;
    anonymized_input?: string;
    risk_level: string;
    replacements: Array<{
      type: string;
      original: string;
      placeholder: string;
    }>;
  };
  chain_state: {
    completed_steps: AgentStage[];
  };
  outputs: {
    analyse?: string | null;
    advise?: string | null;
    plan?: string | null;
    profile?: string | null;
  };
  auto_ran: AgentStage[];
  evidence: AgentEvidenceItem[];
  explanation: AgentExplanation;
}