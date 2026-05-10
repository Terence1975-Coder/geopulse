"use client";

import DashboardPanel from "../components/DashboardPanel";
import SignalFeedCard from "../components/SignalFeedCard";
import ProfileCompletenessCard from "../components/ProfileCompletenessCard";
import {
  DashboardSummary,
  SignalItem,
  OpportunityItem,
  CompanyProfile,
} from "../types/geopulse";

interface Props {
  summary: DashboardSummary;
  signals: SignalItem[];
  opportunities: OpportunityItem[];
  profile: CompanyProfile;
  onExpandPanel: (title: string) => void;
  onNavigate: (target: any) => void;
}

export default function ExecutiveDashboardView({
  summary,
  signals,
  opportunities,
  profile,
  onExpandPanel,
  onNavigate,
}: Props) {
  const topOpportunities = opportunities.slice(0, 2);
  const topRiskSignals = signals.filter((s) => s.kind === "risk").slice(0, 2);

  return (
    <div className="relative space-y-5">
      <section className="overflow-hidden rounded-[2rem] border border-slate-700 bg-gradient-to-br from-slate-950 via-[#020617] to-slate-900 shadow-[0_22px_52px_rgba(0,0,0,0.34)]">
        <div className="px-6 py-7 md:px-8 md:py-8 xl:px-10 xl:py-9">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.45fr)_minmax(380px,0.95fr)] xl:items-start">
            <div className="min-w-0">
              <div className="text-[11px] font-medium uppercase tracking-[0.38em] text-cyan-300">
                GeoPulse Command Surface
              </div>

              <h1 className="mt-4 max-w-5xl text-4xl font-semibold leading-[1.02] text-white md:text-5xl xl:text-6xl">
                Executive Intelligence
                <br />
                Dashboard
              </h1>

              <p className="mt-5 max-w-4xl text-base leading-8 text-slate-200 md:text-lg">
                A boardroom-grade overview of current risk posture, opportunity
                windows, agent interpretations, live signal flow, and
                company-aware intelligence calibration.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <ActionButton onClick={() => onNavigate("agent-chain")}>
                  Open Agent Chain
                </ActionButton>

                <ActionButton onClick={() => onNavigate("planner")}>
                  Open Planner
                </ActionButton>

                <ActionButton onClick={() => onNavigate("signals")}>
                  Open Live Signals
                </ActionButton>

                <ActionButton onClick={() => onNavigate("company")}>
                  Open Company Intelligence
                </ActionButton>
              </div>
            </div>

            <div className="min-w-0 rounded-[2rem] border border-slate-600 bg-[linear-gradient(180deg,rgba(71,85,105,0.95)_0%,rgba(55,65,81,0.95)_100%)] p-5 shadow-[0_18px_36px_rgba(0,0,0,0.30)]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="text-xs uppercase tracking-[0.22em] text-slate-100">
                  Executive Metrics
                </div>

                <div className="rounded-full border border-slate-500 bg-slate-800 px-3 py-1 text-[11px] text-white">
                  Horizon {summary.horizon}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <StatCard
                  label="Risk"
                  value={summary.overall_risk_score}
                  tone="risk"
                />
                <StatCard
                  label="Opportunity"
                  value={summary.opportunity_score}
                  tone="opportunity"
                />
                <StatCard
                  label="Live Signals"
                  value={summary.live_signal_count}
                  tone="signals"
                />
                <StatCard
                  label="Confidence"
                  value={summary.confidence}
                  tone="confidence"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <DashboardPanel
          title="Risk Posture"
          accent="neutral"
          onExpand={() => onExpandPanel("Risk Posture")}
        >
          <div className="space-y-4">
            <div className="text-3xl font-semibold text-slate-900">
              {summary.posture}
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge tone="risk-soft">Urgency: {summary.urgency}</Badge>
              <Badge tone="neutral">Horizon: {summary.horizon}</Badge>
              <Badge tone="neutral">Confidence: {summary.confidence}%</Badge>
            </div>

            {topRiskSignals.length > 0 ? (
              <ul className="space-y-3 text-sm leading-8 text-slate-700">
                {topRiskSignals.map((signal) => (
                  <li key={signal.id}>— {signal.headline}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm leading-8 text-slate-700">
                GeoPulse has identified the current risk posture as the leading
                executive condition requiring attention across your operating
                environment.
              </p>
            )}

            <div className="flex flex-wrap gap-3 pt-1">
              <ActionButton onClick={() => onExpandPanel("Risk Analysis")}>
                Why this score
              </ActionButton>

              <ActionButton onClick={() => onNavigate("signals")}>
                View supporting signals
              </ActionButton>
            </div>
          </div>
        </DashboardPanel>

        <DashboardPanel
          title="Opportunity Posture"
          accent="neutral"
          onExpand={() => onExpandPanel("Opportunity Posture")}
        >
          <div className="space-y-4">
            <div className="text-3xl font-semibold text-slate-900">
              {summary.opportunity_posture}
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge tone="opportunity-soft">
                Positive signals: {summary.positive_signal_count}
              </Badge>
              <Badge tone="neutral">
                Opportunity score: {summary.opportunity_score}
              </Badge>
            </div>

            <p className="text-sm leading-8 text-slate-700">
              Current opportunity conditions reflect the most actionable windows
              emerging from resilience, timing, and cross-signal alignment.
            </p>
          </div>
        </DashboardPanel>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <SurfaceCard title="Executive Summary">
          <p className="text-lg leading-8 text-slate-300">{summary.summary}</p>
        </SurfaceCard>

        <SurfaceCard title="Agent Snapshots">
          <div className="space-y-4">
            <SnapshotBlock
              title="Analyst"
              text={summary.agent_snapshots?.analyst}
            />
            <SnapshotBlock
              title="Advisor"
              text={summary.agent_snapshots?.advisor}
            />
            <SnapshotBlock
              title="Profile Agent"
              text={summary.agent_snapshots?.profile_agent}
            />
          </div>
        </SurfaceCard>
      </section>

      <section className="space-y-4">
        <ProfileCompletenessCard profile={profile} />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xl font-semibold text-white">
              Live Intelligence Summary
            </div>
            <div className="mt-1 text-sm text-slate-400">
              The most relevant active signals shaping current executive posture.
            </div>
          </div>

          <ActionButton onClick={() => onNavigate("signals")}>
            Open Workspace
          </ActionButton>
        </div>

        <div className="space-y-4">
          {signals.slice(0, 3).map((s) => (
            <SignalFeedCard key={s.id} signal={s} />
          ))}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <SurfaceCard title="Command Summary">
          <div className="mt-4 grid gap-3">
            <MiniMetric
              label="Risk Posture"
              value={summary.posture}
              tone="risk"
            />
            <MiniMetric
              label="Opportunity Posture"
              value={summary.opportunity_posture}
              tone="opportunity"
            />
            <MiniMetric
              label="Live Signals"
              value={String(summary.live_signal_count)}
              tone="signals"
            />
            <MiniMetric
              label="Confidence"
              value={`${summary.confidence}%`}
              tone="confidence"
            />
          </div>
        </SurfaceCard>

        <SurfaceCard title="Opportunity Preview">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-400">
              High-level preview of current positive windows.
            </div>

            <ActionButton onClick={() => onNavigate("opportunities")}>
              Open Opportunities
            </ActionButton>
          </div>

          {topOpportunities.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-slate-600 bg-slate-800/40 p-5 text-sm text-slate-400">
              No opportunity preview items available yet.
            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {topOpportunities.map((opportunity, index) => (
                <div
                  key={`${opportunity.title ?? "opportunity"}-${index}`}
                  className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-4 shadow-[0_8px_18px_rgba(0,0,0,0.18)]"
                >
                  <div className="text-xs uppercase tracking-[0.18em] text-emerald-200/80">
                    Opportunity
                  </div>
                  <div className="mt-2 text-lg font-semibold text-white">
                    {opportunity.title ?? "Untitled opportunity"}
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-200">
                    {opportunity.summary ??
                      "No summary available for this opportunity yet."}
                  </p>
                </div>
              ))}
            </div>
          )}
        </SurfaceCard>
      </section>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl border border-slate-600 bg-[linear-gradient(180deg,#1f2937_0%,#172033_45%,#0f172a_100%)] px-4 py-2.5 text-sm font-medium text-white shadow-[0_8px_14px_rgba(0,0,0,0.26),inset_0_1px_0_rgba(255,255,255,0.05),inset_0_-1px_0_rgba(0,0,0,0.35)] transition hover:-translate-y-[1px] hover:bg-[linear-gradient(180deg,#273449_0%,#1e293b_45%,#111827_100%)]"
    >
      {children}
    </button>
  );
}

function SurfaceCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-5 shadow-[0_12px_24px_rgba(0,0,0,0.22)]">
      <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
        {title}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "risk" | "opportunity" | "signals" | "confidence";
}) {
  const toneMap = {
    risk:
      "border-red-300/35 bg-[linear-gradient(180deg,rgba(127,29,29,0.34)_0%,rgba(69,10,10,0.24)_100%)]",
    opportunity:
      "border-emerald-300/35 bg-[linear-gradient(180deg,rgba(6,95,70,0.34)_0%,rgba(2,44,34,0.24)_100%)]",
    signals:
      "border-cyan-300/35 bg-[linear-gradient(180deg,rgba(8,145,178,0.32)_0%,rgba(22,78,99,0.24)_100%)]",
    confidence:
      "border-indigo-300/35 bg-[linear-gradient(180deg,rgba(67,56,202,0.32)_0%,rgba(49,46,129,0.24)_100%)]",
  };

  return (
    <div
      className={`flex min-h-[116px] flex-col justify-between rounded-[2rem] border px-4 py-4 text-center shadow-[0_10px_26px_rgba(0,0,0,0.18)] ${toneMap[tone]}`}
    >
      <div className="text-[11px] font-medium uppercase tracking-[0.24em] leading-snug text-white/80">
        {label}
      </div>
      <div className="mt-3 text-5xl font-semibold leading-none text-white">
        {value}
      </div>
    </div>
  );
}

