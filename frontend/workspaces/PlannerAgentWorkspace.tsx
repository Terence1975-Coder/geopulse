"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import WorkspaceMessageRenderer from "../components/intelligence/WorkspaceMessageRenderer";
import { engageAgent } from "../lib/engageAgent";
import type {
  ChainOutputs,
  CompanyProfile,
  EngageAgentResponse,
  ExecutionPlan,
  ExecutionPlanPhase,
  StructuredAgentOutput,
  WorkspaceMessage,
} from "../types/intelligence";

type PlannerExecutionRequest = {
  id: string;
  prompt: string;
  methodology?: "auto" | "prince2" | "agile" | "hybrid" | string;
  summary?: {
    methodologyLabel?: string;
    objectiveHint?: string;
  };
};

type PlannerAgentWorkspaceProps = {
  messages: WorkspaceMessage[];
  setMessages: React.Dispatch<React.SetStateAction<WorkspaceMessage[]>>;
  chainOutputs: ChainOutputs;
  setChainOutputs: React.Dispatch<React.SetStateAction<ChainOutputs>>;
  companyProfile?: CompanyProfile | null;
  companyId?: string;
  executionRequest?: PlannerExecutionRequest | null;
  clearExecutionRequest?: () => void;
};

type AnyRecord = Record<string, unknown>;
type MethodologyMode = "prince2" | "agile" | "hybrid";

function safeText(value: unknown, fallback = "Not available."): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function safeArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function toPercentLabel(value: unknown): string | null {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  return value > 1 ? `${Math.round(value)}%` : `${Math.round(value * 100)}%`;
}

function buildAssistantContent(
  data: EngageAgentResponse
): StructuredAgentOutput | Record<string, unknown> | string {
  if (data.output) return data.output;
  if (data.outputs?.plan) return data.outputs.plan;
  return "No structured planner response returned from backend.";
}

function mergeChainOutputs(
  previous: ChainOutputs,
  data: EngageAgentResponse
): ChainOutputs {
  const prev = (previous ?? {}) as AnyRecord;
  const next = ((data.chain_outputs ?? {}) as AnyRecord) || {};

  return {
    ...prev,
    ...next,
    ...(data.execution_plan ? { execution_plan: data.execution_plan } : {}),
    ...(data.strategic_paths ? { strategic_paths: data.strategic_paths } : {}),
    ...(data.strategy_decision
      ? { strategy_decision: data.strategy_decision }
      : {}),
    ...(data.analysis_selection
      ? { analysis_selection: data.analysis_selection }
      : {}),
    ...(data.interaction_hooks
      ? { interaction_hooks: data.interaction_hooks }
      : {}),
    ...(data.multi_path_output
      ? { multi_path_output: data.multi_path_output }
      : {}),
  };
}

function detectMethodology(
  plan: unknown,
  executionRequest?: PlannerExecutionRequest | null
): MethodologyMode {
  const record =
    plan && typeof plan === "object" ? (plan as AnyRecord) : ({} as AnyRecord);

  const text = [
    executionRequest?.methodology,
    executionRequest?.summary?.methodologyLabel,
    record.headline,
    record.key_insight,
    record.summary,
    record.objective,
    ...safeArray(record.reasoning_notes),
    ...safeArray(record.explanation_notes),
    ...safeArray(record.review_checkpoints),
    ...safeArray(record.milestones),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    text.includes("prince2") ||
    text.includes("stage gate") ||
    text.includes("stage-gate") ||
    text.includes("tolerance") ||
    text.includes("steering") ||
    text.includes("board review")
  ) {
    return "prince2";
  }

  if (
    text.includes("agile") ||
    text.includes("sprint") ||
    text.includes("backlog") ||
    text.includes("iteration")
  ) {
    return "agile";
  }

  return "hybrid";
}

function normalisePhase(raw: unknown, index: number): ExecutionPlanPhase {
  const item = raw && typeof raw === "object" ? (raw as AnyRecord) : {};

  return {
    phase: safeText(item.phase, `Phase ${index + 1}`),
    owner: safeText(item.owner, "Unassigned"),
    actions: safeArray(item.actions),
  };
}

