"use client";

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
  timestamp?: string;
  lifecycle?: string;
  relative_time?: string;
  source_url?: string;

  confidence?: number;
  detected_at?: string;
};

interface Props {
  signal: SignalItem;
  onOpen?: () => void;
  onViewSupportingSignals?: (signal: SignalItem) => void;
}

function toPercent(value?: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return value > 1 ? Math.round(value) : Math.round(value * 100);
}

function resolveConfidence(signal: SignalItem): number {
  return typeof signal.confidence_score === "number"
    ? toPercent(signal.confidence_score)
    : typeof signal.confidence === "number"
    ? toPercent(signal.confidence)
    : 0;
}

function resolveStrength(signal: SignalItem): number {
  return typeof signal.signal_strength === "number"
    ? toPercent(signal.signal_strength)
    : 0;
}

function resolveRelativeTime(signal: SignalItem): string {
  const rawDate = signal.detected_at || signal.timestamp;
  if (!rawDate) return "unknown";

  const parsed = new Date(rawDate).getTime();
  if (Number.isNaN(parsed)) return "unknown";

  const diffMinutes = Math.max(0, Math.round((Date.now() - parsed) / 60000));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const hours = Math.floor(diffMinutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function resolveLifecycle(signal: SignalItem): string {
  if (typeof signal.lifecycle === "string" && signal.lifecycle.trim()) {
    return signal.lifecycle;
  }

  if (typeof signal.freshness_minutes === "number") {
    if (signal.freshness_minutes <= 60) return "Fresh";
    if (signal.freshness_minutes <= 180) return "Watch";
    return "Aging";
  }

  return "Unknown";
}

function Pill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "good" | "info";
}) {
  const classes =
    tone === "good"
      ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
      : tone === "info"
      ? "border-cyan-400/20 bg-cyan-500/10 text-cyan-200"
      : "border-white/10 bg-white/5 text-slate-200";

  return (
    <span className={`rounded-full border px-4 py-2 text-sm ${classes}`}>
      {children}
    </span>
  );
}

export default function SignalFeedCard({
  signal,
  onOpen,
  onViewSupportingSignals,
}: Props) {
  const kindTone =
    signal.kind === "opportunity"
      ? "border-emerald-400/20 bg-emerald-500/10"
      : "border-amber-400/20 bg-amber-500/10";

  const severityTone =
    signal.severity === "high"
      ? "text-red-200"
      : signal.severity === "medium"
      ? "text-amber-200"
      : "text-emerald-200";

  const confidence = resolveConfidence(signal);
  const strength = resolveStrength(signal);
  const relativeTime = resolveRelativeTime(signal);
  const lifecycle = resolveLifecycle(signal);

  return (
    <article className={`rounded-2xl border p-5 shadow-xl ${kindTone}`}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
            <span>{signal.kind}</span>
            <span>•</span>
            <span className={severityTone}>{signal.severity}</span>
            <span>•</span>
            <span>{signal.cluster_tag}</span>
          </div>

          <h3 className="mt-3 text-xl font-semibold text-white">
            {signal.headline}
          </h3>

          <p className="mt-3 text-sm leading-7 text-slate-300">
            {signal.summary}
          </p>
        </div>

        <div className="min-w-[240px] rounded-xl border border-white/10 bg-slate-950/40 p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
            Trust View
          </div>

          <div className="mt-3 flex flex-wrap gap-3">
            <Pill tone="good">{lifecycle}</Pill>
            <Pill>Confidence {confidence}%</Pill>
            <Pill tone="info">Strength {strength}%</Pill>
          </div>

          <div className="mt-4 space-y-2 text-sm text-slate-300">
            <div className="flex items-center justify-between gap-4">
              <span>Time</span>
              <span>{relativeTime}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>Source</span>
              <span>{signal.source}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>Type</span>
              <span>{signal.source_type ?? "unknown"}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>Region</span>
              <span>{signal.region}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {onOpen ? (
          <button
            onClick={onOpen}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
          >
            Open Signal
          </button>
        ) : null}

        {onViewSupportingSignals ? (
          <button
            onClick={() => onViewSupportingSignals(signal)}
            className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200 transition hover:bg-cyan-500/20"
          >
            View Supporting Signals
          </button>
        ) : null}
		        {signal.source_url ? (
          <a
            href={signal.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200 transition hover:bg-emerald-500/20"
          >
            View Source
          </a>
        ) : null}
      </div>
    </article>
  );
}