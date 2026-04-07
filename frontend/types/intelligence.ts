export type AgentStage =
  | "analyse"
  | "advise"
  | "plan"
  | "profile"
  | "full_chain"
  | "multi_path";

export type TimeHorizon = "short" | "medium" | "long";

export type WorkspaceMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  timestamp: string;
  tone?: "neutral" | "executive" | "warning" | "success";
  content: string | StructuredAgentOutput | Record<string, unknown> | null;
};

export type CompanyProfile = {
  company_name?: string | null;
  company_id?: string | null;
  sector?: string | null;
  markets?: string[];
  strategic_priorities?: string[];
  operating_model?: string | null;
  cost_sensitivities?: string[];
  growth_objectives?: string[];
  risk_tolerance?: string | null;
  recommendation_style?: string | null;
  notes?: string | null;
  [key: string]: unknown;
};

export type SupportingSignalDetail = {
  id?: string;
  headline?: string;
  source?: string;
  confidence_score?: number;
  relative_time?: string;
  lifecycle?: string;
  [key: string]: unknown;
};

export type StructuredAgentOutput = {
  headline?: string;
  key_insight?: string;
  drivers?: string[];
  second_order_effects?: string[];
  implications?: string[];
  recommended_actions?: string[];
  confidence?: number;
  time_horizon?: TimeHorizon;
  missing_profile_data?: string[];
  profile_references?: string[];
  based_on_stages?: string[];
  based_on_signals?: string[];
  time_relevance?: string;
  supporting_signal_details?: SupportingSignalDetail[];
  urgency?: string | null;
  reasoning_notes?: string[];
  explanation_notes?: string[];
  [key: string]: unknown;
};

export type ChainOutputs = {
  analyse?: StructuredAgentOutput | null;
  advise?: StructuredAgentOutput | null;
  plan?: StructuredAgentOutput | null;
  profile?: StructuredAgentOutput | null;
  [key: string]: unknown;
};

export type ConversationTurn = {
  role: string;
  content: string;
};

export type MultiAnalystView = {
  id: string;
  lens: string;
  headline: string;
  key_insight: string;
  drivers: string[];
  second_order_effects: string[];
  opportunity_signal: string;
  risk_signal: string;
  confidence: number;
};

export type AnalysisSelection = {
  recommended_analyst_id: string;
  reason: string;
  tradeoffs: string[];
};

export type StrategicPath = {
  id: string;
  name: string;
  approach: string;
  where_it_wins: string;
  risks: string[];
  requirements: string[];
  time_horizon: string;
  confidence: number;
  recommended_actions: string[];
  selected_from_analyst?: string | null;
};

export type StrategyDecision = {
  selected_path_id: string;
  reason: string;
  why_not_others: string[];
};

export type ExecutionPlanPhase = {
  phase: string;
  actions: string[];
  owner: string;
};

export type ExecutionPlan = {
  objective: string;
  selected_path_id?: string | null;
  phases: ExecutionPlanPhase[];
};

export type InteractionHooks = {
  primary_recommendation: string;
  alternatives_available: boolean;
  feedback_required: boolean;
  actions: Array<{ id: string; label: string }>;
};

export type EngageAgentRequest = {
  input: string;
  stage: AgentStage;
  company_name?: string;
  company_id?: string;
  company_profile?: CompanyProfile | null;
  company_context?: Record<string, unknown> | null;
  chain_outputs?: ChainOutputs | null;
  conversation_history?: ConversationTurn[];
  previous_chain_state?: Record<string, unknown> | null;
};

export type EngageAgentResponse = {
  output?: StructuredAgentOutput | Record<string, unknown> | null;
  outputs?: Partial<Record<AgentStage, StructuredAgentOutput>> & Record<string, StructuredAgentOutput>;
  chain_outputs?: ChainOutputs | null;
  analyst_views?: MultiAnalystView[];
  analysis_selection?: AnalysisSelection | null;
  strategic_paths?: StrategicPath[];
  strategy_decision?: StrategyDecision | null;
  execution_plan?: ExecutionPlan | null;
  interaction_hooks?: InteractionHooks | null;
  multi_path_output?: Record<string, unknown> | null;
  context_summary?: Record<string, unknown> | null;
  meta?: Record<string, unknown> | null;
};