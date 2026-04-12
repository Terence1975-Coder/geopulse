"use client";

import { useEffect, useMemo, useState } from "react";
import WorkspaceNavigation from "../components/WorkspaceNavigation";
import FocusModePanelShell from "../components/FocusModePanelShell";
import ExecutiveDashboardView from "../workspaces/ExecutiveDashboardView";
import LiveSignalsWorkspace from "../workspaces/LiveSignalsWorkspace";
import OpportunityWorkspace from "../workspaces/OpportunityWorkspace";
import CompanyIntelligenceWorkspace from "../workspaces/CompanyIntelligenceWorkspace";
import PlannerAgentWorkspace from "../workspaces/PlannerAgentWorkspace";
import AdvisorAgentWorkspace from "../workspaces/AdvisorAgentWorkspace";
import AnalystAgentWorkspace from "../workspaces/AnalystAgentWorkspace";
import CompanyProfileAgentWorkspace from "../workspaces/CompanyProfileAgentWorkspace";
import DataGovernanceWorkspace from "../workspaces/DataGovernanceWorkspace";
import ConfigurationWorkspace from "../workspaces/ConfigurationWorkspace";
import AgentChainWorkspace from "../components/AgentChainWorkspace";

import {
  demoConfig,
  demoGovernance,
  demoOpportunities,
} from "../lib/geopulse-demo-data";

import {
  ConfigState,
  DashboardSummary,
  GovernanceSettings,
  OpportunityItem,
  SignalItem,
  WorkspaceKey,
} from "../types/geopulse";

import type {
  ChainOutputs,
  CompanyProfile,
  WorkspaceMessage,
} from "../types/intelligence";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

type BackendCompanyProfileResponse = {
  company_name?: string | null;
  company_id?: string | null;
  market_focus?: string[];
  strategic_priorities?: string[];
  recommendation_posture?: string | null;
  profile?: Record<string, any>;
  updated_at?: string | null;
};

function toPercent(value?: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return value > 1 ? Math.round(value) : Math.round(value * 100);
}

function mapProfileToIntelligenceProfile(profile: any): CompanyProfile {
  const markets =
    Array.isArray(profile?.markets) && profile.markets.length > 0
      ? profile.markets
      : typeof profile?.exposure_regions === "string"
      ? profile.exposure_regions
          .split(",")
          .map((item: string) => item.trim())
          .filter(Boolean)
      : typeof profile?.exposureRegions === "string"
      ? profile.exposureRegions
          .split(",")
          .map((item: string) => item.trim())
          .filter(Boolean)
      : [];

  const strategicPriorities =
    Array.isArray(profile?.strategic_priorities) &&
    profile.strategic_priorities.length > 0
      ? profile.strategic_priorities
      : Array.isArray(profile?.strategicPriorities) &&
        profile.strategicPriorities.length > 0
      ? profile.strategicPriorities
      : [
          "Protect margin",
          "Grow revenue",
          "Improve strategic visibility",
        ];

  return {
    company_name:
      profile?.company_name ||
      profile?.companyName ||
      profile?.name ||
      "GeoPulse Intelligence Ltd",
    sector: profile?.sector || "Professional Services",
    markets,
    strategic_priorities: strategicPriorities,
    operating_model:
      profile?.operating_model ||
      profile?.operatingModel ||
      "B2B advisory and strategic intelligence services",
    cost_sensitivities: Array.isArray(profile?.cost_sensitivities)
      ? profile.cost_sensitivities
      : [
          "energy",
          "import / export exposure",
          "consumer sensitivity",
          "financial leverage sensitivity",
        ],
    growth_objectives: Array.isArray(profile?.growth_objectives)
      ? profile.growth_objectives
      : ["Expand accounts", "Improve resilience", "Increase visibility value"],
    risk_tolerance:
      profile?.risk_tolerance || profile?.riskTolerance || "balanced",
    recommendation_style:
      profile?.recommendation_style ||
      profile?.recommendationStyle ||
      "balanced",
    notes:
      profile?.sub_sector ||
      profile?.subSector ||
      profile?.sic_context ||
      profile?.sic ||
      "",
  } as CompanyProfile;
}

