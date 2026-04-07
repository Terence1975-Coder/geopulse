"use client";

interface Props {
  label: string;
  value: string | number;
  tone?: "risk" | "opportunity" | "neutral";
}

export default function ExecutiveMetricCard({ label, value, tone = "neutral" }: Props) {
  const toneStyle =
    tone === "risk"
      ? "from-red-500/20 to-amber-500/10 border-red-500/30"
      : tone === "opportunity"
      ? "from-teal-500/20 to-emerald-500/10 border-teal-500/30"
      : "from-slate-500/10 to-slate-400/5 border-slate-400/20";

  return (
    <div
      className={`flex flex-col p-4 rounded-xl border bg-gradient-to-br ${toneStyle} backdrop-blur`}
    >
      <span className="text-xs text-slate-400">{label}</span>
      <span className="text-xl font-semibold text-white">{value}</span>
    </div>
  );
}