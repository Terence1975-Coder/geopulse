"use client";

type Props = {
  scenarios: Array<{
    key: string;
    label: string;
    description: string;
  }>;
  activeScenarioKey: string;
  onChange: (scenarioKey: string) => void;
};

export default function DemoScenarioSelector({
  scenarios,
  activeScenarioKey,
  onChange,
}: Props) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
        Demo Scenario
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-3">
        {scenarios.map((scenario) => {
          const active = scenario.key === activeScenarioKey;

          return (
            <button
              key={scenario.key}
              type="button"
              onClick={() => onChange(scenario.key)}
              className={[
                "rounded-2xl border p-4 text-left transition",
                active
                  ? "border-emerald-400/20 bg-emerald-500/10"
                  : "border-white/10 bg-slate-950/35 hover:bg-white/[0.05]",
              ].join(" ")}
            >
              <div className="text-sm font-semibold text-white">
                {scenario.label}
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {scenario.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}