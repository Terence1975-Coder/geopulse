import { DashboardResponse } from "@/types";

export default function CopilotConsole({ data }: { data: DashboardResponse }) {
  const scenario = data.scenario;
  return (
    <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/5 p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/70">
            GeoPulse Copilot Console
          </p>
          <h3 className="text-xl font-semibold text-white">
            {scenario.posture}
          </h3>
        </div>
        <div className="rounded-full border border-cyan-300/30 px-3 py-1 text-xs text-cyan-100">
          Profile-driven insight
        </div>
      </div>

      <div className="mb-4 rounded-2xl border border-cyan-300/20 bg-black/20 px-4 py-3 text-sm text-cyan-50">
        {scenario.reasoning_banner}
      </div>

      <p className="mb-4 text-white/80">{scenario.executive_summary}</p>
      <p className="mb-5 rounded-2xl bg-white/5 p-4 text-sm text-white/85">
        {scenario.profile_driven_insight}
      </p>

      <div className="grid gap-5 xl:grid-cols-2">
        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/70">
            Second-order effects
          </h4>
          <div className="space-y-3">
            {scenario.second_order_effects.map((item) => (
              <div key={item} className="rounded-2xl bg-black/20 p-4 text-sm text-white/80">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/70">
            Adaptive recommendations
          </h4>
          <div className="space-y-3">
            {scenario.recommended_actions.map((item) => (
              <div key={item} className="rounded-2xl bg-black/20 p-4 text-sm text-white/80">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
