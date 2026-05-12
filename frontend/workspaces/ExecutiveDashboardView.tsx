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
    <div className="relative space-y-6">
      <section className="overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br from-slate-950 via-[#020617] to-slate-900 shadow-[0_0_60px_rgba(0,0,0,0.6)]">
        <div className="px-6 py-7 md:px-8 md:py-8 xl:px-10 xl:py-9">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.95fr)] xl:items-start">
            <div className="min-w-0">
              <div className="text-[11px] font-medium uppercase tracking-[0.38em] text-cyan-300">
                GeoPulse Command Surface
              </div>

              <h1 className="mt-4 max-w-5xl text-4xl font-semibold leading-[1.05] text-white md:text-5xl xl:text-6xl">
                Executive Intelligence Dashboard
              </h1>

              <p className="mt-5 max-w-4xl text-base leading-8 text-slate-300 md:text-lg">
                A boardroom-grade overview of current risk posture, opportunity
                windows, agent interpretations, live signal flow, and
                company-aware intelligence calibration.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => onNavigate("agent-chain")}
                  className="rounded-lg border border-slate-600 bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-[0_10px_22px_rgba(0,0,0,0.25)] transition hover:-translate-y-[1px] hover:bg-slate-800"
                >
                  Open Agent Chain
                </button>

                <button
                  onClick={() => onNavigate("planner")}
                  className="rounded-lg border border-slate-600 bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-[0_10px_22px_rgba(0,0,0,0.25)] transition hover:-translate-y-[1px] hover:bg-slate-800"
                >
                  Open Planner
                </button>

                <button
                  onClick={() => onNavigate("signals")}
                  className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-4 py-2.5 text-sm font-medium text-cyan-100 shadow-[0_10px_22px_rgba(0,0,0,0.24)] transition hover:-translate-y-[1px] hover:bg-cyan-500/20"
                >
                  Open Live Signals
                </button>

                <button
                  onClick={() => onNavigate("company")}
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-100 shadow-[0_10px_22px_rgba(0,0,0,0.22)] transition hover:-translate-y-[1px] hover:bg-white/10"
                >
                  Open Company Intelligence
                </button>
              </div>
            </div>

            <div className="min-w-0">
              <div className="rounded-lg border border-white/10 bg-slate-800/90 p-5 shadow-[0_18px_42px_rgba(0,0,0,0.28)]">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-white">
                    Executive Metrics
                  </div>
                  <div className="rounded-full border border-slate-500 bg-slate-950 px-3 py-1 text-[11px] font-medium text-white">
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
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <DashboardPanel
          title="Risk Posture"
          onExpand={() => onExpandPanel("Risk Posture")}
        >
          <div className="space-y-5">
            <div className="rounded-md border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
              <div className="text-3xl font-semibold text-slate-950">
                {summary.posture}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Badge tone="risk-soft">Urgency: {summary.urgency}</Badge>
                <Badge tone="neutral">Horizon: {summary.horizon}</Badge>
                <Badge tone="neutral">Confidence: {summary.confidence}%</Badge>
              </div>
            </div>

            {topRiskSignals.length > 0 ? (
              <ul className="space-y-3 text-sm leading-7 text-slate-700">
                {topRiskSignals.map((signal) => (
                  <li
                    key={signal.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800"
                  >
                    — {signal.headline}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700">
                GeoPulse has identified the current risk posture as the leading
                executive condition requiring attention across your operating
                environment.
              </p>
            )}

            <div className="flex flex-wrap gap-3 pt-1">
              <button
                onClick={() => onExpandPanel("Risk Analysis")}
                className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-medium text-white shadow-[0_10px_22px_rgba(15,23,42,0.25)] transition hover:-translate-y-[1px] hover:bg-slate-800"
              >
                Why this score
              </button>

              <button
                onClick={() => onNavigate("signals")}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-[0_8px_18px_rgba(15,23,42,0.12)] transition hover:-translate-y-[1px] hover:bg-slate-50"
              >
                View supporting signals
              </button>
            </div>
          </div>
        </DashboardPanel>

        <DashboardPanel
          title="Opportunity Posture"
          onExpand={() => onExpandPanel("Opportunity Posture")}
        >
          <div className="space-y-5">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
              <div className="text-3xl font-semibold text-slate-950">
                {summary.opportunity_posture}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Badge tone="opportunity-soft">
                  Positive signals: {summary.positive_signal_count}
                </Badge>
                <Badge tone="neutral">
                  Opportunity score: {summary.opportunity_score}
                </Badge>
              </div>
            </div>

            <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700">
              Current opportunity conditions reflect the most actionable windows
              emerging from resilience, timing, and cross-signal alignment.
            </p>
          </div>
        </DashboardPanel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-lg border border-slate-300 bg-white p-6 shadow-[0_18px_36px_rgba(15,23,42,0.14)]">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Executive Summary
          </div>
          <p className="mt-4 text-lg leading-8 text-slate-800">
            {summary.summary}
          </p>
        </div>

        <div className="rounded-xl border border-slate-300 bg-white p-6 shadow-[0_18px_36px_rgba(15,23,42,0.14)]">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Agent Snapshots
          </div>

          <div className="mt-4 space-y-4">
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
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xl font-semibold text-slate-950">
                Live Intelligence Summary
              </div>
              <div className="mt-1 text-sm text-slate-600">
                The most relevant active signals shaping current executive
                posture.
              </div>
            </div>

            <button
              onClick={() => onNavigate("signals")}
              className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-medium text-white shadow-[0_10px_22px_rgba(15,23,42,0.25)] transition hover:-translate-y-[1px] hover:bg-slate-800"
            >
              Open Workspace
            </button>
          </div>

          <div className="space-y-4">
            {signals.slice(0, 3).map((s) => (
              <SignalFeedCard key={s.id} signal={s} />
            ))}
          </div>
        </div>

        <ProfileCompletenessCard profile={profile} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-xl border border-slate-300 bg-white p-6 shadow-[0_18px_36px_rgba(15,23,42,0.14)]">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Command Summary
          </div>

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
        </div>

        <div className="rounded-xl border border-slate-300 bg-white p-6 shadow-[0_18px_36px_rgba(15,23,42,0.14)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xl font-semibold text-slate-950">
                Opportunity Preview
              </div>
              <div className="mt-1 text-sm text-slate-600">
                High-level preview of current positive windows.
              </div>
            </div>

            <button
              onClick={() => onNavigate("opportunities")}
              className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-medium text-white shadow-[0_10px_22px_rgba(15,23,42,0.25)] transition hover:-translate-y-[1px] hover:bg-slate-800"
            >
              Open Opportunities
            </button>
          </div>

          {topOpportunities.length === 0 ? (
            <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
              No opportunity preview items available yet.
            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {topOpportunities.map((opportunity, index) => (
                <div
                  key={`${opportunity.title ?? "opportunity"}-${index}`}
                  className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 shadow-[0_10px_24px_rgba(15,23,42,0.08)]"
                >
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    Opportunity
                  </div>
                  <div className="mt-2 text-lg font-semibold leading-7 text-slate-950">
                    {opportunity.title ?? "Untitled opportunity"}
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-700">
                    {opportunity.summary ??
                      "No summary available for this opportunity yet."}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
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
    risk: "border-red-300 bg-red-950/30 text-red-100",
    opportunity: "border-emerald-300 bg-emerald-950/30 text-emerald-100",
    signals: "border-cyan-300 bg-cyan-950/30 text-cyan-100",
    confidence: "border-indigo-300 bg-indigo-950/30 text-indigo-100",
  };

  return (
    <div
      className={`flex min-h-[116px] flex-col justify-between rounded-lg border p-4 text-center shadow-[0_12px_28px_rgba(0,0,0,0.22)] ${toneMap[tone]}`}
    >
      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] leading-snug text-white/90">
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
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        {title}
      </div>
      <p className="mt-2 text-sm leading-7 text-slate-700">
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
    "risk-soft": "border-red-200 bg-red-50 text-red-700",
    "opportunity-soft": "border-emerald-200 bg-emerald-50 text-emerald-700",
    neutral: "border-slate-300 bg-slate-100 text-slate-700",
  };

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-medium ${toneMap[tone]}`}
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
    risk: "border-red-200 bg-red-50",
    opportunity: "border-emerald-200 bg-emerald-50",
    signals: "border-cyan-200 bg-cyan-50",
    confidence: "border-indigo-200 bg-indigo-50",
  };

  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-md border p-4 ${toneMap[tone]}`}
    >
      <div className="text-sm font-medium text-slate-700">{label}</div>
      <div className="text-sm font-semibold text-slate-950">{value}</div>
    </div>
  );
}