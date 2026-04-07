"use client";

type Props = {
  lifecycle: "Fresh" | "Active" | "Aging" | string;
  confidenceScore?: number;
  signalStrength?: number;
  compact?: boolean;
};

export default function TrustBadge({
  lifecycle,
  confidenceScore = 0,
  signalStrength = 0,
  compact = false,
}: Props) {
  const lifecycleTone =
    lifecycle === "Fresh"
      ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-200"
      : lifecycle === "Active"
      ? "border-amber-400/30 bg-amber-500/15 text-amber-200"
      : "border-red-400/30 bg-red-500/15 text-red-200";

  return (
    <div className={compact ? "flex flex-wrap items-center gap-2" : "space-y-2"}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full border px-3 py-1 text-xs font-medium ${lifecycleTone}`}>
          {lifecycle}
        </span>

        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
          Confidence {Math.round(confidenceScore * 100)}%
        </span>

        <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">
          Strength {Math.round(signalStrength * 100)}%
        </span>
      </div>
    </div>
  );
}