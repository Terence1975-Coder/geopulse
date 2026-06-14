import { ReactNode } from "react";

type MetricTone = "neutral" | "risk" | "opportunity" | "signals" | "confidence";

const toneMap: Record<MetricTone, string> = {
  neutral: "border-slate-200 bg-white text-slate-900",
  risk: "border-amber-200 bg-amber-50 text-amber-900",
  opportunity: "border-emerald-200 bg-emerald-50 text-emerald-900",
  signals: "border-cyan-200 bg-cyan-50 text-cyan-900",
  confidence: "border-indigo-200 bg-indigo-50 text-indigo-900",
};

type Props = {
  label: string;
  value: ReactNode;
  tone?: MetricTone;
  className?: string;
};

export default function MetricCard({
  label,
  value,
  tone = "neutral",
  className = "",
}: Props) {
  return (
    <div
      className={[
        "flex min-h-[118px] flex-col justify-between rounded-xl border p-4 text-center shadow-[0_12px_28px_rgba(15,23,42,0.08)]",
        toneMap[tone],
        className,
      ].join(" ")}
    >
      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] leading-snug text-slate-500">
        {label}
      </div>
      <div className="mt-3 text-4xl font-semibold leading-none text-inherit">{value}</div>
    </div>
  );
}
