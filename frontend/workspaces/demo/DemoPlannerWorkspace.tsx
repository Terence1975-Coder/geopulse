"use client";

import type { DemoScenario } from "../../lib/demo/geopulse-demo-scenario";

type Props = {
  scenario: DemoScenario;
};

export default function DemoPlannerWorkspace({ scenario }: Props) {
  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-950/90 to-emerald-950/20 p-6 shadow-2xl">
        <div className="text-xs uppercase tracking-[0.28em] text-emerald-300/75">
          Execution Intelligence Layer
        </div>

        <div className="mt-3 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <h2 className="text-3xl font-semibold text-white">
              Planner Command Surface
            </h2>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300">
              GeoPulse translates the selected path into an execution-ready
              operating plan.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <MetaPill accent="structure">
              Confidence {scenario.summary.confidence}%
            </MetaPill>
            <MetaPill accent="neutral">
              Horizon {scenario.summary.horizon}
            </MetaPill>
            <MetaPill accent="risk">
              Urgency {scenario.summary.urgency}
            </MetaPill>
          </div>
        </div>
      </section>

      <SectionShell title="Execution Objective" accent="action">
        <div className="text-2xl font-semibold text-white">
          {scenario.chain.selectedPathRationale}
        </div>
      </SectionShell>

      <SectionShell title="Execution Phases" accent="structure">
        <div className="grid gap-4 xl:grid-cols-3">
          {scenario.chain.executionPhases.map((phase, index) => (
            <PhaseCard
              key={`${phase.phase}-${index}`}
              phase={phase}
              index={index}
            />
          ))}
        </div>
      </SectionShell>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionShell title="Immediate Actions" accent="action">
          <BulletList
            items={scenario.chain.executionPhases[0]?.actions ?? []}
            tone="action"
          />
        </SectionShell>

        <SectionShell title="Success Measures" accent="structure">
          <BulletList
            items={scenario.planner.successMeasures}
            tone="structure"
          />
        </SectionShell>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionShell title="Dependencies" accent="structure">
          <BulletList
            items={scenario.planner.dependencies}
            tone="structure"
          />
        </SectionShell>

        <SectionShell title="Execution Risks" accent="risk">
          <BulletList items={scenario.planner.risks} tone="risk" />
        </SectionShell>
      </div>

      <SectionShell title="Review Checkpoints" accent="structure">
        <BulletList
          items={scenario.planner.reviewCheckpoints}
          tone="structure"
        />
      </SectionShell>
    </div>
  );
}

function SectionShell({
  title,
  accent = "neutral",
  children,
}: {
  title: string;
  accent?: "neutral" | "action" | "structure" | "risk";
  children: React.ReactNode;
}) {
  const toneMap = {
    neutral: "border-white/10 bg-white/[0.03]",
    action: "border-emerald-400/20 bg-emerald-500/10",
    structure: "border-cyan-400/20 bg-cyan-500/10",
    risk: "border-amber-400/20 bg-amber-500/10",
  };

  return (
    <section className={`rounded-3xl border p-5 ${toneMap[accent]}`}>
      <div className="text-xs uppercase tracking-[0.2em] text-slate-300/80">
        {title}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function BulletList({
  items,
  tone = "neutral",
}: {
  items: string[];
  tone?: "neutral" | "action" | "structure" | "risk";
}) {
  const itemTone =
    tone === "action"
      ? "border-emerald-400/15 bg-slate-950/35 text-slate-100"
      : tone === "structure"
      ? "border-cyan-400/15 bg-slate-950/35 text-slate-100"
      : tone === "risk"
      ? "border-amber-400/15 bg-slate-950/35 text-slate-100"
      : "border-white/10 bg-slate-950/35 text-slate-200";

  if (items.length === 0) {
    return <div className="text-sm text-slate-400">No items available.</div>;
  }

  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li
          key={`${item}-${index}`}
          className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${itemTone}`}
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function MetaPill({
  children,
  accent = "neutral",
}: {
  children: React.ReactNode;
  accent?: "neutral" | "action" | "structure" | "risk";
}) {
  const toneMap = {
    neutral: "border-white/10 bg-white/5 text-slate-300",
    action: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
    structure: "border-cyan-400/20 bg-cyan-500/10 text-cyan-200",
    risk: "border-amber-400/20 bg-amber-500/10 text-amber-200",
  };

  return (
    <span className={`rounded-full border px-3 py-1 text-xs ${toneMap[accent]}`}>
      {children}
    </span>
  );
}

function PhaseCard({
  phase,
  index,
}: {
  phase: {
    phase: string;
    owner: string;
    timing: string;
    actions: string[];
  };
  index: number;
}) {
  return (
    <article className="rounded-3xl border border-cyan-400/20 bg-slate-950/45 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-cyan-300/75">
            Execution Phase {index + 1}
          </div>
          <div className="mt-2 text-xl font-semibold text-white">
            {phase.phase}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <MetaPill accent="structure">Owner {phase.owner}</MetaPill>
          <MetaPill accent="structure">{phase.timing}</MetaPill>
        </div>
      </div>

      <div className="mt-4">
        <BulletList items={phase.actions} tone="structure" />
      </div>
    </article>
  );
}