function SnapshotBlock({
  title,
  text,
}: {
  title: string;
  text?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/70 p-4 shadow-[0_8px_18px_rgba(0,0,0,0.18)]">
      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
        {title}
      </div>
      <p className="mt-2 text-sm leading-7 text-slate-300">
        {text ?? "No snapshot available yet."}
      </p>
    </div>
  );
}

function Badge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "risk-soft" | "opportunity-soft" | "neutral";
}) {
  const toneMap = {
    "risk-soft": "border-red-500/20 bg-red-500/10 text-red-200",
    "opportunity-soft":
      "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
    neutral: "border-slate-600 bg-slate-800/70 text-slate-200",
  };

  return (
    <span
      className={`rounded-lg border px-3 py-1 text-xs font-medium ${toneMap[tone]}`}
    >
      {children}
    </span>
  );
}

function MiniMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "risk" | "opportunity" | "signals" | "confidence";
}) {
  const toneMap = {
    risk: "border-red-500/20 bg-red-500/10",
    opportunity: "border-emerald-400/20 bg-emerald-500/10",
    signals: "border-cyan-400/20 bg-cyan-500/10",
    confidence: "border-indigo-400/20 bg-indigo-500/10",
  };

  return (
    <div
      className={`flex items-center justify-between rounded-xl border p-4 shadow-[0_8px_18px_rgba(0,0,0,0.16)] ${toneMap[tone]}`}
    >
      <div className="text-sm text-slate-300">{label}</div>
      <div className="text-sm font-semibold text-white">{value}</div>
    </div>
  );
}