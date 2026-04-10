import AgentSection from "./AgentSection";
import AgentBadgeRow from "./AgentBadgeRow";
import type { StructuredAgentOutput } from "../../types/intelligence";

type AgentResponseCardProps = {
  data: StructuredAgentOutput;
  stageLabel?: string;
};

export default function AgentResponseCard({
  data,
  stageLabel,
}: AgentResponseCardProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-2xl backdrop-blur">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          {stageLabel ? (
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
              {stageLabel}
            </div>
          ) : null}

          <h2 className="text-2xl font-semibold tracking-tight text-white">
            {data.headline}
          </h2>
        </div>
      </div>

      <div className="grid gap-4">
        <AgentSection title="Key Insight" text={data.key_insight} />
        <AgentSection title="Drivers" items={data.drivers} />
        <AgentSection
          title="Second Order Effects"
          items={data.second_order_effects}
          muted
        />
        <AgentSection title="Implications" items={data.implications} />
        <AgentSection title="Recommended Actions" items={data.recommended_actions} />
      </div>

      <div className="mt-5 border-t border-white/10 pt-4">
        <AgentBadgeRow
          confidence={data.confidence ?? 0}
          timeHorizon={data.time_horizon ?? "short"}
          basedOnStages={data.based_on_stages}
        />

        {!!data.profile_references?.length && (
          <div className="mt-3 text-xs text-white/60">
            Profile grounding: {data.profile_references.join(", ")}
          </div>
        )}

        {!!data.missing_profile_data?.length && (
          <div className="mt-2 text-xs text-amber-300/80">
            Missing profile data: {data.missing_profile_data.join(", ")}
          </div>
        )}
      </div>
    </div>
  );
}