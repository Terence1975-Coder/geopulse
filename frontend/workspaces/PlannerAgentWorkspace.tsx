"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import BaseAgentWorkspace from "../components/intelligence/BaseAgentWorkspace";
import { engageAgent } from "../lib/engageAgent";
import { extractPlanShape } from "../lib/responseParser";
import type {
  ChainOutputs,
  CompanyProfile,
  EngageAgentResponse,
  StructuredAgentOutput,
  WorkspaceMessage,
} from "../types/intelligence";

type PlannerExecutionRequest = {
  id: string;
  prompt: string;
  methodology: "auto" | "prince2" | "agile";
  summary?: {
    methodologyLabel: string;
    objectiveHint: string;
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

function buildAssistantContent(
  data: EngageAgentResponse
): StructuredAgentOutput | Record<string, unknown> | string {
  if (data.output) return data.output;
  if (data.outputs && data.outputs["plan"]) return data.outputs["plan"];
  return "No structured planner response returned from backend.";
}

function safeText(value: unknown, fallback = "Not available."): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function safeArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function detectMethodology(
  plan: unknown,
  executionRequest?: PlannerExecutionRequest | null
): MethodologyMode {
  const record = (plan && typeof plan === "object" ? (plan as AnyRecord) : {}) ?? {};
  const textPool = [
    executionRequest?.summary?.methodologyLabel,
    executionRequest?.methodology,
    record.headline,
    record.key_insight,
    record.summary,
    record.decision_context,
    ...(safeArray(record.reasoning_notes) || []),
    ...(safeArray(record.explanation_notes) || []),
    ...(safeArray(record.review_checkpoints) || []),
    ...(safeArray(record.milestones) || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    textPool.includes("prince2") ||
    textPool.includes("stage gate") ||
    textPool.includes("tolerance") ||
    textPool.includes("steering")
  ) {
    return "prince2";
  }

  if (
    textPool.includes("agile") ||
    textPool.includes("sprint") ||
    textPool.includes("backlog") ||
    textPool.includes("iteration")
  ) {
    return "agile";
  }

  return "hybrid";
}

function ModeBadge({ mode }: { mode: MethodologyMode }) {
  const copy =
    mode === "prince2"
      ? {
          label: "PRINCE2 Mode",
          classes: "border-indigo-400/25 bg-indigo-500/10 text-indigo-200",
        }
      : mode === "agile"
      ? {
          label: "Agile Mode",
          classes: "border-emerald-400/25 bg-emerald-500/10 text-emerald-200",
        }
      : {
          label: "Hybrid Mode",
          classes: "border-cyan-400/25 bg-cyan-500/10 text-cyan-200",
        };

  return (
    <span className={`rounded-full border px-3 py-1 text-xs ${copy.classes}`}>
      {copy.label}
    </span>
  );
}

function Section({
  title,
  children,
  accent = "neutral",
}: {
  title: string;
  children: React.ReactNode;
  accent?: "neutral" | "prince2" | "agile" | "hybrid";
}) {
  const accentClasses =
    accent === "prince2"
      ? "border-indigo-400/20 bg-indigo-500/10"
      : accent === "agile"
      ? "border-emerald-400/20 bg-emerald-500/10"
      : accent === "hybrid"
      ? "border-cyan-400/20 bg-cyan-500/10"
      : "border-white/10 bg-white/[0.03]";

  return (
    <section className={`rounded-2xl border p-4 ${accentClasses}`}>
      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
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
  items?: string[];
  emptyText?: string;
}) {
  if (!items || items.length === 0) {
    return <div className="text-sm text-slate-500">{emptyText}</div>;
  }

  return (
    <ul className="space-y-2 text-sm leading-7 text-slate-200">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="flex gap-2">
          <span className="text-cyan-300">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ExecutionBriefCard({
  executionRequest,
}: {
  executionRequest?: PlannerExecutionRequest | null;
}) {
  const [expanded, setExpanded] = useState(false);

  if (!executionRequest) return null;

  return (
    <section className="rounded-3xl border border-cyan-400/20 bg-cyan-500/10 p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-cyan-200/80">
            Execution Handoff
          </div>
          <div className="mt-2 text-lg font-semibold text-white">
            {executionRequest.summary?.objectiveHint ??
              "Execution brief sent to Planner"}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <ModeBadge
              mode={
                executionRequest.methodology === "prince2"
                  ? "prince2"
                  : executionRequest.methodology === "agile"
                  ? "agile"
                  : "hybrid"
              }
            />
          </div>
        </div>

        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
        >
          {expanded ? "Hide execution brief" : "Show execution brief"}
        </button>
      </div>

      {expanded ? (
        <pre className="mt-4 overflow-auto rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-xs leading-6 text-slate-300 whitespace-pre-wrap">
          {executionRequest.prompt}
        </pre>
      ) : null}
    </section>
  );
}

function Prince2PlanLayout({
  plan,
  parsed,
}: {
  plan: AnyRecord;
  parsed: ReturnType<typeof extractPlanShape>;
}) {
  const dependencies = safeArray(plan.dependencies);
  const milestones = safeArray(plan.milestones);
  const successMetrics = safeArray(plan.success_metrics);
  const reviewCheckpoints = safeArray(plan.review_checkpoints);
  const recommendedActions = safeArray(plan.recommended_actions);
  const tradeoffs = safeArray(plan.tradeoffs);
  const reasoningNotes = safeArray(plan.reasoning_notes);
  const explanationNotes = safeArray(plan.explanation_notes);

  return (
    <section className="space-y-4">
      <Section title="Delivery Framing" accent="prince2">
        <div className="flex flex-wrap items-center gap-3">
          <ModeBadge mode="prince2" />
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
            Stage-based governance
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
            Control and review gates
          </span>
        </div>
        <p className="mt-4 text-sm leading-7 text-slate-200">
          {safeText(
            plan.key_insight ??
              plan.decision_context ??
              parsed.objective,
            "No planning summary returned."
          )}
        </p>
      </Section>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Section title="Stages" accent="prince2">
          <div className="space-y-4">
            {parsed.phases.length > 0 ? (
              parsed.phases.map((phase, index) => (
                <div
                  key={`${phase.phase}-${index}`}
                  className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-base font-semibold text-white">
                      {phase.phase}
                    </div>
                    {phase.owner ? (
                      <span className="rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-200">
                        {phase.owner}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-4">
                    <BulletList items={phase.actions} />
                  </div>
                </div>
              ))
            ) : (
              <BulletList items={recommendedActions} />
            )}
          </div>
        </Section>

        <div className="space-y-4">
          <Section title="Governance & Controls" accent="prince2">
            <BulletList
              items={[
                ...reviewCheckpoints,
                ...reasoningNotes,
              ]}
              emptyText="No governance checkpoints returned."
            />
          </Section>

          <Section title="Dependencies" accent="prince2">
            <BulletList items={dependencies} />
          </Section>

          <Section title="Milestone Gates" accent="prince2">
            <BulletList items={milestones} />
          </Section>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Section title="Success Measures" accent="prince2">
          <BulletList items={successMetrics} />
        </Section>
        <Section title="Risks / Assumptions" accent="prince2">
          <BulletList items={[...tradeoffs, ...explanationNotes]} />
        </Section>
      </div>
    </section>
  );
}

function AgilePlanLayout({
  plan,
  parsed,
}: {
  plan: AnyRecord;
  parsed: ReturnType<typeof extractPlanShape>;
}) {
  const dependencies = safeArray(plan.dependencies);
  const milestones = safeArray(plan.milestones);
  const successMetrics = safeArray(plan.success_metrics);
  const reviewCheckpoints = safeArray(plan.review_checkpoints);
  const recommendedActions = safeArray(plan.recommended_actions);
  const reasoningNotes = safeArray(plan.reasoning_notes);
  const explanationNotes = safeArray(plan.explanation_notes);

  const sprintColumns =
    parsed.phases.length > 0
      ? parsed.phases
      : [
          {
            phase: "Sprint 1 / Initial Iteration",
            owner: "Product / Delivery Lead",
            actions: recommendedActions,
          },
        ];

  return (
    <section className="space-y-4">
      <Section title="Delivery Framing" accent="agile">
        <div className="flex flex-wrap items-center gap-3">
          <ModeBadge mode="agile" />
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
            Iterative execution
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
            Sprint / review cadence
          </span>
        </div>
        <p className="mt-4 text-sm leading-7 text-slate-200">
          {safeText(
            plan.key_insight ??
              plan.decision_context ??
              parsed.objective,
            "No planning summary returned."
          )}
        </p>
      </Section>

      <Section title="Iteration Plan" accent="agile">
        <div className="grid gap-4 xl:grid-cols-3">
          {sprintColumns.map((phase, index) => (
            <article
              key={`${phase.phase}-${index}`}
              className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"
            >
              <div className="text-sm font-semibold text-white">{phase.phase}</div>
              {phase.owner ? (
                <div className="mt-2 text-xs uppercase tracking-[0.14em] text-emerald-200/80">
                  {phase.owner}
                </div>
              ) : null}
              <div className="mt-4">
                <BulletList items={phase.actions} />
              </div>
            </article>
          ))}
        </div>
      </Section>

      <div className="grid gap-4 xl:grid-cols-2">
        <Section title="Backlog / Next Up" accent="agile">
          <BulletList items={recommendedActions} />
        </Section>
        <Section title="Review Cadence" accent="agile">
          <BulletList
            items={[...reviewCheckpoints, ...reasoningNotes]}
            emptyText="No iteration review cadence returned."
          />
        </Section>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Section title="Dependencies" accent="agile">
          <BulletList items={dependencies} />
        </Section>
        <Section title="Sprint Outcomes" accent="agile">
          <BulletList items={milestones} />
        </Section>
        <Section title="Success Metrics" accent="agile">
          <BulletList items={successMetrics} />
        </Section>
      </div>

      <Section title="Risks / Adaptation Notes" accent="agile">
        <BulletList items={explanationNotes} />
      </Section>
    </section>
  );
}

function HybridPlanLayout({
  plan,
  parsed,
}: {
  plan: AnyRecord;
  parsed: ReturnType<typeof extractPlanShape>;
}) {
  const dependencies = safeArray(plan.dependencies);
  const milestones = safeArray(plan.milestones);
  const successMetrics = safeArray(plan.success_metrics);
  const reviewCheckpoints = safeArray(plan.review_checkpoints);
  const recommendedActions = safeArray(plan.recommended_actions);
  const tradeoffs = safeArray(plan.tradeoffs);
  const reasoningNotes = safeArray(plan.reasoning_notes);
  const explanationNotes = safeArray(plan.explanation_notes);

  return (
    <section className="space-y-4">
      <Section title="Delivery Framing" accent="hybrid">
        <div className="flex flex-wrap items-center gap-3">
          <ModeBadge mode="hybrid" />
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
            Governance + iterative delivery
          </span>
        </div>
        <p className="mt-4 text-sm leading-7 text-slate-200">
          {safeText(
            plan.key_insight ??
              plan.decision_context ??
              parsed.objective,
            "No planning summary returned."
          )}
        </p>
      </Section>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Section title="Control Layer" accent="hybrid">
          <BulletList
            items={[...reviewCheckpoints, ...dependencies, ...tradeoffs]}
            emptyText="No control layer items returned."
          />
        </Section>

        <Section title="Delivery Flow" accent="hybrid">
          <div className="space-y-4">
            {parsed.phases.length > 0 ? (
              parsed.phases.map((phase, index) => (
                <div
                  key={`${phase.phase}-${index}`}
                  className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-base font-semibold text-white">
                      {phase.phase}
                    </div>
                    {phase.owner ? (
                      <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">
                        {phase.owner}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-4">
                    <BulletList items={phase.actions} />
                  </div>
                </div>
              ))
            ) : (
              <BulletList items={recommendedActions} />
            )}
          </div>
        </Section>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Section title="Milestones" accent="hybrid">
          <BulletList items={milestones} />
        </Section>
        <Section title="Success Metrics" accent="hybrid">
          <BulletList items={successMetrics} />
        </Section>
        <Section title="Execution Notes" accent="hybrid">
          <BulletList items={[...reasoningNotes, ...explanationNotes]} />
        </Section>
      </div>
    </section>
  );
}

function PlanSummaryCard({
  plan,
  executionRequest,
}: {
  plan: unknown;
  executionRequest?: PlannerExecutionRequest | null;
}) {
  const parsed = extractPlanShape(plan);
  const record = (plan && typeof plan === "object" ? (plan as AnyRecord) : {}) ?? {};
  const methodology = detectMethodology(plan, executionRequest);

  if (!parsed.objective && parsed.phases.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm text-slate-400">
        No structured plan has been generated yet.
      </div>
    );
  }

  return (
    <section className="space-y-5">
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Professional Execution Plan
            </div>
            <h3 className="mt-3 text-2xl font-semibold text-white">
              {parsed.objective || safeText(record.headline, "Execution Objective")}
            </h3>
            <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-300">
              {safeText(
                record.key_insight ??
                  record.decision_context ??
                  record.summary,
                "No executive planning summary returned."
              )}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <ModeBadge mode={methodology} />
            {typeof record.confidence === "number" ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                Confidence{" "}
                {record.confidence > 1
                  ? `${Math.round(record.confidence)}%`
                  : `${Math.round(record.confidence * 100)}%`}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {methodology === "prince2" ? (
        <Prince2PlanLayout plan={record} parsed={parsed} />
      ) : methodology === "agile" ? (
        <AgilePlanLayout plan={record} parsed={parsed} />
      ) : (
        <HybridPlanLayout plan={record} parsed={parsed} />
      )}
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

  const [autoRunning, setAutoRunning] = useState(false);
  const handledRequestId = useRef<string | null>(null);
  const [latestExecutionBrief, setLatestExecutionBrief] =
    useState<PlannerExecutionRequest | null>(null);

  useEffect(() => {
    async function runExecutionRequest() {
      if (!executionRequest?.id || !executionRequest.prompt.trim()) return;
      if (handledRequestId.current === executionRequest.id) return;

      handledRequestId.current = executionRequest.id;
      setLatestExecutionBrief(executionRequest);
      setAutoRunning(true);

      try {
        const data = await engageAgent({
          input: executionRequest.prompt,
          stage: "plan",
          companyProfile,
          chainOutputs,
          messages,
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

        if (data?.chain_outputs) {
          setChainOutputs(data.chain_outputs);
        }
      } catch (error) {
        const assistantError: WorkspaceMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          timestamp: new Date().toISOString(),
          tone: "warning",
          content:
            error instanceof Error
              ? `GeoPulse could not complete planner execution: ${error.message}`
              : "GeoPulse could not complete planner execution.",
        };

        setMessages((prev) => [
          ...(Array.isArray(prev) ? prev : []),
          assistantError,
        ]);
      } finally {
        setAutoRunning(false);
        clearExecutionRequest?.();
      }
    }

    void runExecutionRequest();
  }, [
    executionRequest,
    companyProfile,
    chainOutputs,
    messages,
    companyId,
    setMessages,
    setChainOutputs,
    clearExecutionRequest,
  ]);

  return (
    <div className="space-y-6">
      {autoRunning ? (
        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4 text-sm text-cyan-100">
          GeoPulse is converting the selected chain output into a professional
          execution-grade planner response.
        </div>
      ) : null}

      <ExecutionBriefCard executionRequest={latestExecutionBrief} />

      <PlanSummaryCard
        plan={props.chainOutputs?.plan}
        executionRequest={latestExecutionBrief}
      />

      <BaseAgentWorkspace
        {...props}
        title="Planner Workspace"
        stage="plan"
        stageLabel="Planner Agent"
      />
    </div>
  );
}