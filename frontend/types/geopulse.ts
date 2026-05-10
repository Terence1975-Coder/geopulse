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

export interface SignalItem {
  id: string;
  headline: string;
  summary: string;
  source: string;
  source_type?: string;
  region: string;
  cluster_tag: string;
  kind: "risk" | "opportunity" | string;
  severity: "low" | "medium" | "high" | string;
  confidence_score?: number;
  freshness_minutes?: number;
  signal_strength?: number;
  timestamp?: string;
  source_url?: string;
  detected_at?: string;
  updated_at?: string;
  lifecycle?: string;
  relative_time?: string;

  // compatibility fields used in older/newer UI surfaces
  confidence?: number;
  horizon?: string;
  tags?: string[];
  [key: string]: unknown;
}

export interface OpportunityItem {
  id?: string;
  title?: string;
  category?: string;
  score?: number;
  timing_window?: string;
  summary?: string;
  actions?: string[];
  confidence?: number;
  regions?: string[];
  [key: string]: unknown;
}

export interface CompanyProfile {
  company_name?: string;
  registration_number?: string;
  company_status?: string;
  incorporation_date?: string;
  sic_context?: string;
  sector?: string;
  sub_sector?: string;

  exposure_regions?: string;
  markets?: string[];
  strategic_priorities?: string[];

  operating_model?: string;
  cost_sensitivities?: string[];
  growth_objectives?: string[];
  risk_tolerance?: string;
  recommendation_style?: string;
  notes?: string;

  supply_chain_exposure_regions?: string[];
  supplier_logistics_notes?: string;
  company_notes?: string;
  custom_intelligence_notes?: string;

  energy_dependency_level?: number;
  import_export_exposure?: number;
  consumer_sensitivity_level?: number;
  financial_leverage_sensitivity?: number;
  regulatory_sensitivity_level?: number;

  // compatibility fields used by current company workspace
  energy_dependency?: number;
  consumer_sensitivity?: number;

  website_url?: string;
  uploaded_documents?: string[];

  [key: string]: unknown;
}

export interface DashboardSummary {
  overall_risk_score: number;
  opportunity_score: number;
  posture: string;
  opportunity_posture: string;
  urgency: string;
  confidence: number;
  horizon: string;
  summary: string;
  live_signal_count: number;
  positive_signal_count: number;
  agent_snapshots?: {
    analyst?: string;
    advisor?: string;
    profile_agent?: string;
    [key: string]: string | undefined;
  };
  [key: string]: unknown;
}

export interface GovernanceSettings {
  mask_company_sensitive_terms: boolean;
  mask_financial_values: boolean;
  mask_contact_identities: boolean;
  anonymise_before_ai_analysis: boolean;
  retain_internal_reference_labels_only: boolean;
  [key: string]: unknown;
}

export interface ConfigState {
  signal_threshold: number;
  severity_weighting: number;
  opportunity_sensitivity: number;
  risk_opportunity_weighting: number;
  horizon_preference: string;
  analyst_tone_mode: string;
  advisor_stance_mode: string;
  recommendation_aggressiveness: number;
  profile_question_depth: string;
  live_ingestion_enabled: boolean;
  refresh_cadence: string;
  external_lookup_enabled: boolean;
  anonymisation_enabled: boolean;
  profile_enrichment_allowed: boolean;
  [key: string]: unknown;
}

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

export interface AgentMessage {
  id: string;
  role: "user" | "assistant" | "system";
  timestamp: string;
  tone?: string;
  content: string;
}