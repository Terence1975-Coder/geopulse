"use client";

import type { OpportunityItem, SignalItem } from "../types/geopulse";

type Props = {
  opportunities: OpportunityItem[];
  signals?: SignalItem[];
};

type AnyRecord = Record<string, any>;

function safeArray<T = any>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function safeText(value: unknown, fallback = "Not available."): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toPercent(value: unknown): number {
  const numeric = toNumber(value, 0);
  if (numeric <= 1) return Math.round(numeric * 100);
  return Math.round(numeric);
}

function averagePercent(values: unknown[]): number {
  const numericValues = values
    .map((value) => toNumber(value, 0))
    .filter((value) => Number.isFinite(value));

  if (numericValues.length === 0) return 0;

  const average =
    numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length;

  return toPercent(average);
}

function normaliseOpportunityScore(opportunity: OpportunityItem): number {
  const record = opportunity as AnyRecord;

  return toPercent(
    record.score ??
      record.business_impact_score ??
      record.business_relevance_score ??
      record.confidence ??
      0
  );
}

function normaliseOpportunityConfidence(opportunity: OpportunityItem): number {
  const record = opportunity as AnyRecord;

  return toPercent(record.confidence ?? record.confidence_score ?? 0);
}

function scoreTone(score: number): string {
  if (score >= 75) {
    return "border-emerald-300 bg-emerald-50 text-emerald-800";
  }

  if (score >= 55) {
    return "border-cyan-300 bg-cyan-50 text-cyan-800";
  }

  if (score >= 35) {
    return "border-amber-300 bg-amber-50 text-amber-800";
  }

  return "border-slate-300 bg-slate-50 text-slate-700";
}

function basisLabel(value: unknown): string {
  const raw = safeText(value, "opportunity_signal");

  return raw
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            {label}
          </div>
          {helper ? (
            <div className="mt-1 text-xs text-slate-500">{helper}</div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-2xl font-semibold text-slate-950">
          {value}
        </div>
      </div>
    </div>
  );
}

function EmptyReadout() {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
        Executive Opportunity Readout
      </div>

      <h3 className="mt-4 text-2xl font-semibold text-slate-950">
        No live opportunity conditions detected yet.
      </h3>

      <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-600">
        GeoPulse has not yet identified enough upside-oriented signal movement to
        form a strong commercial opportunity posture. Continue monitoring for
        demand, timing, resilience, procurement, funding, policy, and
        competitor-shift indicators.
      </p>
    </div>
  );
}

