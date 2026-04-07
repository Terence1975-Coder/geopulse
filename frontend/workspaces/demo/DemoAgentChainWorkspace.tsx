"use client";

import type { DemoScenario } from "../../lib/demo/geopulse-demo-scenario";

type Props = {
  scenario: DemoScenario;
  onOpenPlanner: () => void;
};

export default function DemoAgentChainWorkspace({
  scenario,
  onOpenPlanner,
}: Props) {
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[34px] border border-white/10 bg-gradient-to-br from-slate-950 via-[#071224] to-slate-950 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <div className="grid gap-6 px-6 py-7 md:px-8 xl:grid-cols-[1.15fr_0.85fr] xl:items-center">
          <div>
            <div className="text-[11px] uppercase tracking-[0.32em] text-cyan-300/75">
              Agent Chain
            </div>

            <h2 className="mt-3 text-4xl font-semibold leading-tight text-white md:text-5xl">
              Guided Decision Story
            </h2>

            <p className="mt-4 max-w-4xl text-sm leading-8 text-slate-300 md:text-base">
              GeoPulse runs Analyse, Advise, and Plan as one connected executive
              workflow.
            </p>

            <div className="mt-6 rounded-[26px] border border-white/10 bg-white/[0.04] p-5">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Prompt
              </div>
              <p className="mt-3 text-sm leading-8 text-slate-100">
                {scenario.chain.input}
              </p>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Chain Status
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <StagePill label="Analyse" complete />
              <StagePill label="Advise" complete />
              <StagePill label="Plan" complete />
              <StagePill label="Execution" active />
            </div>

            <p className="mt-5 text-sm leading-7 text-slate-300">
              GeoPulse has completed the chain and selected a path for executive
              review.
            </p>

            <button
              type="button"
              onClick={onOpenPlanner}
              className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-5 py-3 text-sm font-medium text-emerald-100 transition hover:bg-emerald-500/20"
            >
              Open Planner
            </button>
          </div>
        </div>
      </section>

      <StoryCard
        eyebrow="Situation Overview"
        title="What is happening right now"
        tone="priority"
      >
        <p className="text-sm leading-8 text-slate-100">
          {scenario.chain.situationOverview}
        </p>
      </StoryCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <StoryCard eyebrow="Key Drivers" title="What is shaping the picture">
          <BulletList items={scenario.chain.keyDrivers} />
        </StoryCard>

        <StoryCard eyebrow="What This Means" title="Executive implications">
          <BulletList items={scenario.chain.whatThisMeans} />
        </StoryCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr] items-stretch">
        <StoryCard
          eyebrow="Recommended Actions"
          title="What GeoPulse says to do next"
          tone="success"
        >
          <BulletList items={scenario.chain.recommendedActions} />
        </StoryCard>

        <StoryCard eyebrow="Recommended Path" title="Why this path wins first">
          <p className="text-sm leading-8 text-slate-200">
            {scenario.chain.selectedPathRationale}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {scenario.chain.supportingSignals.map((item, index) => (
              <span
                key={`${item}-${index}`}
                className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-100"
              >
                {item}
              </span>
            ))}
          </div>
        </StoryCard>
      </div>

      <section className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6">
        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
          Strategic Paths
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-3">
          {scenario.chain.strategicPaths.map((path) => (
            <div
              key={path.id}
              className={[
                "rounded-[26px] border p-5",
                path.recommended
                  ? "border-emerald-400/25 bg-emerald-500/10"
                  : "border-white/10 bg-slate-950/35",
              ].join(" ")}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-lg font-semibold text-white">
                  {path.name}
                </div>
                {path.recommended ? (
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-100">
                    Recommended
                  </span>
                ) : null}
              </div>

              <p className="mt-3 text-sm leading-7 text-slate-200">
                {path.approach}
              </p>

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Where it wins
                </div>
                <p className="mt-2 text-sm leading-7 text-slate-200">
                  {path.whereItWins}
                </p>
              </div>

              <div className="mt-4 grid gap-4">
                <MiniSection title="Risks" items={path.risks} />
                <MiniSection title="Requirements" items={path.requirements} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StagePill({
  label,
  active = false,
  complete = false,
}: {
  label: string;
  active?: boolean;
  complete?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-full border px-4 py-2 text-xs uppercase tracking-[0.18em]",
        complete
          ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
          : active
          ? "border-cyan-400/20 bg-cyan-500/10 text-cyan-200"
          : "border-white/10 bg-white/5 text-slate-400",
      ].join(" ")}
    >
      {label}
    </div>
  );
}

function StoryCard({
  eyebrow,
  title,
  children,
  tone = "neutral",
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  tone?: "neutral" | "priority" | "success";
}) {
  const toneClass =
    tone === "priority"
      ? "border-cyan-400/20 bg-cyan-500/10"
      : tone === "success"
      ? "border-emerald-400/20 bg-emerald-500/10"
      : "border-white/10 bg-white/[0.04]";

  return (
    <section className={`rounded-[30px] border p-6 ${toneClass}`}>
      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
        {eyebrow}
      </div>
      <h3 className="mt-2 text-2xl font-semibold text-white">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li
          key={`${item}-${index}`}
          className="rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm leading-7 text-slate-200"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function MiniSection({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
        {title}
      </div>
      <ul className="mt-3 space-y-2">
        {items.map((item, index) => (
          <li key={`${item}-${index}`} className="text-sm leading-7 text-slate-200">
            • {item}
          </li>
        ))}
      </ul>
    </div>
  );
}