"use client";

import { useMemo, useState } from "react";
import SignalFeedCard from "../components/SignalFeedCard";
import SignalTraceModal from "../components/SignalTraceModal";
import Panel from "../components/ui/Panel";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import MetricCard from "../components/ui/MetricCard";

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
      <Panel
        variant="base"
        padding="xl"
        className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 text-slate-900 shadow-[0_18px_48px_rgba(15,23,42,0.10)]"
      >
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(620px,0.9fr)] xl:items-end">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
              Live Monitoring
            </div>

            <h2 className="mt-3 text-4xl font-semibold leading-tight text-slate-950 md:text-5xl">
              Live Signals Workspace
            </h2>

            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              V8.4 surfaces the strongest signals by business impact, trust, and executive relevance rather than freshness alone.
            </p>
          </div>

          <Panel
            variant="soft"
            padding="md"
            className="rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm"
          >
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Signal Controls
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/15"
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
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/15"
              >
                <option value="all">Severity: all</option>
                <option value="low">Severity: low</option>
                <option value="medium">Severity: medium</option>
                <option value="high">Severity: high</option>
              </select>

              <select
                value={kind}
                onChange={(e) => setKind(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/15"
              >
                <option value="all">Type: all</option>
                <option value="risk">Type: risk</option>
                <option value="opportunity">Type: opportunity</option>
              </select>

              <select
                value={lifecycle}
                onChange={(e) => setLifecycle(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/15"
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
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/15"
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
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/15"
              >
                <option value="impact">Sort: impact</option>
                <option value="strongest">Sort: strongest</option>
                <option value="confidence">Sort: confidence</option>
                <option value="freshest">Sort: freshest</option>
              </select>
            </div>

            <div className="mt-3 flex justify-end gap-2">
              <Button
                onClick={() => setViewMode("grid")}
                variant={viewMode === "grid" ? "primary" : "secondary"}
                size="sm"
                className="rounded-lg px-3"
              >
                Grid
              </Button>

              <Button
                onClick={() => setViewMode("list")}
                variant={viewMode === "list" ? "primary" : "secondary"}
                size="sm"
                className="rounded-lg px-3"
              >
                List
              </Button>
            </div>
          </Panel>
        </div>
      </Panel>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Visible Signals" value={String(filtered.length)} tone="signals" />
        <MetricCard
          label="Fresh Signals"
          value={String(filtered.filter((s) => s.lifecycle === "Fresh").length)}
          tone="signals"
        />
        <MetricCard label="Average Confidence" value={`${averageConfidence}%`} tone="confidence" />
        <MetricCard
          label="Average Business Impact"
          value={`${averageBusinessImpact}%`}
          tone="signals"
        />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
          Dominant Clusters
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          {dominantClusters.length > 0 ? (
            dominantClusters.map(([cluster, count]) => (
              <span
                key={cluster}
                className="rounded-xl border border-cyan-200 bg-cyan-50 px-3.5 py-1.5 text-sm font-semibold text-cyan-800"
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
