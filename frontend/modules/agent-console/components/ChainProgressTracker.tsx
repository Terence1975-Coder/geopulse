"use client";

type Step = {
  id: string;
  label: string;
  complete: boolean;
};

export function ChainProgressTracker({ steps }: { steps: Step[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
      <div className="mb-3 text-sm font-medium text-slate-300">Reasoning Chain</div>
      <div className="flex flex-wrap gap-2">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`rounded-full px-3 py-1 text-xs ${
              step.complete
                ? "bg-emerald-400/20 text-emerald-200"
                : "bg-slate-800 text-slate-400"
            }`}
          >
            {step.label}
          </div>
        ))}
      </div>
    </div>
  );
}