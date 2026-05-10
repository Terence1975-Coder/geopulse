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
  business_impact_score?: number;
  business_impact?: number;
  timestamp?: string;
  lifecycle?: string;
  relative_time?: string;
  confidence?: number;
  detected_at?: string;
  source_url?: string;
  url?: string;
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
  if (typeof signal.confidence_score === "number") {
    return toPercent(signal.confidence_score);
  }

  if (typeof signal.confidence === "number") {
    return toPercent(signal.confidence);
  }

  return 0;
}

function resolveImpact(signal: SignalItem): number {
  if (typeof signal.business_impact_score === "number") {
    return toPercent(signal.business_impact_score);
  }

  if (typeof signal.business_impact === "number") {
    return toPercent(signal.business_impact);
  }

  if (typeof signal.signal_strength === "number") {
    return toPercent(signal.signal_strength);
  }

  return 0;
}

function resolveRelativeTime(signal: SignalItem): string {
  if (typeof signal.relative_time === "string" && signal.relative_time.trim()) {
    return signal.relative_time;
  }

  const rawDate = signal.detected_at || signal.timestamp;
  if (!rawDate) return "unknown";

  const parsed = new Date(rawDate).getTime();
  if (Number.isNaN(parsed)) return "unknown";

  const diffMinutes = Math.max(0, Math.round((Date.now() - parsed) / 60000));

  if (diffMinutes < 60) return `${diffMinutes} mins ago`;

  const hours = Math.round(diffMinutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
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

function StatusPill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "risk" | "opportunity" | "info" | "good";
}) {
  const toneMap = {
    neutral: "border-slate-200 bg-white text-slate-600",
    risk: "border-amber-200 bg-amber-50 text-amber-700",
    opportunity: "border-emerald-200 bg-emerald-50 text-emerald-700",
    info: "border-cyan-200 bg-cyan-50 text-cyan-700",
    good: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-xs font-medium ${toneMap[tone]}`}
    >
      {children}
    </span>
  );
}

function ReadoutItem({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center">
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </div>
      <div className="mt-1 truncate text-sm font-semibold text-slate-950">
        {value}
      </div>
    </div>
  );
}

export default function SignalFeedCard({
  signal,
  onOpen,
  onViewSupportingSignals,
}: Props) {
  const isOpportunity = signal.kind === "opportunity";
  const confidence = resolveConfidence(signal);
  const impact = resolveImpact(signal);
  const relativeTime = resolveRelativeTime(signal);
  const lifecycle = resolveLifecycle(signal);
  const sourceUrl = signal.source_url || signal.url;

  const borderTone = isOpportunity
    ? "border-emerald-200"
    : signal.severity === "high"
    ? "border-red-200"
    : "border-slate-200";

  const cardTone = isOpportunity
    ? "bg-emerald-50/60"
    : signal.severity === "high"
    ? "bg-red-50/40"
    : "bg-white";

  const severityTone =
    signal.severity === "high"
      ? "text-red-700"
      : signal.severity === "medium"
      ? "text-amber-700"
      : "text-emerald-700";

  return (
    <article
      className={`overflow-hidden rounded-2xl border ${borderTone} ${cardTone} shadow-[0_14px_34px_rgba(15,23,42,0.08)]`}
    >
      <div className="p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <StatusPill tone={isOpportunity ? "opportunity" : "risk"}>
                {signal.kind}
              </StatusPill>

              <StatusPill tone="neutral">
                <span className={severityTone}>{signal.severity}</span>
              </StatusPill>

              <StatusPill tone="info">{signal.cluster_tag}</StatusPill>
            </div>

            <StatusPill tone={lifecycle === "Fresh" ? "good" : "neutral"}>
              {lifecycle}
            </StatusPill>
          </div>

          <div>
            <h3 className="text-lg font-semibold leading-snug text-slate-950">
              {signal.headline}
            </h3>

            <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
              {signal.summary}
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            <ReadoutItem label="Time" value={relativeTime} />
            <ReadoutItem label="Source" value={signal.source || "unknown"} />
            <ReadoutItem label="Region" value={signal.region || "Global"} />
            <ReadoutItem label="Type" value={signal.source_type ?? "unknown"} />
            <ReadoutItem label="Confidence" value={`${confidence}%`} />
            <ReadoutItem label="Impact" value={`${impact}%`} />
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {onOpen ? (
              <button
                onClick={onOpen}
                className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Open Signal
              </button>
            ) : null}

            {onViewSupportingSignals ? (
              <button
                onClick={() => onViewSupportingSignals(signal)}
                className="rounded-xl border border-cyan-300 bg-cyan-50 px-3.5 py-2 text-sm font-medium text-cyan-800 transition hover:bg-cyan-100"
              >
                View Supporting Signals
              </button>
            ) : null}

            {sourceUrl ? (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Source
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}