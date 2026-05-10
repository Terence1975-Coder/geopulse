const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

export type V9DecisionRecord = {
  decision_id: string;
  company_id?: string | null;
  title: string;
  source_agent: string;
  originating_signal_ids: string[];
  recommendation_summary: string;
  selected_option?: string | null;
  decision_reason?: string | null;
  risks: string[];
  assumptions: string[];
  owner?: string | null;
  status: string;
  priority: string;
  confidence: number;
  evidence_refs: string[];
  execution_plan_id?: string | null;
  outcome_id?: string | null;
  raw_agent_output?: Record<string, unknown>;
  [key: string]: unknown;
};

export type V9ExecutionRecord = {
  execution_id: string;
  company_id?: string | null;
  linked_decision_id?: string | null;
  objective: string;
  phases: Array<{
    phase_id: string;
    title: string;
    owner?: string | null;
    status: string;
    tasks: Array<{
      task_id: string;
      title: string;
      owner?: string | null;
      due_date?: string | null;
      status: string;
      blockers: string[];
      dependencies: string[];
      [key: string]: unknown;
    }>;
    [key: string]: unknown;
  }>;
  owners: string[];
  status: string;
  blockers: string[];
  dependencies: string[];
  review_cadence: string;
  success_metrics: string[];
  next_actions: string[];
  [key: string]: unknown;
};

export type CreateDecisionCandidateParams = {
  companyId?: string | null;
  agentOutput: Record<string, unknown>;
  originatingSignalIds?: string[];
  owner?: string | null;
  priority?: "low" | "medium" | "high" | "critical";
};

export async function createDecisionCandidate(
  params: CreateDecisionCandidateParams
): Promise<V9DecisionRecord> {
  const response = await fetch(`${API_BASE}/intel/v9/decisions/from-agent-output`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      company_id: params.companyId || undefined,
      source_agent: "agent_chain",
      agent_output: params.agentOutput,
      originating_signal_ids: params.originatingSignalIds ?? [],
      owner: params.owner || undefined,
      priority: params.priority ?? "medium",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Decision Ledger error: ${errorText}`);
  }

  return (await response.json()) as V9DecisionRecord;
}

export async function createExecutionFromDecision(
  decisionId: string
): Promise<V9ExecutionRecord> {
  const response = await fetch(
    `${API_BASE}/intel/v9/execution/from-decision/${encodeURIComponent(
      decisionId
    )}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Execution State error: ${errorText}`);
  }

  return (await response.json()) as V9ExecutionRecord;
}