function OpportunityCard({
  opportunity,
  index,
}: {
  opportunity: OpportunityItem;
  index: number;
}) {
  const record = opportunity as AnyRecord;
  const score = normaliseOpportunityScore(opportunity);
  const confidence = normaliseOpportunityConfidence(opportunity);
  const actions = safeArray<string>(record.actions);
  const regions = safeArray<string>(record.regions);

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_42px_rgba(15,23,42,0.10)]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
              Opportunity {index + 1}
            </span>

            <span className="rounded-full border border-cyan-300 bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-800">
              {safeText(record.category, "Strategic Opportunity")}
            </span>

            {record.opportunity_basis ? (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                {basisLabel(record.opportunity_basis)}
              </span>
            ) : null}
          </div>

          <h3 className="mt-4 text-xl font-semibold leading-snug text-slate-950">
            {safeText(record.title, "Untitled opportunity")}
          </h3>

          <p className="mt-3 text-sm leading-7 text-slate-600">
            {safeText(record.summary, "No opportunity summary available yet.")}
          </p>
        </div>

        <div className="grid min-w-[230px] grid-cols-2 gap-3">
          <div className={`rounded-2xl border px-4 py-3 ${scoreTone(score)}`}>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-80">
              Score
            </div>
            <div className="mt-1 text-2xl font-semibold">{score}</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Confidence
            </div>
            <div className="mt-1 text-2xl font-semibold">{confidence}%</div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Timing Window
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-950">
            {safeText(record.timing_window, "Near-term")}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Region
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-950">
            {regions.length > 0 ? regions.join(", ") : "Global"}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Source Signal
          </div>
          <div className="mt-1 truncate text-sm font-semibold text-slate-950">
            {safeText(record.source_signal_id, "Not linked")}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-800">
          Recommended Commercial Actions
        </div>

        {actions.length === 0 ? (
          <p className="mt-3 text-sm leading-7 text-emerald-900">
            Validate commercial relevance, test buyer appetite, and track
            follow-on signals before scaling.
          </p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm leading-6 text-emerald-950">
            {actions.map((action, actionIndex) => (
              <li key={`${action}-${actionIndex}`} className="flex gap-2">
                <span className="mt-0.5 text-emerald-600">•</span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

export default function OpportunityWorkspace({
  opportunities,
  signals = [],
}: Props) {
  const safeOpportunities = Array.isArray(opportunities) ? opportunities : [];
  const safeSignals = Array.isArray(signals) ? signals : [];

  const opportunitySignals = safeSignals.filter(
    (signal) => String((signal as AnyRecord).kind || "").toLowerCase() === "opportunity"
  );

  const freshOpportunitySignals = opportunitySignals.filter((signal) => {
    const lifecycle = String((signal as AnyRecord).lifecycle || "").toLowerCase();
    const freshness = toNumber((signal as AnyRecord).freshness_minutes, 999999);

    return lifecycle === "fresh" || freshness <= 180;
  });

  const averageConfidence = averagePercent(
    safeOpportunities.map((opportunity) => (opportunity as AnyRecord).confidence)
  );

  const strongestScore =
    safeOpportunities.length > 0
      ? Math.max(...safeOpportunities.map(normaliseOpportunityScore))
      : 0;

  const topOpportunity = safeOpportunities[0] as AnyRecord | undefined;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-[#020617] to-slate-900 shadow-[0_0_60px_rgba(0,0,0,0.45)]">
        <div className="px-6 py-7 md:px-8 md:py-8 xl:px-10">
          <div className="grid gap-7 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)] xl:items-center">
            <div className="min-w-0">
              <div className="text-[11px] font-medium uppercase tracking-[0.38em] text-emerald-300">
                Opportunity Intelligence
              </div>

              <h2 className="mt-4 text-4xl font-semibold leading-tight text-white md:text-5xl">
                Strategic Opportunity Workspace
              </h2>

              <p className="mt-4 max-w-4xl text-base leading-8 text-slate-400">
                Surfaces positive market movement, resilience-led growth
                windows, timing-sensitive openings, and commercial actions
                backed by live signal evidence.
              </p>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                Current Opportunity Posture
              </div>

              <div className="mt-4 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-4">
                <div className="text-sm font-semibold text-emerald-100">
                  {safeOpportunities.length > 0
                    ? "Opportunity signals active"
                    : "No strong opportunity posture yet"}
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {safeOpportunities.length > 0
                    ? "GeoPulse has identified commercially actionable upside windows from the current signal set."
                    : "GeoPulse is waiting for stronger demand, timing, procurement, policy, or resilience-led upside signals."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Opportunity Signals"
          value={String(safeOpportunities.length)}
          helper="Live opportunity items"
        />

        <MetricCard
          label="Fresh Opportunity Signals"
          value={String(freshOpportunitySignals.length)}
          helper="Fresh or near-term"
        />

        <MetricCard
          label="Avg Confidence"
          value={`${averageConfidence}%`}
          helper="Across opportunities"
        />

        <MetricCard
          label="Strongest Signal"
          value={`${strongestScore}%`}
          helper="Highest opportunity score"
        />
      </section>

      {safeOpportunities.length === 0 ? (
        <EmptyReadout />
      ) : (
        <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-800">
            Executive Opportunity Readout
          </div>

          <h3 className="mt-4 text-2xl font-semibold text-slate-950">
            {safeText(topOpportunity?.title, "Opportunity conditions detected")}
          </h3>

          <p className="mt-4 max-w-5xl text-sm leading-7 text-slate-700">
            {safeText(
              topOpportunity?.summary,
              "GeoPulse has identified an opportunity window that may support commercial testing, offer refinement, or target-account activation."
            )}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full border border-emerald-300 bg-white px-3 py-1 text-xs font-medium text-emerald-800">
              Score {normaliseOpportunityScore(topOpportunity as OpportunityItem)}
            </span>
            <span className="rounded-full border border-cyan-300 bg-white px-3 py-1 text-xs font-medium text-cyan-800">
              Confidence{" "}
              {normaliseOpportunityConfidence(topOpportunity as OpportunityItem)}%
            </span>
            <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700">
              {safeText(topOpportunity?.category, "Strategic Opportunity")}
            </span>
          </div>
        </section>
      )}

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
          <div className="text-xl font-semibold text-slate-950">
            Opportunity Logic
          </div>

          <div className="mt-5 space-y-3 text-sm leading-7 text-slate-600">
            <p>
              GeoPulse is prioritising signals with resilience, timing,
              demand-led upside, procurement relevance, policy momentum, or
              commercial conversion potential.
            </p>
            <p>
              Opportunity clusters strengthen when confidence, relevance, and
              repeatable action potential align across multiple live signals.
            </p>
            <p>
              Risk-to-opportunity conversion is active, so disruption signals can
              become commercial advisory, resilience, margin-protection, or
              implementation opportunities.
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
          <div className="text-xl font-semibold text-slate-950">
            Recommended Commercial Posture
          </div>

          <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-600">
            <li className="flex gap-2">
              <span className="text-emerald-600">•</span>
              <span>
                Act early where confidence is strengthening and demand is visible.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">•</span>
              <span>
                Convert signal movement into fast commercial tests and narrow
                offer packaging.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">•</span>
              <span>
                Avoid scaling until buyer pain, urgency, and delivery readiness
                are confirmed.
              </span>
            </li>
          </ul>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        {safeOpportunities.map((opportunity, index) => (
          <OpportunityCard
            key={`${(opportunity as AnyRecord).id ?? "opportunity"}-${index}`}
            opportunity={opportunity}
            index={index}
          />
        ))}
      </section>
    </div>
  );
}