"use client";

import BaseAgentWorkspace from "../components/intelligence/BaseAgentWorkspace";
import type {
  ChainOutputs,
  CompanyProfile,
  WorkspaceMessage,
} from "../types/intelligence";

type PlannerAgentWorkspaceProps = {
  messages: WorkspaceMessage[];
  setMessages: React.Dispatch<React.SetStateAction<WorkspaceMessage[]>>;
  chainOutputs: ChainOutputs;
  setChainOutputs: React.Dispatch<React.SetStateAction<ChainOutputs>>;
  companyProfile?: CompanyProfile | null;
  companyId?: string;
};

type AnyRecord = Record<string, any>;

type ExecutionPhase = {
  phase: string;
  owner?: string;
  timing?: string;
  actions: string[];
};

type ExecutionIntel = {
  objective: string | null;
  executionPhases: ExecutionPhase[];
  immediateActions: string[];
  dependencies: string[];
  risks: string[];
  successMetrics: string[];
  reviewCheckpoints: string[];
  confidence?: number;
  horizon?: string;
  urgency?: string | null;
  sourceMode: "structured-plan" | "execution-plan" | "hybrid" | "empty";
};

function asRecord(value: unknown): AnyRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as AnyRecord)
    : null;
}

function safeArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function safeText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function dedupeStrings(values: unknown[]): string[] {
  const seen = new Set<string>();

  return values
    .map((item) => safeText(item))
    .filter((item): item is string => Boolean(item))
    .filter((item) => {
      const key = item.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function pct(value?: number): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "N/A";
  return value > 1 ? `${Math.round(value)}%` : `${Math.round(value * 100)}%`;
}

function normalisePhase(raw: unknown, index: number): ExecutionPhase | null {
  const phase = asRecord(raw);
  if (!phase) return null;

  const phaseName =
    safeText(phase.phase) ??
    safeText(phase.phase_name) ??
    safeText(phase.name) ??
    `Phase ${index + 1}`;

  const owner = safeText(phase.owner) ?? undefined;
  const timing = safeText(phase.timing) ?? undefined;

  const actions = dedupeStrings([
    ...safeArray<string>(phase.actions),
    ...safeArray<string>(phase.steps),
    ...safeArray<string>(phase.tasks),
    ...safeArray<string>(phase.recommended_actions),
  ]);

  if (!phaseName && actions.length === 0) return null;

  return {
    phase: phaseName,
    owner,
    timing,
    actions,
  };
}

function dedupePhases(phases: Array<ExecutionPhase | null>): ExecutionPhase[] {
  const seen = new Set<string>();
  const output: ExecutionPhase[] = [];

  for (const phase of phases) {
    if (!phase) continue;

    const key = `${phase.phase.toLowerCase()}|${(phase.owner ?? "").toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);

    output.push({
      ...phase,
      actions: dedupeStrings(phase.actions),
    });
  }

  return output;
}

function extractPhaseActions(
  phases: ExecutionPhase[],
  phaseIndex: number,
  limit: number
): string[] {
  const phase = phases[phaseIndex];
  if (!phase) return [];
  return phase.actions.slice(0, limit);
}

function collectExecutionIntel(plan: unknown): ExecutionIntel {
  const value = asRecord(plan);

  if (!value) {
    return {
      objective: null,
      executionPhases: [],
      immediateActions: [],
      dependencies: [],
      risks: [],
      successMetrics: [],
      reviewCheckpoints: [],
      confidence: undefined,
      horizon: undefined,
      urgency: null,
      sourceMode: "empty",
    };
  }

  const nestedExecutionPlan = asRecord(value.execution_plan);
  const phases = dedupePhases([
    ...safeArray(value.phases).map(normalisePhase).filter(Boolean),
    ...safeArray(value.execution_phases).map(normalisePhase).filter(Boolean),
    ...safeArray(nestedExecutionPlan?.phases).map(normalisePhase).filter(Boolean),
  ]);

  const immediateActions = dedupeStrings([
    ...safeArray<string>(value.immediate_actions),
    ...safeArray<string>(value.recommended_actions),
    ...safeArray<string>(value.priority_actions),
    ...safeArray<string>(value.next_actions),
    ...safeArray<string>(value.first_steps),
    ...safeArray<string>(value.day_one_actions),
    ...safeArray<string>(value.actions),
    ...extractPhaseActions(phases, 0, 3),
  ]);

  const dependencies = dedupeStrings([
    ...safeArray<string>(value.dependencies),
    ...safeArray<string>(value.required_conditions),
    ...safeArray<string>(value.requirements),
    ...safeArray<string>(value.execution_dependencies),
  ]);

  const risks = dedupeStrings([
    ...safeArray<string>(value.risks),
    ...safeArray<string>(value.execution_risks),
    ...safeArray<string>(value.constraints),
    ...safeArray<string>(value.blockers),
    ...safeArray<string>(value.delivery_risks),
  ]);

  const successMetrics = dedupeStrings([
    ...safeArray<string>(value.success_metrics),
    ...safeArray<string>(value.metrics),
    ...safeArray<string>(value.kpis),
    ...safeArray<string>(value.outcomes),
  ]);

  const reviewCheckpoints = dedupeStrings([
    ...safeArray<string>(value.review_checkpoints),
    ...safeArray<string>(value.checkpoints),
    ...safeArray<string>(value.decision_gates),
    ...safeArray<string>(value.review_gates),
    ...safeArray<string>(value.milestones),
  ]);

  const objective =
    safeText(value.objective) ??
    safeText(value.headline) ??
    safeText(nestedExecutionPlan?.objective) ??
    safeText(value.key_insight);

  const confidence =
    typeof value.confidence === "number"
      ? value.confidence
      : typeof nestedExecutionPlan?.confidence === "number"
      ? nestedExecutionPlan.confidence
      : undefined;

  const horizon =
    safeText(value.time_horizon) ??
    safeText(value.horizon) ??
    safeText(nestedExecutionPlan?.time_horizon) ??
    safeText(nestedExecutionPlan?.horizon) ??
    undefined;

  const urgency = safeText(value.urgency) ?? null;

  const sourceMode =
    nestedExecutionPlan && phases.length > 0
      ? "hybrid"
      : nestedExecutionPlan
      ? "execution-plan"
      : phases.length > 0 || immediateActions.length > 0
      ? "structured-plan"
      : "empty";

  return {
    objective,
    executionPhases: phases,
    immediateActions,
    dependencies,
    risks,
    successMetrics,
    reviewCheckpoints,
    confidence,
    horizon,
    urgency,
    sourceMode,
  };
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
  emptyText = "No items available.",
  tone = "neutral",
}: {
  items: string[];
  emptyText?: string;
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

  const bulletTone =
    tone === "action"
      ? "text-emerald-300"
      : tone === "structure"
      ? "text-cyan-300"
      : tone === "risk"
      ? "text-amber-300"
      : "text-slate-400";

  if (items.length === 0) {
    return <div className="text-sm text-slate-400">{emptyText}</div>;
  }

  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li
          key={`${item}-${index}`}
          className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${itemTone}`}
        >
          <div className="flex gap-3">
            <span className={bulletTone}>•</span>
            <span>{item}</span>
          </div>
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
  phase: ExecutionPhase;
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
          {phase.owner ? <MetaPill accent="structure">Owner {phase.owner}</MetaPill> : null}
          {phase.timing ? (
            <MetaPill accent="structure">{phase.timing}</MetaPill>
          ) : null}
        </div>
      </div>

      <div className="mt-4">
        <BulletList
          items={phase.actions}
          tone="structure"
          emptyText="No actions defined for this phase."
        />
      </div>
    </article>
  );
}

function PlanSummaryCard({ plan }: { plan: unknown }) {
  const parsed = collectExecutionIntel(plan);

  if (
    !parsed.objective &&
    parsed.executionPhases.length === 0 &&
    parsed.immediateActions.length === 0 &&
    parsed.dependencies.length === 0 &&
    parsed.risks.length === 0 &&
    parsed.successMetrics.length === 0
  ) {
    return (
      <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm text-slate-400">
        No structured execution intelligence has been generated yet.
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[32px] border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-950/90 to-emerald-950/20 p-6 shadow-2xl">
        <div className="text-xs uppercase tracking-[0.28em] text-emerald-300/75">
          Execution Intelligence Layer
        </div>

        <div className="mt-3 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <h3 className="text-3xl font-semibold text-white">
              Planner Command Surface
            </h3>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300">
              Structured execution guidance built from GeoPulse plan output and
              shared chain state.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {parsed.confidence !== undefined ? (
              <MetaPill accent="structure">
                Execution Confidence {pct(parsed.confidence)}
              </MetaPill>
            ) : null}
            {parsed.horizon ? (
              <MetaPill accent="neutral">Horizon {parsed.horizon}</MetaPill>
            ) : null}
            {parsed.urgency ? (
              <MetaPill accent="risk">Urgency {parsed.urgency}</MetaPill>
            ) : null}
            <MetaPill accent="action">
              Source {parsed.sourceMode.replace("-", " ")}
            </MetaPill>
          </div>
        </div>
      </div>

      <SectionShell title="Objective" accent="action">
        <div className="text-2xl font-semibold text-white">
          {parsed.objective ?? "No objective returned."}
        </div>
      </SectionShell>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionShell title="Immediate Actions" accent="action">
          <BulletList
            items={parsed.immediateActions}
            tone="action"
            emptyText="No immediate actions available yet."
          />
        </SectionShell>

        <SectionShell title="Execution Metadata" accent="structure">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                Confidence
              </div>
              <div className="mt-2 text-2xl font-semibold text-white">
                {pct(parsed.confidence)}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                Horizon
              </div>
              <div className="mt-2 text-2xl font-semibold text-white">
                {parsed.horizon ?? "N/A"}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                Phases
              </div>
              <div className="mt-2 text-2xl font-semibold text-white">
                {parsed.executionPhases.length}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                Urgency
              </div>
              <div className="mt-2 text-2xl font-semibold text-white">
                {parsed.urgency ?? "Standard"}
              </div>
            </div>
          </div>
        </SectionShell>
      </div>

      <SectionShell title="Execution Phases" accent="structure">
        {parsed.executionPhases.length === 0 ? (
          <div className="text-sm text-slate-400">
            No execution phases have been defined yet.
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-3">
            {parsed.executionPhases.map((phase, index) => (
              <PhaseCard
                key={`${phase.phase}-${index}`}
                phase={phase}
                index={index}
              />
            ))}
          </div>
        )}
      </SectionShell>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionShell title="Dependencies" accent="structure">
          <BulletList
            items={parsed.dependencies}
            tone="structure"
            emptyText="No dependencies identified."
          />
        </SectionShell>

        <SectionShell title="Risks" accent="risk">
          <BulletList
            items={parsed.risks}
            tone="risk"
            emptyText="No execution risks identified."
          />
        </SectionShell>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionShell title="Success Metrics" accent="action">
          <BulletList
            items={parsed.successMetrics}
            tone="action"
            emptyText="No success metrics defined."
          />
        </SectionShell>

        <SectionShell title="Review Checkpoints" accent="structure">
          <BulletList
            items={parsed.reviewCheckpoints}
            tone="structure"
            emptyText="No review checkpoints defined."
          />
        </SectionShell>
      </div>
    </section>
  );
}

export default function PlannerAgentWorkspace(
  props: PlannerAgentWorkspaceProps
) {
  return (
    <div className="space-y-6">
      <PlanSummaryCard plan={props.chainOutputs?.plan} />

      <BaseAgentWorkspace
        {...props}
        title="Planner Workspace"
        stage="plan"
        stageLabel="Planner Agent"
      />
    </div>
  );
}