"use client";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function IntelligenceInputPanel({ value, onChange }: Props) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
      <div className="mb-3 text-sm font-medium text-slate-300">Shared Strategic Context</div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter a company issue, geopolitical question, margin pressure scenario, supply chain concern, or profile-building prompt..."
        className="min-h-[180px] w-full rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-white outline-none placeholder:text-slate-500"
      />
    </div>
  );
}