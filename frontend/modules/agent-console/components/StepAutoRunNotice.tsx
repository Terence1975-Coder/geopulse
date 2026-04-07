"use client";

export function StepAutoRunNotice({ steps }: { steps?: string[] }) {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-100">
      GeoPulse completed prerequisite reasoning steps automatically: {steps.join(", ")}.
    </div>
  );
}