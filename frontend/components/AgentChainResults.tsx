"use client";

import type { AgentChainResponse } from "../types/geopulse";

type Props = {
  data: AgentChainResponse | null;
};

function StageCard({
  title,
  stage,
}: {
  title: string;
  stage: any;
}) {
  if (!stage) return null;

  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
        {title}
      </div>

      <h3 className="mt-2 text-xl font-semibold text-white">
        {stage.headline}
      </h3>

      <p className="mt-3 text-sm text-slate-300 leading-7">
        {stage.key_insight}
      </p>

      {stage.drivers?.length > 0 && (
        <div className="mt-4">
          <div className="text-sm font-medium text-white">Drivers</div>
          <ul className="mt-2 list-disc pl-5 text-sm text-slate-300 space-y-1">
            {stage.drivers.map((d: string, i: number) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </div>
      )}

      {stage.recommended_actions?.length > 0 && (
        <div className="mt-4">
          <div className="text-sm font-medium text-white">
            Recommended Actions
          </div>
          <ul className="mt-2 list-disc pl-5 text-sm text-slate-300 space-y-1">
            {stage.recommended_actions.map((a: string, i: number) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function AgentChainResults({ data }: Props) {
  if (!data || !data.outputs) return null;

  const { analyse, advise, plan } = data.outputs;

  return (
    <div className="space-y-6">
      <StageCard title="Analyst Output" stage={analyse} />
      <StageCard title="Advisor Output" stage={advise} />
      <StageCard title="Planner Output" stage={plan} />
    </div>
  );
}