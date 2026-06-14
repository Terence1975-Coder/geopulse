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
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : lifecycle === "Active"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-rose-200 bg-rose-50 text-rose-700";

  return (
    <div className={compact ? "flex flex-wrap items-center gap-2" : "space-y-2"}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-xl border px-3 py-1 text-xs font-semibold ${lifecycleTone}`}>
          {lifecycle}
        </span>

        <span className="rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
          Confidence {Math.round(confidenceScore * 100)}%
        </span>

        <span className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-800">
          Strength {Math.round(signalStrength * 100)}%
        </span>
      </div>
    </div>
  );
}
