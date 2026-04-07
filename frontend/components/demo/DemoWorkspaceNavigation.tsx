"use client";

export type DemoWorkspaceKey = "executive" | "agent-chain" | "planner";

type Props = {
  active: DemoWorkspaceKey;
  onChange: (workspace: DemoWorkspaceKey) => void;
};

const items: Array<{
  key: DemoWorkspaceKey;
  label: string;
  subtitle: string;
}> = [
  {
    key: "executive",
    label: "Executive Dashboard",
    subtitle: "Board-level overview",
  },
  {
    key: "agent-chain",
    label: "Agent Chain",
    subtitle: "Guided decision story",
  },
  {
    key: "planner",
    label: "Planner",
    subtitle: "Execution intelligence",
  },
];

export default function DemoWorkspaceNavigation({
  active,
  onChange,
}: Props) {
  return (
    <aside className="rounded-[30px] border border-white/10 bg-white/[0.04] p-4">
      <div className="px-2 pb-3">
        <div className="text-[11px] uppercase tracking-[0.26em] text-cyan-300/75">
          Demo Navigation
        </div>
        <div className="mt-2 text-lg font-semibold text-white">
          GeoPulse Demo
        </div>
      </div>

      <div className="space-y-2">
        {items.map((item) => {
          const isActive = item.key === active;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onChange(item.key)}
              className={[
                "w-full rounded-2xl border px-4 py-4 text-left transition",
                isActive
                  ? "border-cyan-400/20 bg-cyan-500/10"
                  : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]",
              ].join(" ")}
            >
              <div className="text-sm font-medium text-white">{item.label}</div>
              <div className="mt-1 text-xs text-slate-400">{item.subtitle}</div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}