"use client";

import type { DemoScenario } from "../../lib/demo/geopulse-demo-scenario";

type Props = {
  scenario: DemoScenario;
  onOpenAgentChain: () => void;
};

export default function DemoExecutiveDashboardView({
  scenario,
  onOpenAgentChain,
}: Props) {
  const riskSignals = scenario.signals.filter((signal) => signal.kind === "risk");
  const opportunitySignals = scenario.signals.filter(
    (signal) => signal.kind === "opportunity"
  );

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[34px] border border-white/10 bg-gradient-to-br from-slate-950 via-[#071224] to-slate-950 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <div className="grid gap-6 px-6 py-7 md:px-8 xl:grid-cols-[1.2fr_0.8fr] xl:items-center">
          <div>
            <div className="text-[11px] uppercase tracking-[0.32em] text-cyan-300/75">
              Executive Dashboard
            </div>

            <h2 className="mt-3 text-4xl font-semibold leading-tight text-white md:text-5xl">
              {scenario.company.name}
            </h2>

            <p className="mt-4 text-sm leading-8 text-slate-300 md:text-base">
              {scenario.company.sector} • Markets:{" "}
              {scenario.company.markets.join(", ")}
            </p>

            <p className="mt-6 max-w-4xl text-base leading-8 text-slate-200">
              {scenario.summary.executiveSummary}
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {scenario.company.strategicPriorities.map((priority, index) => (
                <span
                  key={`${priority}-${index}`}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300"
                >
                  {priority}
                </span>
              ))}
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={onOpenAgentChain}
                className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-5 py-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/20"
              >
                Open Agent Chain
              </button>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Executive Metrics
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <MetricCard
                label="Risk"
                value={String(scenario.summary.overallRiskScore)}
                tone="risk"
              />
              <MetricCard
                label="Opportunity"
                value={String(scenario.summary.opportunityScore)}
                tone="opportunity"
              />
              <MetricCard
                label="Confidence"
                value={`${scenario.summary.confidence}%`}
                tone="signals"
              />
              <MetricCard
                label="Urgency"
                value={scenario.summary.urgency}
                tone="confidence"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <SurfaceCard title="Risk Posture">
          <div className="text-2xl font-semibold text-white">
            {scenario.summary.posture}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Pill tone="risk">Risk signals: {riskSignals.length}</Pill>
            <Pill>Horizon: {scenario.summary.horizon}</Pill>
          </div>

          <div className="mt-5 space-y-3">
            {riskSignals.map((signal) => (
              <SignalRow key={signal.id} signal={signal} />
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard title="Opportunity Posture">
          <div className="text-2xl font-semibold text-white">
            {scenario.summary.opportunityPosture}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Pill tone="opportunity">
              Positive signals: {opportunitySignals.length}
            </Pill>
            <Pill>Confidence: {scenario.summary.confidence}%</Pill>
          </div>

          <div className="mt-5 space-y-3">
            {opportunitySignals.map((signal) => (
              <SignalRow key={signal.id} signal={signal} />
            ))}
          </div>
        </SurfaceCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SurfaceCard title="Executive Summary">
          <p className="text-base leading-8 text-slate-200">
            {scenario.summary.executiveSummary}
          </p>
        </SurfaceCard>

        <SurfaceCard title="Calibration Snapshot">
          <div className="space-y-4">
            <MiniMetric
              label="Risk Tolerance"
              value={scenario.company.riskTolerance}
            />
            <MiniMetric
              label="Recommendation Style"
              value={scenario.company.recommendationStyle}
            />
            <MiniMetric
              label="Priority Count"
              value={String(scenario.company.strategicPriorities.length)}
            />
          </div>
        </SurfaceCard>
      </section>
    </div>
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
    <section className="rounded-[30px] border border-white/10 bg-white/[0.04] p-6">
      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
        {title}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "risk" | "opportunity" | "signals" | "confidence";
}) {
  const toneMap = {
    risk: "border-red-500/25 bg-red-500/10 text-red-300",
    opportunity: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
    signals: "border-cyan-400/25 bg-cyan-400/10 text-cyan-300",
    confidence: "border-indigo-400/25 bg-indigo-400/10 text-indigo-300",
  };

  return (
    <div
      className={`flex min-h-[110px] flex-col justify-between rounded-[24px] border p-4 ${toneMap[tone]}`}
    >
      <div className="text-[11px] uppercase tracking-[0.22em] opacity-80">
        {label}
      </div>
      <div className="mt-3 text-3xl font-semibold leading-none text-white">
        {value}
      </div>
    </div>
  );
}

function Pill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "risk" | "opportunity";
}) {
  const toneMap = {
    neutral: "border-white/10 bg-white/5 text-slate-300",
    risk: "border-amber-400/20 bg-amber-500/10 text-amber-200",
    opportunity: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
  };

  return (
    <span className={`rounded-full border px-3 py-1 text-xs ${toneMap[tone]}`}>
      {children}
    </span>
  );
}

function SignalRow({
  signal,
}: {
  signal: {
    headline: string;
    summary: string;
    source: string;
    relativeTime: string;
    lifecycle: string;
  };
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300">
          {signal.source}
        </span>
        <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 text-[11px] text-cyan-200">
          {signal.relativeTime}
        </span>
        <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-200">
          {signal.lifecycle}
        </span>
      </div>

      <div className="mt-3 text-sm font-semibold text-white">
        {signal.headline}
      </div>

      <p className="mt-2 text-sm leading-7 text-slate-300">{signal.summary}</p>
    </div>
  );
}

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/35 p-4">
      <div className="text-sm text-slate-300">{label}</div>
      <div className="text-sm font-semibold text-white">{value}</div>
    </div>
  );
}