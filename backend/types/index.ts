export type RiskKey =
  | "energy"
  | "supply_chain"
  | "inflation"
  | "consumer_demand"
  | "market_volatility";

export interface CompanyIdentity {
  official_name: string;
  company_number: string;
  status: string;
  sic_codes: string[];
  registered_country: string;
  last_filing_date?: string | null;
  filing_activity_recency_signal: number;
  sector: string;
  sub_sector: string;
  verification_status: string;
  baseline_exposure_assumptions: Record<RiskKey, number>;
  enrichment_source: string;
}

export interface BehaviouralSignals {
  most_discussed_risk_category?: string | null;
  most_simulated_scenario_type?: string | null;
  preferred_severity_assumption: number;
  executive_question_themes: string[];
  mitigation_bias: number;
  opportunity_bias: number;
  interaction_count: number;
  last_updated?: string | null;
}

export interface CompanyProfile {
  company_id: string;
  identity?: CompanyIdentity | null;
  user_exposure_inputs: Record<RiskKey, number>;
  behavioural_signals: BehaviouralSignals;
}

export interface AdaptiveExposureResult {
  dynamic_exposure_coefficients: Record<RiskKey, number>;
  risk_sensitivity_multipliers: Record<RiskKey, number>;
  scenario_vulnerability_index: number;
  dominant_risk_sensitivity: string;
  behavioural_focus_signal: string;
}

export interface CompanyIntelligenceConfidence {
  score: number;
  profile_completeness_percent: number;
  suggestions: string[];
  breakdown: Record<string, number>;
}

export interface DashboardScenarioResponse {
  scenario_type: string;
  company_name: string;
  posture: string;
  executive_summary: string;
  second_order_effects: string[];
  recommended_actions: string[];
  reasoning_banner: string;
  profile_driven_insight: string;
  weighted_risk_scores: Record<RiskKey, number>;
}

export interface DashboardResponse {
  company_profile: CompanyProfile;
  adaptive_exposure: AdaptiveExposureResult;
  confidence: CompanyIntelligenceConfidence;
  scenario: DashboardScenarioResponse;
}