function normaliseSignal(signal: any): SignalItem {
  const timestamp =
    signal?.timestamp ||
    signal?.detected_at ||
    new Date().toISOString();

  return {
    id: String(signal?.id ?? crypto.randomUUID()),
    headline: signal?.headline || "Untitled signal",
    summary: signal?.summary || "",
    source: signal?.source || "Unknown",
    source_type: signal?.source_type || "unknown",
    region: signal?.region || "Global",
    cluster_tag: signal?.cluster_tag || "General",
    kind: signal?.kind || "risk",
    severity: signal?.severity || "medium",
    confidence_score:
      typeof signal?.confidence_score === "number"
        ? signal.confidence_score
        : typeof signal?.confidence === "number"
        ? signal.confidence
        : 0,
    freshness_minutes:
      typeof signal?.freshness_minutes === "number"
        ? signal.freshness_minutes
        : 0,
    signal_strength:
      typeof signal?.signal_strength === "number"
        ? signal.signal_strength
        : 0,
    timestamp,
    detected_at: signal?.detected_at || timestamp,
    lifecycle: signal?.lifecycle || "Unknown",
    relative_time: signal?.relative_time || "unknown",
  } as SignalItem;
}

function buildFallbackSummary(args: {
  signals: SignalItem[];
  chainOutputs: ChainOutputs;
  companyProfile: CompanyProfile;
  loadingSignals: boolean;
  loadingSummary: boolean;
}): DashboardSummary {
  const { signals, chainOutputs, companyProfile, loadingSignals, loadingSummary } =
    args;

  const riskSignals = signals.filter((signal) => signal.kind === "risk");
  const opportunitySignals = signals.filter(
    (signal) => signal.kind === "opportunity"
  );

  const avgConfidence =
    signals.length > 0
      ? Math.round(
          signals.reduce(
            (sum, signal) => sum + toPercent(Number(signal.confidence_score || 0)),
            0
          ) / signals.length
        )
      : 0;

  const avgStrength =
    signals.length > 0
      ? Math.round(
          signals.reduce(
            (sum, signal) => sum + toPercent(Number(signal.signal_strength || 0)),
            0
          ) / signals.length
        )
      : 0;

  const derivedRiskScore =
    riskSignals.length > 0
      ? Math.round(
          riskSignals.reduce(
            (sum, signal) =>
              sum + toPercent(Number(signal.signal_strength || 0)),
            0
          ) / riskSignals.length
        )
      : Math.max(35, Math.min(85, avgStrength));

  const derivedOpportunityScore =
    opportunitySignals.length > 0
      ? Math.round(
          opportunitySignals.reduce(
            (sum, signal) =>
              sum + toPercent(Number(signal.signal_strength || 0)),
            0
          ) / opportunitySignals.length
        )
      : Math.max(30, Math.min(85, Math.round(avgStrength * 0.92)));

  const freshestMinutes =
    signals.length > 0
      ? Math.min(...signals.map((signal) => Number(signal.freshness_minutes || 0)))
      : 999999;

  const horizon =
    freshestMinutes <= 60
      ? "Immediate"
      : freshestMinutes <= 360
      ? "Near-Term"
      : "Medium-Term";

  const posture =
    derivedRiskScore >= 75
      ? "Heightened Attention"
      : derivedRiskScore >= 60
      ? "Active Monitoring"
      : "Measured Watch";

  const opportunityPosture =
    derivedOpportunityScore >= 75
      ? "Active Opportunity Window"
      : derivedOpportunityScore >= 60
      ? "Targeted Upside"
      : "Selective Monitoring";

  const urgency =
    freshestMinutes <= 60
      ? "High"
      : freshestMinutes <= 360
      ? "Elevated"
      : "Moderate";

  const summaryText =
    loadingSignals || loadingSummary
      ? "Loading live executive intelligence..."
      : signals.length === 0
      ? "No live signals are available yet. GeoPulse is ready to populate the executive surface as new intelligence arrives."
      : `GeoPulse is currently tracking ${signals.length} live signal${
          signals.length === 1 ? "" : "s"
        }, with ${riskSignals.length} risk-led and ${
          opportunitySignals.length
        } opportunity-led items shaping the current executive picture for ${
          companyProfile.company_name || "this company"
        }.`;

  return {
    overall_risk_score: derivedRiskScore,
    opportunity_score: derivedOpportunityScore,
    posture,
    opportunity_posture: opportunityPosture,
    urgency,
    confidence: avgConfidence,
    horizon,
    summary: summaryText,
    live_signal_count: signals.length,
    positive_signal_count: opportunitySignals.length,
    agent_snapshots: {
      analyst:
        (chainOutputs as any)?.analyse?.key_insight ||
        "No analyst snapshot available yet.",
      advisor:
        (chainOutputs as any)?.advise?.key_insight ||
        "No advisor snapshot available yet.",
      profile_agent:
        (chainOutputs as any)?.profile?.key_insight ||
        (companyProfile?.strategic_priorities?.length
          ? `GeoPulse is currently calibrated around: ${companyProfile.strategic_priorities.join(
              ", "
            )}.`
          : "No profile agent snapshot available yet."),
    },
  } as DashboardSummary;
}

