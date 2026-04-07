"use client";

type SignalLike = {
  id?: string | number;
  headline?: string;
  summary?: string;
  source?: string;
  source_type?: string;
  region?: string;
  cluster_tag?: string;
  kind?: string;
  confidence?: number;
  confidence_score?: number;
  signal_strength?: number;
  freshness_label?: string;
  lifecycle?: string;
  relative_time?: string;
  updated_at?: string;
  detected_at?: string;
  timestamp?: string;
};

type OpportunityItem = {
  title?: string;
  summary?: string;
  score?: number;
  horizon?: string;
};

interface Props {
  opportunities?: OpportunityItem[];
  signals?: SignalLike[];
}

function toPercent(value?: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return value > 1 ? Math.round(value) : Math.round(value * 100);
}

function resolveConfidence(signal: SignalLike): number {
  if (typeof signal.confidence === "number") return toPercent(signal.confidence);
  if (typeof signal.confidence_score === "number") {
    return toPercent(signal.confidence_score);
  }
  return 0;
}

function resolveStrength(signal: SignalLike): number {
  if (typeof signal.signal_strength === "number") {
    return toPercent(signal.signal_strength);
  }
  return resolveConfidence(signal);
}

function resolveFreshness(signal: SignalLike): string {
  if (
    typeof signal.freshness_label === "string" &&
    signal.freshness_label.trim()
  ) {
    return signal.freshness_label;
  }

  if (typeof signal.relative_time === "string" && signal.relative_time.trim()) {
    return signal.relative_time;
  }

  if (typeof signal.lifecycle === "string" && signal.lifecycle.trim()) {
    return signal.lifecycle;
  }

  return (
    signal.updated_at ||
    signal.detected_at ||
    signal.timestamp ||
    "Unknown"
  );
}

function isOpportunitySignal(signal: SignalLike) {
  const text = `${signal.headline || ""} ${signal.summary || ""}`.toLowerCase();
  const cluster = `${signal.cluster_tag || ""}`.toLowerCase();

  return (
    signal.kind === "opportunity" ||
    text.includes("opportunity") ||
    text.includes("growth") ||
    text.includes("expansion") ||
    text.includes("upside") ||
    text.includes("demand") ||
    text.includes("resilience") ||
    text.includes("investment") ||
    text.includes("opening") ||
    text.includes("partnership") ||
    cluster.includes("opportunity") ||
    cluster.includes("timing") ||
    cluster.includes("resilience")
  );
}

function deriveOpportunityReadout(opportunitySignals: SignalLike[]): {
  headline: string;
  body: string;
} {
  if (opportunitySignals.length === 0) {
    return {
      headline: "No live opportunity conditions detected yet.",
      body: "GeoPulse has not yet identified enough upside-oriented signal movement to form a strong commercial opportunity posture. Continue monitoring for demand, timing, resilience, and competitor-shift indicators.",
    };
  }

  if (opportunitySignals.length >= 3) {
    return {
      headline: "Live upside conditions are strengthening across signal flow.",
      body: "GeoPulse is seeing repeated positive movement across resilience demand, timing-sensitive openings, and commercially actionable market shifts. The strongest upside sits where signal repetition, confidence, and execution speed align.",
    };
  }

  return {
    headline: "Live opportunity conditions detected across signal flow.",
    body: "GeoPulse is detecting opportunity conditions derived from live signal momentum. Upside is strongest where demand signals are persistent, confidence is rising, and timing windows remain open.",
  };
}

