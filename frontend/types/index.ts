export type AgentContribution = {
  agent: string;
  reason: string;
  perspective_tags: string[];
  insight_points: string[];
  executive_implications: string[];
  recommended_actions: string[];
};

export type SignalItem = {
  id: string;
  source: string;
  title: string;
  summary: string;
  region: string;
  signal_type: string;
  confidence: number;
  timestamp: string;
  tags: string[];
  potential_severity: number;
  raw_url?: string | null;
  urgency: "low" | "medium" | "high" | "critical";
  horizon: "immediate" | "30-day" | "strategic";
};

export type EventItem = {
  id: string;
  headline: string;
  body: string;
  category: string;
  severity: number;
  region: string;
  tags: string[];
  timestamp: string;
  source: string;
  source_signal_id?: string | null;
  urgency: "low" | "medium" | "high" | "critical";
  confidence: number;
  horizon: "immediate" | "30-day" | "strategic";
  related_event_ids: string[];
  cluster_id?: string | null;
  agent_contributions: AgentContribution[];
  executive_summary: string;
  recommended_actions: string[];
};

export type EventCluster = {
  cluster_id: string;
  label: string;
  summary: string;
  related_event_ids: string[];
  dominant_risk_category: string;
  trend_status: string;
  confidence: number;
  last_updated: string;
  urgency: "low" | "medium" | "high" | "critical";
  horizon: "immediate" | "30-day" | "strategic";
};

export type RiskSnapshot = {
  timestamp: string;
  overall_risk: number;
  posture: string;
  category_breakdown: Record<string, number>;
  company_adjusted_score: number;
  top_active_clusters: string[];
  momentum: string;
};

export type DashboardResponse = {
  overall_risk_score: number;
  company_adjusted_score: number;
  posture: string;
  summary: string;
  category_scores: Record<string, number>;
  top_clusters: string[];
  urgency: string;
  confidence: number;
  horizon: string;
  contributing_agents: AgentContribution[];
  momentum: string;
  updated_at: string;
};

export type DashboardTrendsResponse = {
  current_overall_risk: number;
  previous_overall_risk: number;
  delta: number;
  momentum: string;
  posture: string;
  snapshots: RiskSnapshot[];
};

export type CompanyProfile = {
  company_name: string;
  sector: string;
  sub_sector: string;
  supply_chain_exposure_regions: string[];
  energy_dependency_level: number;
  import_export_exposure: number;
  consumer_sensitivity_level: number;
  financial_leverage_sensitivity: number;
  strategic_priorities: string[];
};