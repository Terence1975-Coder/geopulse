"use client";

import { useMemo, useState } from "react";
import SignalFeedCard from "../components/SignalFeedCard";
import SignalTraceModal from "../components/SignalTraceModal";
import type { SignalItem } from "../types/geopulse";

interface Props {
  signals: SignalItem[];
  onOpenSignal: (signal: SignalItem) => void;
}

export default function LiveSignalsWorkspace({ signals, onOpenSignal }: Props) {
  const [region, setRegion] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [kind, setKind] = useState("all");
  const [lifecycle, setLifecycle] = useState("all");
  const [sourceType, setSourceType] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"freshest" | "strongest" | "confidence">("strongest");
  const [traceOpen, setTraceOpen] = useState(false);
  const [traceSignals, setTraceSignals] = useState<SignalItem[]>([]);
  const [traceTitle, setTraceTitle] = useState("Supporting Signals");

  const regions = ["all", ...Array.from(new Set(signals.map((s) => s.region).filter(Boolean)))];
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
      if (lifecycle !== "all" && (s.lifecycle || "Unknown") !== lifecycle) return false;
      if (sourceType !== "all" && (s.source_type || "unknown") !== sourceType) return false;
      return true;
    });

    const sorted = [...subset].sort((a, b) => {
      if (sortBy === "freshest") {
        return (a.freshness_minutes ?? Number.MAX_SAFE_INTEGER) - (b.freshness_minutes ?? Number.MAX_SAFE_INTEGER);
      }
      if (sortBy === "confidence") {
        return (b.confidence_score ?? 0) - (a.confidence_score ?? 0);
      }
      return (b.signal_strength ?? 0) - (a.signal_strength ?? 0);
    });

    return sorted;
  }, [signals, region, severity, kind, lifecycle, sourceType, sortBy]);

  const averageConfidence = Math.round(
    (
      filtered.reduce((acc, item) => acc + (item.confidence_score ?? 0), 0) /
      Math.max(1, filtered.length)
    ) * 100
  );

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-950/90 to-indigo-950/30 p-6 shadow-2xl">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.28em] text-cyan-300/70">
              Live Monitoring
            </div>
            <h2 className="mt-2 text-3xl font-semibold text-white">
              Live Signals Workspace
            </h2>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300">
              Trust-scored live signals with freshness, confidence, source traceability,
              lifecycle status, and executive drill-down controls.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white"
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
              className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white"
            >
              <option value="all">Severity: all</option>
              <option value="low">Severity: low</option>
              <option value="medium">Severity: medium</option>
              <option value="high">Severity: high</option>
            </select>

            <select
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white"
            >
              <option value="all">Type: all</option>
              <option value="risk">Type: risk</option>
              <option value="opportunity">Type: opportunity</option>
            </select>

            <select
              value={lifecycle}
              onChange={(e) => setLifecycle(e.target.value)}
              className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white"
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
              className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white"
            >
              {sourceTypes.map((item) => (
                <option key={item} value={item}>
                  Source: {item}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "freshest" | "strongest" | "confidence")
              }
              className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white"
            >
              <option value="strongest">Sort: strongest</option>
              <option value="freshest">Sort: freshest</option>
              <option value="confidence">Sort: confidence</option>
            </select>

            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`rounded-2xl border px-4 py-3 text-sm ${
                  viewMode === "grid"
                    ? "border-cyan-400/20 bg-cyan-500/10 text-cyan-200"
                    : "border-white/10 bg-white/5 text-slate-300"
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`rounded-2xl border px-4 py-3 text-sm ${
                  viewMode === "list"
                    ? "border-cyan-400/20 bg-cyan-500/10 text-cyan-200"
                    : "border-white/10 bg-white/5 text-slate-300"
                }`}
              >
                List
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Visible Signals" value={String(filtered.length)} />
        <MetricCard
          label="Fresh Signals"
          value={String(filtered.filter((s) => (s.lifecycle || "Unknown") === "Fresh").length)}
        />
        <MetricCard label="Average Confidence" value={`${averageConfidence}%`} />
      </section>

      <section
        className={
          viewMode === "grid"
            ? "grid gap-4 xl:grid-cols-2 2xl:grid-cols-3"
            : "space-y-4"
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
                    item.cluster_tag === selected.cluster_tag || item.id === selected.id
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
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</div>
      <div className="mt-3 text-3xl font-semibold text-white">{value}</div>
    </div>
  );
}