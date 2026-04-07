import {
  AgentMessage,
  CompanyProfile,
  ConfigState,
  DashboardSummary,
  GovernanceSettings,
  OpportunityItem,
  SignalItem,
} from "../types/geopulse";

function minutesAgoIso(minutes: number): string {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

function relativeTimeFromMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} mins ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function buildSignal(args: {
  id: string;
  headline: string;
  summary: string;
  source: string;
  source_type?: string;
  region: string;
  cluster_tag: string;
  kind: "risk" | "opportunity";
  severity: "low" | "medium" | "high";
  confidence_score: number;
  freshness_minutes: number;
  signal_strength: number;
  lifecycle?: string;
}) {
  const detectedAt = minutesAgoIso(args.freshness_minutes);

  return {
    id: args.id,
    headline: args.headline,
    summary: args.summary,
    source: args.source,
    source_type: args.source_type ?? "news",
    region: args.region,
    cluster_tag: args.cluster_tag,
    kind: args.kind,
    severity: args.severity,
    confidence_score: args.confidence_score,
    freshness_minutes: args.freshness_minutes,
    signal_strength: args.signal_strength,
    timestamp: detectedAt,
    detected_at: detectedAt,
    lifecycle:
      args.lifecycle ??
      (args.freshness_minutes <= 60
        ? "Fresh"
        : args.freshness_minutes <= 180
        ? "Watch"
        : "Aging"),
    relative_time: relativeTimeFromMinutes(args.freshness_minutes),

    // compatibility
    confidence: args.confidence_score,
    horizon:
      args.freshness_minutes <= 60
        ? "immediate"
        : args.freshness_minutes <= 180
        ? "near-term"
        : "mid-term",
    tags: [],
  } as SignalItem;
}

export const demoSignals: SignalItem[] = [
  buildSignal({
    id: "sig-1",
    headline:
      "European energy storage investment accelerates as grid resilience programmes expand",
    source: "Reuters",
    source_type: "rss",
    region: "Europe",
    severity: "medium",
    kind: "opportunity",
    cluster_tag: "Energy Transition",
    confidence_score: 83,
    freshness_minutes: 12,
    signal_strength: 81,
    summary:
      "Growing resilience and storage investment may open procurement, services, financing, or supply partnerships for exposed businesses.",
  }),
  buildSignal({
    id: "sig-2",
    headline:
      "Freight route disruption raises short-term logistics cost pressure across key shipping lanes",
    source: "Bloomberg",
    source_type: "news",
    region: "Global",
    severity: "high",
    kind: "risk",
    cluster_tag: "Supply Chain / Logistics",
    confidence_score: 88,
    freshness_minutes: 47,
    signal_strength: 86,
    summary:
      "Import-reliant businesses could face lead-time instability, repricing, and margin compression.",
  }),
  buildSignal({
    id: "sig-3",
    headline:
      "UK industrial incentive package boosts advanced manufacturing investment momentum",
    source: "MarketWatch",
    source_type: "news",
    region: "United Kingdom",
    severity: "medium",
    kind: "opportunity",
    cluster_tag: "Industrial Policy",
    confidence_score: 79,
    freshness_minutes: 95,
    signal_strength: 74,
    summary:
      "Policy support may create expansion, retrofit, automation, and supplier onboarding opportunities.",
  }),
  buildSignal({
    id: "sig-4",
    headline:
      "Consumer spending indicators soften in selected discretionary categories",
    source: "Financial Times",
    source_type: "news",
    region: "UK / Europe",
    severity: "medium",
    kind: "risk",
    cluster_tag: "Demand / Consumer",
    confidence_score: 74,
    freshness_minutes: 155,
    signal_strength: 70,
    summary:
      "Demand-exposed businesses may need stronger pricing discipline, segmentation, and campaign precision.",
  }),
];

export const demoOpportunities: OpportunityItem[] = [
  {
    id: "opp-1",
    title: "Resilience-led service expansion",
    category: "Operational Growth",
    score: 82,
    timing_window: "Next 30-90 days",
    summary:
      "Rising resilience concerns create room for support services, consulting, rapid implementation, and efficiency-driven offers.",
    actions: [
      "Reframe existing offer around resilience outcomes",
      "Create campaign targeting operational continuity pain points",
      "Bundle advisory + implementation options",
    ],
    confidence: 84,
    regions: ["UK", "Europe"],
  },
  {
    id: "opp-2",
    title: "Energy-transition partnership positioning",
    category: "Strategic Opportunity",
    score: 76,
    timing_window: "Next quarter",
    summary:
      "Signals suggest increasing budget allocation toward energy and efficiency transition initiatives.",
    actions: [
      "Map sectors under energy pressure",
      "Build targeted messaging for margin protection",
      "Create partner-ready solution package",
    ],
    confidence: 78,
    regions: ["Europe"],
  },
  {
    id: "opp-3",
    title: "Policy-enabled market entry signals",
    category: "Expansion",
    score: 71,
    timing_window: "Next 3-6 months",
    summary:
      "Selected sectors may accelerate digital transformation and procurement activity under policy and cost pressure.",
    actions: [
      "Identify 3 target verticals",
      "Produce rapid-entry commercial pack",
      "Prepare advisory narrative for leadership buyers",
    ],
    confidence: 73,
    regions: ["UK"],
  },
];