function buildPanelContent(args: {
  title: string;
  summary: DashboardSummary;
  signals: SignalItem[];
  companyProfile: CompanyProfile;
}) {
  const { title, summary, signals, companyProfile } = args;

  const riskSignals = signals.filter((signal) => signal.kind === "risk");
  const opportunitySignals = signals.filter(
    (signal) => signal.kind === "opportunity"
  );

  if (title === "Risk Posture" || title === "Risk Analysis") {
    return (
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-amber-400/20 bg-amber-500/10 p-6">
            <div className="text-xs uppercase tracking-[0.2em] text-amber-200/80">
              Risk Readout
            </div>
            <h3 className="mt-3 text-3xl font-semibold text-white">
              {summary.posture}
            </h3>
            <p className="mt-4 text-sm leading-8 text-slate-200">
              GeoPulse is identifying the current risk posture as a live executive
              condition shaped by external signal strength, timing pressure, and
              concentration across the most material negative developments.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <PanelPill label="Risk Score" value={`${summary.overall_risk_score}`} tone="risk" />
              <PanelPill label="Urgency" value={summary.urgency} tone="risk" />
              <PanelPill label="Horizon" value={summary.horizon} tone="neutral" />
              <PanelPill label="Confidence" value={`${summary.confidence}%`} tone="neutral" />
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Priority Risk Signals
            </div>
            <div className="mt-4 space-y-4">
              {riskSignals.length === 0 ? (
                <div className="text-sm text-slate-400">
                  No risk signals available yet.
                </div>
              ) : (
                riskSignals.slice(0, 4).map((signal) => (
                  <div
                    key={signal.id}
                    className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"
                  >
                    <div className="text-sm font-semibold text-white">
                      {signal.headline}
                    </div>
                    <div className="mt-2 text-sm leading-7 text-slate-300">
                      {signal.summary}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <PanelMetricCard label="Risk Signals" value={String(riskSignals.length)} />
          <PanelMetricCard
            label="Average Strength"
            value={`${
              riskSignals.length
                ? Math.round(
                    riskSignals.reduce(
                      (sum, signal) => sum + toPercent(Number(signal.signal_strength || 0)),
                      0
                    ) / riskSignals.length
                  )
                : 0
            }%`}
          />
          <PanelMetricCard
            label="Average Confidence"
            value={`${
              riskSignals.length
                ? Math.round(
                    riskSignals.reduce(
                      (sum, signal) => sum + toPercent(Number(signal.confidence_score || 0)),
                      0
                    ) / riskSignals.length
                  )
                : 0
            }%`}
          />
        </div>
      </div>
    );
  }

  if (title === "Opportunity Posture") {
    return (
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-6">
            <div className="text-xs uppercase tracking-[0.2em] text-emerald-200/80">
              Opportunity Readout
            </div>
            <h3 className="mt-3 text-3xl font-semibold text-white">
              {summary.opportunity_posture}
            </h3>
            <p className="mt-4 text-sm leading-8 text-slate-200">
              GeoPulse is identifying actionable upside conditions shaped by live
              resilience demand, timing-sensitive openings, and signal clustering
              around commercially relevant opportunity themes.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <PanelPill label="Opportunity Score" value={`${summary.opportunity_score}`} tone="opportunity" />
              <PanelPill label="Positive Signals" value={`${summary.positive_signal_count}`} tone="opportunity" />
              <PanelPill label="Horizon" value={summary.horizon} tone="neutral" />
              <PanelPill label="Confidence" value={`${summary.confidence}%`} tone="neutral" />
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Priority Opportunity Signals
            </div>
            <div className="mt-4 space-y-4">
              {opportunitySignals.length === 0 ? (
                <div className="text-sm text-slate-400">
                  No opportunity signals available yet.
                </div>
              ) : (
                opportunitySignals.slice(0, 4).map((signal) => (
                  <div
                    key={signal.id}
                    className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"
                  >
                    <div className="text-sm font-semibold text-white">
                      {signal.headline}
                    </div>
                    <div className="mt-2 text-sm leading-7 text-slate-300">
                      {signal.summary}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <PanelMetricCard label="Opportunity Signals" value={String(opportunitySignals.length)} />
          <PanelMetricCard
            label="Average Strength"
            value={`${
              opportunitySignals.length
                ? Math.round(
                    opportunitySignals.reduce(
                      (sum, signal) => sum + toPercent(Number(signal.signal_strength || 0)),
                      0
                    ) / opportunitySignals.length
                  )
                : 0
            }%`}
          />
          <PanelMetricCard
            label="Average Confidence"
            value={`${
              opportunitySignals.length
                ? Math.round(
                    opportunitySignals.reduce(
                      (sum, signal) => sum + toPercent(Number(signal.confidence_score || 0)),
                      0
                    ) / opportunitySignals.length
                  )
                : 0
            }%`}
          />
          <div className="rounded-3xl border border-cyan-400/20 bg-cyan-500/10 p-5">
            <div className="text-xs uppercase tracking-[0.18em] text-cyan-200/80">
              Company Calibration
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-100">
              Opportunity interpretation is being framed against{" "}
              {companyProfile.company_name || "the current company profile"} and
              its active priorities of{" "}
              {companyProfile.strategic_priorities?.join(", ") || "growth and resilience"}.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <div className="text-sm font-medium text-white">Panel Summary</div>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          This focus mode is designed to widen exploration surfaces,
          reduce clutter, and give GeoPulse a premium boardroom-grade
          drill-down experience.
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <div className="text-sm font-medium text-white">
          Mid-Layer Insight
        </div>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          Use this space to inject richer cluster analysis, scenario
          implications, source metadata, and deeper agent interpretation.
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <div className="text-sm font-medium text-white">
          Deeper Workspace Surface
        </div>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          This shell is intentionally wide so future drill-downs can
          include charts, timelines, agent debates, source provenance, and
          company-specific calibration overlays.
        </p>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [activeWorkspace, setActiveWorkspace] =
    useState<WorkspaceKey>("agent-chain");

  const [profile, setProfile] = useState<any>({
    company_name: "GeoPulse Intelligence Ltd",
    registration_number: "15443321",
    company_status: "Active",
    incorporation_date: "2024-01-18",
    sic_context: "62012 / 70229 / 62090",
    sector: "Professional Services",
    sub_sector: "AI Advisory / Strategic Intelligence",
    exposure_regions: "UK, Europe",
    strategic_priorities: [
      "Protect margin",
      "Grow revenue",
      "Improve strategic visibility",
    ],
    risk_tolerance: "balanced",
    recommendation_style: "balanced",
  });

  const [governance, setGovernance] =
    useState<GovernanceSettings>(demoGovernance);
  const [config, setConfig] = useState<ConfigState>(demoConfig);

  const [analystMessages, setAnalystMessages] = useState<WorkspaceMessage[]>([]);
  const [advisorMessages, setAdvisorMessages] = useState<WorkspaceMessage[]>([]);
  const [plannerMessages, setPlannerMessages] = useState<WorkspaceMessage[]>([]);
  const [profileMessages, setProfileMessages] = useState<WorkspaceMessage[]>([]);

  const [chainOutputs, setChainOutputs] = useState<ChainOutputs>({
    analyse: null,
    advise: null,
    plan: null,
    profile: null,
  });

  const [chainInput, setChainInput] = useState(
    "Resilience-led service expansion\nRising resilience concerns create room for support services, consulting, rapid implementation, and efficiency-driven offers."
  );
  const [chainResult, setChainResult] = useState<any | null>(null);
  const [chainLoading, setChainLoading] = useState(false);
  const [chainNotice, setChainNotice] = useState<string | null>(null);

  const [signals, setSignals] = useState<SignalItem[]>([]);
  const [liveOpportunities, setLiveOpportunities] =
	useState<OpportunityItem[]>(demoOpportunities);
  const [rawDashboardSummary, setRawDashboardSummary] =
	useState<DashboardSummary | null>(null);
  const [loadingSignals, setLoadingSignals] = useState(false);
  const [loadingOpportunities, setLoadingOpportunities] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [focusOpen, setFocusOpen] = useState(false);
  const [focusTitle, setFocusTitle] = useState("Panel Detail");
  const [focusBreadcrumb, setFocusBreadcrumb] = useState<string[]>([
    "Executive Dashboard",
    "Panel",
  ]);
  const [selectedSignal, setSelectedSignal] = useState<SignalItem | null>(null);
  
  const [plannerExecutionRequest, setPlannerExecutionRequest] = useState<{
	id: string;
	prompt: string;
	methodology: "auto" | "prince2" | "agile";
  } | null>(null);

  const companyProfile = useMemo(
    () => mapProfileToIntelligenceProfile(profile),
    [profile]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadSignals() {
      try {
        setLoadingSignals(true);

        const response = await fetch(`${API_BASE}/intel/signals`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Failed to load signals: ${response.status}`);
        }

        const data = await response.json();
		if (!cancelled) {
		  const nextSignals = Array.isArray(data)
			? data
			: Array.isArray(data?.signals)
			? data.signals
			: [];
		  setSignals(nextSignals.map(normaliseSignal));
		}
		
      } catch (error) {
        console.error("Failed to load signals", error);
        if (!cancelled) {
          setSignals([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingSignals(false);
        }
      }
    }

    async function loadSummary() {
      try {
        setLoadingSummary(true);

        const response = await fetch(`${API_BASE}/intel/dashboard/summary`, {
          cache: "no-store",
        });

        if (!response.ok) {
          if (!cancelled) {
            setRawDashboardSummary(null);
          }
          return;
        }

        const data = await response.json();
        if (!cancelled) {
          setRawDashboardSummary(data ?? null);
        }
      } catch (error) {
        console.error("Failed to load dashboard summary", error);
        if (!cancelled) {
          setRawDashboardSummary(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingSummary(false);
        }
      }
    }

    async function loadSavedCompanyProfile() {
      try {
        setLoadingProfile(true);

        const response = await fetch(`${API_BASE}/intel/company-profile`, {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const data: BackendCompanyProfileResponse | null = await response.json();
        if (!data || !data.profile || cancelled) {
          return;
        }

        const savedProfile = data.profile;

		setProfile((prev: any) => ({
			...prev,
			...savedProfile,
			company_name:
				savedProfile.company_name ||
				data.company_name ||
				prev.company_name,
			strategic_priorities:
				savedProfile.strategic_priorities ||
				data.strategic_priorities ||
				prev.strategic_priorities,
			recommendation_style:
				savedProfile.recommendation_style ||
				data.recommendation_posture ||
				prev.recommendation_style,
			markets:
				savedProfile.markets ||
				data.market_focus ||
				prev.markets,
		  }));
      } catch (error) {
        console.error("Failed to load saved company profile", error);
      } finally {
        if (!cancelled) {
          setLoadingProfile(false);
        }
      }
    }
	
	async function loadOpportunities() {
	  try {
		setLoadingOpportunities(true);

		const response = await fetch(`${API_BASE}/intel/opportunities`, {
		  cache: "no-store",
		});

		if (!response.ok) {
		  throw new Error(`Failed to load opportunities: ${response.status}`);
		}

		const data = await response.json();

		if (!cancelled) {
		  const nextOpportunities = Array.isArray(data)
			? data
			: Array.isArray(data?.opportunities)
			? data.opportunities
			: [];

		  setLiveOpportunities(
			nextOpportunities.length > 0 ? nextOpportunities : demoOpportunities
		  );
		}
	  } catch (error) {
		console.error("Failed to load opportunities", error);

		if (!cancelled) {
		  setLiveOpportunities(demoOpportunities);
	    }
      } finally {
		if (!cancelled) {
		  setLoadingOpportunities(false);
		}
	  }
	}
	
    async function loadAll() {
	  await Promise.all([
		loadSignals(),
		loadOpportunities(),
		loadSummary(),
		loadSavedCompanyProfile(),
	  ]);

	  if (!cancelled) {
		setLastUpdated(new Date());
	  }
	}

	void loadAll();

	const interval = setInterval(() => {
	  void loadAll();
	}, 60000);

	return () => {
	  cancelled = true;
	  clearInterval(interval);
	};    
  }, []);

  const dashboardSummary = useMemo(() => {
    const fallback = buildFallbackSummary({
      signals,
      chainOutputs,
      companyProfile,
      loadingSignals,
      loadingSummary,
    });

    const safeSummary = rawDashboardSummary
      ? ({
          ...fallback,
          ...rawDashboardSummary,
          agent_snapshots: {
            ...fallback.agent_snapshots,
            ...(rawDashboardSummary.agent_snapshots || {}),
          },
        } as DashboardSummary)
      : fallback;

    return {
      ...safeSummary,
      agent_snapshots: {
        analyst:
          (chainOutputs as any)?.analyse?.key_insight ||
          safeSummary.agent_snapshots?.analyst ||
          "No analyst snapshot available yet.",
        advisor:
          (chainOutputs as any)?.advise?.key_insight ||
          safeSummary.agent_snapshots?.advisor ||
          "No advisor snapshot available yet.",
        profile_agent:
          (chainOutputs as any)?.profile?.key_insight ||
          (companyProfile?.strategic_priorities?.length
            ? `GeoPulse is currently calibrated around: ${companyProfile.strategic_priorities.join(
                ", "
              )}.`
            : safeSummary.agent_snapshots?.profile_agent) ||
          "No profile agent snapshot available yet.",
      },
    };
  }, [
    rawDashboardSummary,
    signals,
    chainOutputs,
    companyProfile,
    loadingSignals,
    loadingSummary,
  ]);

  const openPanel = (panelTitle: string) => {
    setFocusTitle(panelTitle);
    setFocusBreadcrumb(["Executive Dashboard", panelTitle]);
    setSelectedSignal(null);
    setFocusOpen(true);
  };

  const openSignal = (signal: SignalItem) => {
    setSelectedSignal(signal);
    setFocusTitle(signal.headline);
    setFocusBreadcrumb(["Live Signals", signal.cluster_tag, "Signal Detail"]);
    setFocusOpen(true);
  };

  const renderWorkspace = () => {
    switch (activeWorkspace) {
      case "executive":
        return (
          <div className="space-y-4">
            {(loadingSignals || loadingOpportunities || loadingSummary || loadingProfile) && (
			  <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
				Loading live GeoPulse intelligence...
			  </div>
			)}

            <ExecutiveDashboardView
			  summary={dashboardSummary}
			  signals={signals}
			  opportunities={liveOpportunities}
			  profile={profile}
			  onExpandPanel={openPanel}
			  onNavigate={(target) => setActiveWorkspace(target)}
			/>
          </div>
        );

      case "signals":
        return (
          <div className="space-y-4">
            {loadingSignals && (
              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
                Loading live signals...
              </div>
            )}

            <LiveSignalsWorkspace
              signals={signals}
              onOpenSignal={openSignal}
            />
          </div>
        );

      case "opportunities":
        return (
          <OpportunityWorkspace
			opportunities={liveOpportunities}
			signals={signals}
		  />
        );

      case "company":
        return (
          <CompanyIntelligenceWorkspace
            profile={profile}
            onUpdate={setProfile}
          />
        );

      case "analyst":
        return (
          <AnalystAgentWorkspace
            messages={analystMessages}
            setMessages={setAnalystMessages}
            chainOutputs={chainOutputs}
            setChainOutputs={setChainOutputs}
            companyProfile={companyProfile}
          />
        );

      case "advisor":
        return (
          <AdvisorAgentWorkspace
            messages={advisorMessages}
            setMessages={setAdvisorMessages}
            chainOutputs={chainOutputs}
            setChainOutputs={setChainOutputs}
            companyProfile={companyProfile}
          />
        );

      case "planner":
        return (
          <PlannerAgentWorkspace
            messages={plannerMessages}
			setMessages={setPlannerMessages}
			chainOutputs={chainOutputs}
			setChainOutputs={setChainOutputs}
			companyProfile={companyProfile}
			executionRequest={plannerExecutionRequest}
			clearExecutionRequest={() => setPlannerExecutionRequest(null)}
          />
        );

      case "profile-agent":
        return (
          <CompanyProfileAgentWorkspace
            messages={profileMessages}
            setMessages={setProfileMessages}
            chainOutputs={chainOutputs}
            setChainOutputs={setChainOutputs}
            companyProfile={companyProfile}
          />
        );

      case "agent-chain":
        return (
          <div className="space-y-4">
            {chainNotice ? (
              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
                {chainNotice}
              </div>
            ) : null}

            <AgentChainWorkspace
              input={chainInput}
			  setInput={setChainInput}
			  result={chainResult}
			  setResult={setChainResult}
			  loading={chainLoading}
			  setLoading={setChainLoading}
			  companyProfile={companyProfile}
			  chainOutputs={chainOutputs}
			  setChainOutputs={setChainOutputs}
			  onExecute={({ prompt, methodology }) => {
				setPlannerExecutionRequest({
				  id: crypto.randomUUID(),
				  prompt,
				  methodology,
				});
				setActiveWorkspace("planner");
			  }}
			  onSave={() => {
				console.log("Save for later clicked");
			  }}
			  onReject={() => {
				console.log("Reject clicked");
			  }}
			/>
          </div>
        );

      case "governance":
        return (
          <DataGovernanceWorkspace
            settings={governance}
            onChange={setGovernance}
          />
        );

      case "configuration":
        return (
          <ConfigurationWorkspace config={config} onChange={setConfig} />
        );

      default:
        return null;
    }
  };

  const focusContent = selectedSignal ? (
    <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
          Signal Detail
        </div>
        <h3 className="mt-3 text-2xl font-semibold text-white">
          {selectedSignal.headline}
        </h3>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-300">
            {selectedSignal.source}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-300">
            {selectedSignal.region}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-300">
            {selectedSignal.cluster_tag}
          </span>
        </div>

        <p className="mt-5 text-base leading-8 text-slate-300">
          {selectedSignal.summary}
        </p>
      </div>

      <div className="space-y-4">
        <div className="rounded-3xl border border-cyan-400/20 bg-cyan-500/10 p-5">
          <div className="text-sm font-medium text-cyan-200">
            Analyst View
          </div>
          <p className="mt-3 text-sm leading-7 text-slate-200">
            This signal matters because it reinforces broader cluster
            momentum around {selectedSignal.cluster_tag}. The likely
            implication is heightened executive need for timing-sensitive
            visibility and targeted response planning.
          </p>
        </div>

        <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-5">
          <div className="text-sm font-medium text-emerald-200">
            Advisor View
          </div>
          <p className="mt-3 text-sm leading-7 text-slate-200">
            Recommended response: assess exposure, identify direct
            commercial risk or upside, and convert this signal into either
            a mitigation plan or an opportunity capture action.
          </p>
        </div>
      </div>
    </div>
  ) : (
    buildPanelContent({
      title: focusTitle,
      summary: dashboardSummary,
      signals,
      companyProfile,
    })
  );

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(6,182,212,0.12),_transparent_30%),radial-gradient(circle_at_right,_rgba(16,185,129,0.10),_transparent_25%),linear-gradient(180deg,_#020617_0%,_#020617_100%)] text-white">
      <div className="mx-auto max-w-[1900px] px-4 py-4 md:px-6 lg:px-8 lg:py-6">
        {lastUpdated ? (
          <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-slate-400">
           Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <WorkspaceNavigation
            active={activeWorkspace}
            onChange={setActiveWorkspace}
          />

          <section className="min-w-0">{renderWorkspace()}</section>
        </div>
      </div>

      <FocusModePanelShell
        open={focusOpen}
        title={focusTitle}
        breadcrumb={focusBreadcrumb}
        onClose={() => setFocusOpen(false)}
      >
        {focusContent}
      </FocusModePanelShell>
    </main>
  );
}

function PanelPill({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "risk" | "opportunity";
}) {
  const toneMap = {
    neutral: "border-white/10 bg-white/5 text-slate-300",
    risk: "border-amber-400/20 bg-amber-500/10 text-amber-200",
    opportunity: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
  };

  return (
    <span className={`rounded-full border px-3 py-1 text-xs ${toneMap[tone]}`}>
      {label}: {value}
    </span>
  );
}

function PanelMetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
        {label}
      </div>
      <div className="mt-3 text-3xl font-semibold text-white">
        {value}
      </div>
    </div>
  );
}