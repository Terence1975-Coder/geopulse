"use client";

import { useMemo, useState } from "react";
import SignalFeedCard from "../components/SignalFeedCard";
import SignalTraceModal from "../components/SignalTraceModal";

type SignalItem = {
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
  business_impact_score?: number;
  timestamp?: string;
  lifecycle?: string;
  relative_time?: string;
  url?: string;
  source_url?: string;
};

interface Props {
  signals: SignalItem[];
  onOpenSignal: (signal: SignalItem) => void;
}

type SortMode = "impact" | "strongest" | "confidence" | "freshest";

function toNumericScore(value?: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return value > 1 ? value / 100 : value;
}

export default function LiveSignalsWorkspace({ signals, onOpenSignal }: Props) {
  const [region, setRegion] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [kind, setKind] = useState("all");
  const [lifecycle, setLifecycle] = useState("all");
  const [sourceType, setSourceType] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<SortMode>("impact");
  const [traceOpen, setTraceOpen] = useState(false);
  const [traceSignals, setTraceSignals] = useState<SignalItem[]>([]);
  const [traceTitle, setTraceTitle] = useState("Supporting Signals");

  const regions = ["all", ...Array.from(new Set(signals.map((s) => s.region)))];
  const sourceTypes = [
    "all",
    ...Array.from(new Set(signals.map((s) => s.source_type || "unknown"))),
  ];
  const lifecycles = [
    "all",
    ...Array.from(new Set(signals.map((s) => s.lifecycle || "Unknown"))),
  ];

  const filtered = useMemo(() => {
    const subset = signals.filter((s) => {
      if (region !== "all" && s.region !== region) return false;
      if (severity !== "all" && s.severity !== severity) return false;
      if (kind !== "all" && s.kind !== kind) return false;
      if (lifecycle !== "all" && (s.lifecycle || "Unknown") !== lifecycle) {
        return false;
      }
      if (sourceType !== "all" && (s.source_type || "unknown") !== sourceType) {
        return false;
      }
      return true;
    });

    const sorted = [...subset].sort((a, b) => {
      if (sortBy === "freshest") {
        return (a.freshness_minutes ?? 999999) - (b.freshness_minutes ?? 999999);
      }

      if (sortBy === "confidence") {
        return (
          toNumericScore(b.confidence_score) - toNumericScore(a.confidence_score)
        );
      }

      if (sortBy === "strongest") {
        return (
          toNumericScore(b.signal_strength) - toNumericScore(a.signal_strength)
        );
      }

      return (
		toNumericScore(b.business_impact_score ?? b.signal_strength ?? b.confidence_score) -
		  toNumericScore(a.business_impact_score ?? a.signal_strength ?? a.confidence_score) ||
		toNumericScore(b.signal_strength) - toNumericScore(a.signal_strength) ||
		toNumericScore(b.confidence_score) - toNumericScore(a.confidence_score) ||
		(a.freshness_minutes ?? 999999) - (b.freshness_minutes ?? 999999)
	  );
    });

    return sorted;
  }, [signals, region, severity, kind, lifecycle, sourceType, sortBy]);

  const averageConfidence = Math.round(
    (filtered.reduce(
      (acc, item) => acc + toNumericScore(item.confidence_score),
      0
    ) /
      Math.max(1, filtered.length)) *
      100
  );

  const averageBusinessImpact = Math.round(
    (filtered.reduce(
      (acc, item) =>
        acc +
        toNumericScore(
          item.business_impact_score ?? item.signal_strength ?? item.confidence_score
        ),
      0
    ) /
      Math.max(1, filtered.length)) *
      100
  );

  const dominantClusters = Array.from(
    filtered.reduce((acc, signal) => {
      const key = signal.cluster_tag || "General";
      acc.set(key, (acc.get(key) || 0) + 1);
      return acc;
    }, new Map<string, number>())
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-[#020617] to-slate-900 shadow-[0_0_60px_rgba(0,0,0,0.45)]">
  <div className="px-6 py-7 md:px-8 md:py-8 xl:px-10 xl:py-8">
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(620px,0.9fr)] xl:items-end">
      <div className="min-w-0">
        <div className="text-[11px] font-medium uppercase tracking-[0.38em] text-cyan-300">
          Live Monitoring
        </div>

        <h2 className="mt-4 text-4xl font-semibold leading-tight text-white md:text-5xl">
          Live Signals Workspace
        </h2>

        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-400">
          V8.4 surfaces the strongest signals by business impact, trust,
          and executive relevance rather than freshness alone.
        </p>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
        <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
          Signal Controls
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm font-medium text-slate-100 shadow-[0_6px_18px_rgba(15,23,42,0.20)] outline-none transition focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10"
          >
            {regions.map((item) => (
              <option key={item} value={item}>
                Region: {item}
              </option>
            ))}
          </select>

          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm font-medium text-slate-100 shadow-[0_6px_18px_rgba(15,23,42,0.20)] outline-none transition focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10"
          >
            <option value="all">Severity: all</option>
            <option value="low">Severity: low</option>
            <option value="medium">Severity: medium</option>
            <option value="high">Severity: high</option>
          </select>

          <select
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm font-medium text-slate-100 shadow-[0_6px_18px_rgba(15,23,42,0.20)] outline-none transition focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10"
          >
            <option value="all">Type: all</option>
            <option value="risk">Type: risk</option>
            <option value="opportunity">Type: opportunity</option>
          </select>

          <select
            value={lifecycle}
            onChange={(e) => setLifecycle(e.target.value)}
            className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm font-medium text-slate-100 shadow-[0_6px_18px_rgba(15,23,42,0.20)] outline-none transition focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10"
          >
            {lifecycles.map((item) => (
              <option key={item} value={item}>
                Lifecycle: {item}
              </option>
            ))}
          </select>

          <select
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value)}
            className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm font-medium text-slate-100 shadow-[0_6px_18px_rgba(15,23,42,0.20)] outline-none transition focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10"
          >
            {sourceTypes.map((item) => (
              <option key={item} value={item}>
                Source: {item}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortMode)}
            className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm font-medium text-slate-100 shadow-[0_6px_18px_rgba(15,23,42,0.20)] outline-none transition focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10"
          >
            <option value="impact">Sort: impact</option>
            <option value="strongest">Sort: strongest</option>
            <option value="confidence">Sort: confidence</option>
            <option value="freshest">Sort: freshest</option>
          </select>
        </div>

        <div className="mt-3 flex justify-end gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`rounded-2xl border px-4 py-2.5 text-sm font-medium transition ${
              viewMode === "grid"
                ? "border-cyan-400/40 bg-cyan-500/15 text-cyan-100 shadow-[0_8px_20px_rgba(6,182,212,0.18)]"
                : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.07]"
            }`}
          >
            Grid
          </button>

          <button
            onClick={() => setViewMode("list")}
            className={`rounded-2xl border px-4 py-2.5 text-sm font-medium transition ${
              viewMode === "list"
                ? "border-cyan-400/40 bg-cyan-500/15 text-cyan-100 shadow-[0_8px_20px_rgba(6,182,212,0.18)]"
                : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.07]"
            }`}
          >
            List
          </button>
        </div>
      </div>
    </div>
  </div>
</section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
	    <MetricCard label="Visible Signals" value={String(filtered.length)} />
	    <MetricCard
		  label="Fresh Signals"
		  value={String(filtered.filter((s) => s.lifecycle === "Fresh").length)}
	    />
	    <MetricCard label="Average Confidence" value={`${averageConfidence}%`} />
	    <MetricCard
		  label="Average Business Impact"
		  value={`${averageBusinessImpact}%`}
	    />
  </section>

      <section className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
        <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
          Dominant Clusters
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          {dominantClusters.length > 0 ? (
            dominantClusters.map(([cluster, count]) => (
              <span
                key={cluster}
                className="rounded-full border border-cyan-300 bg-cyan-50 px-4 py-2 text-sm font-medium text-cyan-800"
              >
                {cluster} • {count}
              </span>
            ))
          ) : (
            <span className="text-sm text-slate-500">
              No dominant clusters visible.
            </span>
          )}
        </div>
      </section>

      <section
        className={
          viewMode === "grid"
            ? "grid gap-5 xl:grid-cols-2 2xl:grid-cols-3"
            : "space-y-5"
        }
      >
        {filtered.map((signal) => (
          <SignalFeedCard
            key={signal.id}
            signal={signal}
            onOpen={() => onOpenSignal(signal)}
            onViewSupportingSignals={(selected) => {
              setTraceTitle(`Trace for ${selected.headline}`);
              setTraceSignals(
                signals.filter(
                  (item) =>
                    item.cluster_tag === selected.cluster_tag ||
                    item.id === selected.id
                )
              );
              setTraceOpen(true);
            }}
          />
        ))}
      </section>

      <SignalTraceModal
        open={traceOpen}
        title={traceTitle}
        signals={traceSignals}
        onClose={() => setTraceOpen(false)}
      />
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-300 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            {label}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400">
            Live metric
          </div>
        </div>

        <div className="shrink-0 rounded-md border border-cyan-300 bg-cyan-50 px-3 py-2 text-2xl font-semibold leading-none text-cyan-900">
          {value}
        </div>
      </div>
    </div>
  );
}