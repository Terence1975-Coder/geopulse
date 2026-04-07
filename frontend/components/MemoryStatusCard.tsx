"use client";

interface Props {
  companyName?: string;
  marketFocus?: string;
  strategicPriorities?: string[];
  recommendationPosture?: string;
}

export default function MemoryStatusCard({
  companyName,
  marketFocus,
  strategicPriorities = [],
  recommendationPosture,
}: Props) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
        Company Memory Status
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
            Company
          </div>
          <div className="mt-1 text-sm text-white">
            {companyName || "No company memory linked yet"}
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
            Market Focus
          </div>
          <div className="mt-1 text-sm text-white">
            {marketFocus || "Not set"}
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
            Strategic Priorities
          </div>
          <div className="mt-1 text-sm text-white">
            {strategicPriorities.length > 0
              ? strategicPriorities.join(", ")
              : "Not set"}
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
            Recommendation Posture
          </div>
          <div className="mt-1 text-sm text-white">
            {recommendationPosture || "Not set"}
          </div>
        </div>
      </div>
    </div>
  );
}