function deriveExecutionPlan(
  chainOutputs: ChainOutputs,
  plan: unknown
): ExecutionPlan | null {
  const chainRecord =
    chainOutputs && typeof chainOutputs === "object"
      ? (chainOutputs as AnyRecord)
      : ({} as AnyRecord);

  const planRecord =
    plan && typeof plan === "object" ? (plan as AnyRecord) : ({} as AnyRecord);

  const multiPath =
    chainRecord.multi_path_output &&
    typeof chainRecord.multi_path_output === "object"
      ? (chainRecord.multi_path_output as AnyRecord)
      : null;

  const candidate =
    (chainRecord.execution_plan as AnyRecord | undefined) ||
    (multiPath?.execution_plan as AnyRecord | undefined) ||
    (planRecord.execution_plan as AnyRecord | undefined) ||
    (Array.isArray(planRecord.phases) ? planRecord : undefined);

  const rawPhases = Array.isArray(candidate?.phases) ? candidate?.phases : [];
  let phases = rawPhases.map(normalisePhase).filter((phase) => phase.phase);

  if (phases.length === 0) {
    const recommendedActions = safeArray(planRecord.recommended_actions);
    if (recommendedActions.length > 0) {
      phases = [
        {
          phase: "Immediate next actions",
          owner: "Planner",
          actions: recommendedActions,
        },
      ];
    }
  }

  const objective = safeText(
    candidate?.objective ?? planRecord.headline ?? planRecord.objective,
    ""
  );

  if (!objective && phases.length === 0) {
    return null;
  }

  return {
    objective: objective || "Execution plan",
    selected_path_id:
      typeof candidate?.selected_path_id === "string"
        ? candidate.selected_path_id
        : undefined,
    phases,
  };
}

function MethodologyBadge({ mode }: { mode: MethodologyMode }) {
  const config =
    mode === "prince2"
      ? {
          label: "PRINCE2 Mode",
          classes: "border-cyan-400/25 bg-cyan-500/12 text-cyan-200",
        }
      : mode === "agile"
        ? {
            label: "Agile Mode",
            classes:
              "border-emerald-400/25 bg-emerald-500/12 text-emerald-200",
          }
        : {
            label: "Hybrid Mode",
            classes: "border-amber-400/25 bg-amber-500/12 text-amber-200",
          };

  return (
    <span
      className={`rounded-full border px-3 py-1 text-[11px] font-medium ${config.classes}`}
    >
      {config.label}
    </span>
  );
}

function MetaPill({
  label,
  value,
  light = false,
}: {
  label: string;
  value: string;
  light?: boolean;
}) {
  return (
    <span
      className={
        light
          ? "rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-[11px] text-slate-700"
          : "rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-slate-300"
      }
    >
      {label}: {value}
    </span>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-md border border-slate-600 bg-[linear-gradient(180deg,#1f2937_0%,#172033_45%,#0f172a_100%)] px-4 py-2.5 text-sm font-medium text-white shadow-[0_8px_14px_rgba(0,0,0,0.26),inset_0_1px_0_rgba(255,255,255,0.05),inset_0_-1px_0_rgba(0,0,0,0.35)] transition hover:-translate-y-[1px] hover:bg-[linear-gradient(180deg,#273449_0%,#1e293b_45%,#111827_100%)] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-h-[112px] flex-col items-center justify-center rounded-lg border border-slate-500/70 bg-slate-800/60 px-4 py-4 text-center shadow-[0_10px_22px_rgba(0,0,0,0.18)]">
      <div className="text-[10px] font-medium uppercase tracking-[0.26em] text-slate-200">
        {label}
      </div>
      <div className="mt-3 text-4xl font-semibold leading-none text-white md:text-5xl">
        {value}
      </div>
    </div>
  );
}

function MetricsPod({
  phases,
  milestones,
  dependencies,
  measures,
}: {
  phases: number;
  milestones: number;
  dependencies: number;
  measures: number;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-600 bg-[linear-gradient(180deg,rgba(71,85,105,0.96)_0%,rgba(51,65,85,0.96)_100%)] p-4 shadow-[0_18px_36px_rgba(0,0,0,0.30)] md:p-5">
      <div className="mb-4 text-xs uppercase tracking-[0.22em] text-slate-100">
        Delivery Metrics
      </div>

      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="Phases" value={String(phases)} />
        <MetricCard label="Milestones" value={String(milestones)} />
        <MetricCard label="Dependencies" value={String(dependencies)} />
        <MetricCard label="Measures" value={String(measures)} />
      </div>
    </div>
  );
}

function LightPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-300 bg-white p-4 shadow-[0_14px_28px_rgba(0,0,0,0.12)] md:p-5">
      <div className="mb-4 text-lg font-semibold text-slate-950 md:text-xl">
        {title}
      </div>
      {children}
    </section>
  );
}

function LightSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-slate-200 bg-slate-50 p-4">
      <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
        {title}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function BulletList({
  items,
  emptyText = "None noted.",
}: {
  items: string[];
  emptyText?: string;
}) {
  if (items.length === 0) {
    return <div className="text-sm text-slate-500">{emptyText}</div>;
  }

  return (
    <ul className="space-y-2.5">
      {items.map((item, index) => (
        <li
          key={`${item}-${index}`}
          className="rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm leading-6 text-slate-700"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function DeliveryFlowDiagram({
  phases,
}: {
  phases: ExecutionPlanPhase[];
}) {
  if (phases.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-500">
        No structured phases returned yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex min-w-max flex-col gap-3 xl:flex-row xl:items-center">
        {phases.map((phase, index) => (
          <div
            key={`${phase.phase}-${index}`}
            className="flex flex-col items-center xl:flex-row"
          >
            <article className="w-full rounded-md border border-cyan-200 bg-cyan-50 px-4 py-4 shadow-sm xl:w-[280px]">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cyan-300 bg-white text-sm font-semibold text-slate-700">
                  {index + 1}
                </div>

                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
                    Phase {index + 1}
                  </div>
                  <div className="mt-1 text-base font-semibold leading-6 text-slate-900">
                    {phase.phase}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <MetaPill label="Owner" value={phase.owner} light={true} />
                <MetaPill
                  label="Actions"
                  value={String(phase.actions.length)}
                  light={true}
                />
              </div>
            </article>

            {index < phases.length - 1 ? (
              <div className="flex items-center justify-center py-2 xl:px-2 xl:py-0">
                <div className="h-6 w-[2px] bg-slate-300 xl:hidden" />
                <div className="hidden h-[2px] w-10 bg-slate-300 xl:block" />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function PhaseFlowText({
  phases,
}: {
  phases: ExecutionPlanPhase[];
}) {
  if (phases.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-500">
        No structured phases returned yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {phases.map((phase, index) => (
        <article
          key={`${phase.phase}-${index}`}
          className="rounded-md border border-slate-200 bg-slate-50 p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-xs font-semibold text-slate-700">
                {index + 1}
              </div>

              <div className="min-w-0">
                <div className="text-base font-semibold text-slate-900">
                  {phase.phase}
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  Owner: {phase.owner}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3">
            <BulletList
              items={phase.actions}
              emptyText="No actions in this phase."
            />
          </div>
        </article>
      ))}
    </div>
  );
}

function ExecutionHandoffCard({
  executionRequest,
}: {
  executionRequest?: PlannerExecutionRequest | null;
}) {
  const [expanded, setExpanded] = useState(false);

  if (!executionRequest) return null;

  const mode: MethodologyMode =
    executionRequest.methodology === "prince2"
      ? "prince2"
      : executionRequest.methodology === "agile"
        ? "agile"
        : "hybrid";

  const prompt = executionRequest.prompt ?? "";

  const companyMatch = prompt.match(/"company_name"\s*:\s*"([^"]+)"/i);

  const headlineMatch =
    prompt.match(/"headline"\s*:\s*"([^"]+)"/i) ||
    prompt.match(/"objective"\s*:\s*"([^"]+)"/i);

  const companyName = companyMatch?.[1] ?? "Current company profile";

    const rawObjectiveHint = executionRequest.summary?.objectiveHint ?? "";

  const objectiveHintLooksTechnical =
    rawObjectiveHint.length > 240 ||
    rawObjectiveHint.toLowerCase().includes("you are geopulse planner") ||
    rawObjectiveHint.toLowerCase().includes("company profile:") ||
    rawObjectiveHint.toLowerCase().includes("analyse output:") ||
    rawObjectiveHint.toLowerCase().includes("advise output:") ||
    rawObjectiveHint.toLowerCase().includes("output must include:");

  const executionFocus =
    !objectiveHintLooksTechnical && rawObjectiveHint.trim()
      ? rawObjectiveHint
      : headlineMatch?.[1] ||
        "Convert the current intelligence chain into a boardroom-ready execution plan.";

  return (
    <section className="rounded-md border border-cyan-400/20 bg-cyan-500/10 p-5 shadow-[0_18px_54px_rgba(0,0,0,0.24)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-cyan-200/80">
            Planner Handoff
          </div>

          <h2 className="mt-2 text-2xl font-semibold text-white">
            Structured execution brief received
          </h2>

          <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-200">
            GeoPulse has passed the Analyst and Advisor outputs into Planner.
            The planner workspace will now turn that intelligence into clear
            sequencing, ownership, dependencies, milestones, risks, review
            checkpoints, and delivery flow.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
            {companyName}
          </span>

          <MethodologyBadge mode={mode} />

          <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">
            Ready for execution shaping
          </span>
        </div>
      </div>

      <div className="mt-5 rounded-md border border-white/10 bg-slate-950/45 p-4">
        <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
          Execution focus
        </div>

        <p className="mt-2 text-sm leading-7 text-slate-200">
          {executionFocus}
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
            <div className="text-xs text-slate-400">Source</div>
            <div className="mt-1 text-sm font-medium text-white">
              Analyse + Advise chain
            </div>
          </div>

          <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
            <div className="text-xs text-slate-400">Planner output</div>
            <div className="mt-1 text-sm font-medium text-white">
              Execution-grade plan
            </div>
          </div>

          <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
            <div className="text-xs text-slate-400">Includes</div>
            <div className="mt-1 text-sm font-medium text-white">
              Owners, phases, risks, metrics
            </div>
          </div>
        </div>
      </div>

            <div className="mt-4 rounded-md border border-white/10 bg-slate-950/45 p-4">
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="text-sm font-medium text-cyan-200 transition hover:text-cyan-100"
        >
          {expanded
            ? "Hide technical planner prompt"
            : "Show technical planner prompt"}
        </button>

        {expanded ? (
          <pre className="mt-4 max-h-[320px] overflow-auto whitespace-pre-wrap rounded-md border border-white/10 bg-black/30 p-4 text-xs leading-6 text-slate-300">
            {executionRequest.prompt}
          </pre>
        ) : null}
      </div>
    </section>
  );
}

function PlanOverview({
  plan,
  chainOutputs,
  executionRequest,
}: {
  plan: unknown;
  chainOutputs: ChainOutputs;
  executionRequest?: PlannerExecutionRequest | null;
}) {
  const record =
    plan && typeof plan === "object" ? (plan as AnyRecord) : ({} as AnyRecord);

  const executionPlan = deriveExecutionPlan(chainOutputs, plan);
  const phases = executionPlan?.phases ?? [];

  const confidence = toPercentLabel(record.confidence);
  const horizon =
    typeof record.time_horizon === "string" && record.time_horizon.trim()
      ? record.time_horizon
      : null;

  const milestones = safeArray(record.milestones);
  const dependencies = safeArray(record.dependencies);
  const successMetrics = safeArray(record.success_metrics);
  const reviewCheckpoints = safeArray(record.review_checkpoints);
  const recommendedActions = safeArray(record.recommended_actions);
  const reasoningNotes = safeArray(record.reasoning_notes);
  const explanationNotes = safeArray(record.explanation_notes);

  const objective = safeText(
    executionPlan?.objective ?? record.headline ?? record.objective,
    "Execution Planning Workspace"
  );

  const summary = safeText(
    record.key_insight ?? record.summary ?? record.objective,
    executionPlan
      ? "GeoPulse has converted the selected path into a structured delivery flow."
      : "Convert advisor thinking into a structured execution plan with sequencing, ownership, checkpoints, milestones, and measurable delivery logic."
  );

  const methodology = detectMethodology(plan, executionRequest);
  const hasPlanContent =
    Boolean(executionPlan) ||
    milestones.length > 0 ||
    dependencies.length > 0 ||
    successMetrics.length > 0 ||
    reviewCheckpoints.length > 0 ||
    recommendedActions.length > 0;

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-lg border border-slate-700 bg-gradient-to-br from-slate-950 via-[#020617] to-slate-900 shadow-[0_22px_52px_rgba(0,0,0,0.34)]">
        <div className="px-5 py-6 md:px-7 md:py-7 xl:px-8 xl:py-8">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)] xl:items-start">
            <div className="min-w-0">
              <div className="text-[10px] font-medium uppercase tracking-[0.36em] text-cyan-300">
                Planner Command Surface
              </div>

              <h1 className="mt-3 max-w-5xl text-3xl font-semibold leading-[1.05] text-white md:text-4xl">
                {objective}
              </h1>

              <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-200 md:text-base">
                {summary}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <MethodologyBadge mode={methodology} />
                {confidence ? (
                  <MetaPill label="Confidence" value={confidence} />
                ) : null}
                {horizon ? <MetaPill label="Horizon" value={horizon} /> : null}
              </div>
            </div>

            <MetricsPod
              phases={phases.length}
              milestones={milestones.length}
              dependencies={dependencies.length}
              measures={successMetrics.length}
            />
          </div>
        </div>
      </section>

      {!hasPlanContent ? (
        <LightPanel title="Planner Output">
          <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
            No structured plan has been generated yet. Run the Agent Chain first
            or use Planner to create a plan.
          </div>
        </LightPanel>
      ) : (
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)] xl:items-start">
          <div className="space-y-5">
            <LightPanel title="Delivery Flow">
              <div className="space-y-5">
                <DeliveryFlowDiagram phases={phases} />
                <PhaseFlowText phases={phases} />
              </div>
            </LightPanel>

            <div className="grid gap-5 md:grid-cols-2 md:items-start">
              <LightPanel title="Milestones">
                <BulletList
                  items={milestones}
                  emptyText="No milestones returned."
                />
              </LightPanel>

              <LightPanel title="Success Metrics">
                <BulletList
                  items={successMetrics}
                  emptyText="No success metrics returned."
                />
              </LightPanel>
            </div>
          </div>

          <div className="space-y-5">
            <LightPanel title="Execution Controls">
              <div className="space-y-4">
                <LightSection title="Dependencies">
                  <BulletList
                    items={dependencies}
                    emptyText="No dependencies noted."
                  />
                </LightSection>

                <LightSection title="Review Checkpoints">
                  <BulletList
                    items={reviewCheckpoints}
                    emptyText="No review checkpoints noted."
                  />
                </LightSection>
              </div>
            </LightPanel>

            <LightPanel title="Planner Notes">
              <div className="space-y-4">
                <LightSection title="Recommended Actions">
                  <BulletList
                    items={recommendedActions}
                    emptyText="No recommended actions noted."
                  />
                </LightSection>

                <LightSection title="Reasoning">
                  <BulletList
                    items={[...reasoningNotes, ...explanationNotes]}
                    emptyText="No reasoning notes returned."
                  />
                </LightSection>
              </div>
            </LightPanel>
          </div>
        </section>
      )}
    </div>
  );
}

function PlannerConversation({
  messages,
  input,
  setInput,
  loading,
  onSend,
}: {
  messages: WorkspaceMessage[];
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  loading: boolean;
  onSend: () => Promise<void>;
}) {
  function handleKeyDown(
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ): void {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void onSend();
    }
  }

  return (
    <section className="rounded-[1.8rem] border border-slate-700 bg-[linear-gradient(180deg,rgba(71,85,105,0.96)_0%,rgba(51,65,85,0.96)_100%)] p-5 shadow-[0_18px_36px_rgba(0,0,0,0.20)]">
      <div>
        <div className="text-3xl font-semibold text-white">
          Planner Workspace
        </div>
        <div className="mt-1 text-base text-slate-300">
          Refine sequencing, challenge execution assumptions, and deepen the
          delivery logic.
        </div>
      </div>

      <div className="mt-5 rounded-[1.7rem] border border-white/10 bg-slate-900/55 p-4">
        <div className="text-xs uppercase tracking-[0.24em] text-slate-300">
          Planner Agent
        </div>

        <div className="mt-4">
          {messages.length === 0 ? (
            <div className="rounded-md border border-dashed border-white/10 bg-white/[0.02] p-5 text-sm text-slate-400">
              No planner conversation yet. Start by asking GeoPulse to refine
              the plan, tighten sequencing, assign ownership, or pressure-test
              the delivery path.
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className="rounded-md border border-white/10 bg-white/[0.03] p-3"
                >
                  <WorkspaceMessageRenderer
                    message={message}
                    stageLabel="Planner Agent"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 xl:flex-row">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Send a planner request..."
          disabled={loading}
          className="min-h-[104px] flex-1 rounded-md border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/30 focus:ring-1 focus:ring-cyan-400/20"
        />

        <div className="flex shrink-0 flex-col gap-3 xl:w-[220px]">
          <ActionButton
            onClick={() => void onSend()}
            disabled={loading || !input.trim()}
          >
            {loading ? "Thinking..." : "Engage Planner"}
          </ActionButton>

          <div className="rounded-md border border-white/10 bg-white/[0.03] px-4 py-3 text-xs leading-6 text-slate-400">
            Press Enter to send. Use Shift+Enter for a new line.
          </div>
        </div>
      </div>
    </section>
  );
}

export default function PlannerAgentWorkspace(
  props: PlannerAgentWorkspaceProps
) {
  const {
    messages,
    setMessages,
    chainOutputs,
    setChainOutputs,
    companyProfile,
    companyId,
    executionRequest,
    clearExecutionRequest,
  } = props;

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoRunning, setAutoRunning] = useState(false);
  const handledExecutionIdRef = useRef<string | null>(null);
  const [latestExecutionRequest, setLatestExecutionRequest] =
    useState<PlannerExecutionRequest | null>(null);

  const safeMessages = useMemo(
    () => (Array.isArray(messages) ? messages : []),
    [messages]
  );

  async function handleSend(textOverride?: string) {
    const text = (textOverride ?? input).trim();
    if (!text || loading) return;

    const userMessage: WorkspaceMessage | null = textOverride
      ? null
      : {
          id: crypto.randomUUID(),
          role: "user",
          timestamp: new Date().toISOString(),
          tone: "neutral",
          content: text,
        };

    if (userMessage) {
      setMessages((prev) => [
        ...(Array.isArray(prev) ? prev : []),
        userMessage,
      ]);
      setInput("");
    }

    setLoading(true);

    try {
      const data = await engageAgent({
        input: text,
        stage: "plan",
        companyProfile,
        chainOutputs,
        messages: userMessage ? [...safeMessages, userMessage] : safeMessages,
        companyId,
      });

      const assistantMessage: WorkspaceMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        timestamp: new Date().toISOString(),
        tone: "executive",
        content: buildAssistantContent(data),
      };

      setMessages((prev) => [
        ...(Array.isArray(prev) ? prev : []),
        assistantMessage,
      ]);

      setChainOutputs((prev) => mergeChainOutputs(prev, data));
    } catch (error) {
      const assistantError: WorkspaceMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        timestamp: new Date().toISOString(),
        tone: "warning",
        content:
          error instanceof Error
            ? `GeoPulse could not complete this planner request: ${error.message}`
            : "GeoPulse could not complete this planner request.",
      };

      setMessages((prev) => [
        ...(Array.isArray(prev) ? prev : []),
        assistantError,
      ]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function runExecutionRequest() {
      if (!executionRequest?.id || !executionRequest.prompt.trim()) return;
      if (handledExecutionIdRef.current === executionRequest.id) return;

      handledExecutionIdRef.current = executionRequest.id;
      setLatestExecutionRequest(executionRequest);
      setAutoRunning(true);

      try {
        await handleSend(executionRequest.prompt);
      } finally {
        setAutoRunning(false);
        clearExecutionRequest?.();
      }
    }

    void runExecutionRequest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [executionRequest, clearExecutionRequest]);

  return (
    <div className="space-y-5">
      {autoRunning ? (
        <div className="rounded-md border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-200">
          GeoPulse is converting the selected decision path into a structured
          execution plan.
        </div>
      ) : null}

      <ExecutionHandoffCard executionRequest={latestExecutionRequest} />

      <PlanOverview
        plan={chainOutputs?.plan}
        chainOutputs={chainOutputs}
        executionRequest={latestExecutionRequest}
      />

      <PlannerConversation
        messages={safeMessages}
        input={input}
        setInput={setInput}
        loading={loading}
        onSend={() => handleSend()}
      />
    </div>
  );
}