export const demoCompanyProfile: CompanyProfile = {
  company_name: "My Company",
  registration_number: "01234567",
  company_status: "Active",
  incorporation_date: "2019-04-01",
  sic_context: "Technology / Advisory / Services",
  sector: "Professional Services",
  sub_sector: "AI Advisory / Strategic Intelligence",
  supply_chain_exposure_regions: ["UK", "Europe"],
  energy_dependency_level: 38,
  import_export_exposure: 42,
  consumer_sensitivity_level: 51,
  financial_leverage_sensitivity: 34,
  regulatory_sensitivity_level: 45,
  strategic_priorities: ["growth", "resilience", "margin protection"],
  supplier_logistics_notes:
    "Limited direct supplier risk but dependent on software, cloud, and digital delivery partners.",
  company_notes:
    "Commercial positioning benefits from timely intelligence and executive-grade recommendation outputs.",
  custom_intelligence_notes:
    "Prioritise opportunity-led recommendations where possible, but preserve governance and trust indicators.",
};

export const demoGovernance: GovernanceSettings = {
  mask_company_sensitive_terms: true,
  mask_financial_values: true,
  mask_contact_identities: true,
  anonymise_before_ai_analysis: true,
  retain_internal_reference_labels_only: false,
};

export const demoConfig: ConfigState = {
  signal_threshold: 65,
  severity_weighting: 72,
  opportunity_sensitivity: 70,
  risk_opportunity_weighting: 55,
  horizon_preference: "balanced",
  analyst_tone_mode: "boardroom",
  advisor_stance_mode: "balanced",
  recommendation_aggressiveness: 68,
  profile_question_depth: "medium",
  live_ingestion_enabled: true,
  refresh_cadence: "Every 15 minutes",
  external_lookup_enabled: true,
  anonymisation_enabled: true,
  profile_enrichment_allowed: true,
};

const visibleSignals = demoSignals.length;
const averageConfidence =
  visibleSignals > 0
    ? Math.round(
        demoSignals.reduce(
          (sum, signal: any) => sum + (signal.confidence_score ?? 0),
          0
        ) / visibleSignals
      )
    : 0;

export const demoDashboardSummary: DashboardSummary = {
  overall_risk_score: 77,
  opportunity_score: 74,
  posture: "Heightened Attention",
  opportunity_posture: "Active Opportunity Window",
  urgency: "High",
  confidence: averageConfidence,
  horizon: "Immediate / Near-Term",
  summary:
    "GeoPulse is detecting a mixed operating environment with elevated logistics and consumer pressure, but also visible growth windows in resilience-led services, efficiency offers, and policy-aligned expansion themes.",
  live_signal_count: visibleSignals,
  positive_signal_count: demoSignals.filter((s) => (s as any).kind === "opportunity")
    .length,
  agent_snapshots: {
    analyst:
      "Signals are clustering around logistics instability, energy transition, and selective policy-driven investment momentum.",
    advisor:
      "Leadership should protect margin, tighten monitoring on cost-sensitive dependencies, and actively pursue resilience-led commercial positioning.",
    profile_agent:
      "GeoPulse can improve relevance further by learning target markets, priority customer segments, and recommendation style preference.",
  },
} as DashboardSummary;

export const demoAnalystMessages: AgentMessage[] = [
  {
    id: "a1",
    role: "assistant",
    timestamp: new Date().toISOString(),
    tone: "analytical",
    content:
      "The strongest emerging pattern is a split environment: external cost and logistics pressure remains elevated, but these same stresses are creating buying appetite for resilience, efficiency, and strategic visibility solutions.",
  },
];

export const demoAdvisorMessages: AgentMessage[] = [
  {
    id: "b1",
    role: "assistant",
    timestamp: new Date().toISOString(),
    tone: "executive",
    content:
      "Prioritise three actions: protect margin exposure, package a resilience-led commercial offer, and tighten your monitoring cadence in the highest-volatility external categories.",
  },
];

export const demoProfileAgentMessages: AgentMessage[] = [
  {
    id: "c1",
    role: "assistant",
    timestamp: new Date().toISOString(),
    tone: "consultative",
    content:
      "To improve recommendation quality, tell me which markets matter most to your business, your top three strategic priorities this quarter, and whether you want conservative, balanced, or aggressive recommendations.",
  },
];