export default function OpportunityWorkspace({
  opportunities = [],
  signals = [],
}: Props) {
  const opportunitySignals = signals.filter(isOpportunitySignal);

  const freshOpportunitySignals = opportunitySignals.filter((signal) => {
    const freshness = resolveFreshness(signal).toLowerCase();
    return (
      freshness.includes("fresh") ||
      freshness.includes("mins ago") ||
      freshness.includes("h ago") ||
      freshness.includes("hrs ago") ||
      Boolean(signal.updated_at || signal.detected_at || signal.timestamp)
    );
  });

  const avgConfidence = opportunitySignals.length
    ? Math.round(
        opportunitySignals.reduce(
          (sum, signal) => sum + resolveConfidence(signal),
          0
        ) / opportunitySignals.length
      )
    : 0;

  const strongestSignal = opportunitySignals.length
    ? Math.max(...opportunitySignals.map((signal) => resolveStrength(signal)))
    : 0;

  const topSignals = [...opportunitySignals]
    .sort((a, b) => resolveStrength(b) - resolveStrength(a))
    .slice(0, 4);

  const readout = deriveOpportunityReadout(opportunitySignals);

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <div className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
          Opportunity Intelligence
        </div>
        <h2 className="mt-3 text-2xl font-semibold text-white">
          Strategic Opportunity Workspace
        </h2>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300">
          This workspace surfaces positive market movement, resilience-led growth
          windows, timing-sensitive openings, and supporting live signals that
          GeoPulse is detecting.
        </p>
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-6">
          <div className="text-xs uppercase tracking-[0.2em] text-emerald-200/80">
            Executive Opportunity Readout
          </div>

          <h3 className="mt-4 text-2xl font-semibold leading-tight text-white">
            {readout.headline}
          </h3>

          <p className="mt-5 text-base leading-8 text-slate-200">
            {readout.body}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <MetricCard
            label="Opportunity Signals"
            value={String(opportunitySignals.length)}
          />
          <MetricCard
            label="Fresh Opportunity Signals"
            value={String(freshOpportunitySignals.length)}
          />
          <MetricCard
            label="Avg Confidence"
            value={`${avgConfidence}%`}
          />
          <MetricCard
            label="Strongest Signal"
            value={`${strongestSignal}%`}
          />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <h3 className="text-xl font-semibold text-white">Opportunity Logic</h3>
          <ul className="mt-5 space-y-4 text-sm leading-7 text-slate-300">
            <li>• GeoPulse is prioritising signals with resilience, timing, and demand-led upside characteristics.</li>
            <li>• Opportunity clusters strengthen when confidence and recurrence align across multiple live items.</li>
            <li>• The best commercial windows tend to appear where speed-to-offer and proof-of-value are achievable.</li>
          </ul>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <h3 className="text-xl font-semibold text-white">
            Recommended Commercial Posture
          </h3>
          <ul className="mt-5 space-y-4 text-sm leading-7 text-slate-300">
            <li>• Act early where confidence is strengthening and demand is visible.</li>
            <li>• Convert signal movement into fast commercial tests and narrow offer packaging.</li>
            <li>• Prioritise opportunity themes with the clearest timing and differentiation advantages.</li>
          </ul>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                Supporting Opportunity Signals
              </div>
              <h3 className="mt-2 text-xl font-semibold text-white">
                Live upside evidence
              </h3>
            </div>

            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
              {topSignals.length} shown
            </div>
          </div>

          {topSignals.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5 text-sm text-slate-400">
              No supporting opportunity signals available yet.
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {topSignals.map((signal, index) => (
                <article
                  key={`${signal.id ?? signal.headline ?? "signal"}-${index}`}
                  className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"
                >
                  <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.16em] text-slate-400">
                    <span>{signal.source ?? "Unknown source"}</span>
                    {signal.region ? <span>• {signal.region}</span> : null}
                    {signal.cluster_tag ? <span>• {signal.cluster_tag}</span> : null}
                  </div>

                  <h4 className="mt-2 text-base font-semibold text-white">
                    {signal.headline ?? "Untitled signal"}
                  </h4>

                  <p className="mt-2 text-sm leading-7 text-slate-300">
                    {signal.summary ?? "No summary available for this signal yet."}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <MetaPill
                      label="Confidence"
                      value={`${resolveConfidence(signal)}%`}
                    />
                    <MetaPill
                      label="Strength"
                      value={`${resolveStrength(signal)}%`}
                    />
                    <MetaPill
                      label="Freshness"
                      value={resolveFreshness(signal)}
                    />
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                Opportunity Preview
              </div>
              <h3 className="mt-2 text-xl font-semibold text-white">
                Priority commercial windows
              </h3>
            </div>
          </div>

          {opportunities.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5 text-sm text-slate-400">
              No opportunity signals are available yet.
            </div>
          ) : (
            <div className="mt-5 grid gap-4">
              {opportunities.map((item, index) => (
                <article
                  key={`${item.title ?? "opportunity"}-${index}`}
                  className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-5"
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs text-emerald-200/80">
                    <span>Opportunity</span>
                    {item.horizon ? (
                      <>
                        <span>•</span>
                        <span>{item.horizon}</span>
                      </>
                    ) : null}
                    {typeof item.score === "number" ? (
                      <>
                        <span>•</span>
                        <span>Score {item.score}</span>
                      </>
                    ) : null}
                  </div>

                  <h3 className="mt-3 text-lg font-semibold text-white">
                    {item.title ?? "Untitled opportunity"}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-200">
                    {item.summary ?? "No summary available for this opportunity yet."}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </section>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
      <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
        {label}
      </div>
      <div className="mt-5 text-4xl font-semibold leading-none text-white">
        {value}
      </div>
    </div>
  );
}

function MetaPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
      {label}: {value}
    </span>
  );
}