"use client";

import { useEffect, useRef, useState } from "react";
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

function buildAssistantContent(
  data: EngageAgentResponse
): StructuredAgentOutput | Record<string, unknown> | string {
  if (data.output) return data.output;
  if (data.outputs && data.outputs["plan"]) return data.outputs["plan"];
  return "No structured planner response returned from backend.";
}

function PlanSummaryCard({ plan }: { plan: unknown }) {
  const parsed = extractPlanShape(plan);

  if (!parsed.objective && parsed.phases.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm text-slate-400">
        No structured plan has been generated yet.
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-6">
        <div className="text-xs uppercase tracking-[0.2em] text-emerald-200/80">
          Structured Execution Plan
        </div>
        <h3 className="mt-3 text-2xl font-semibold text-white">Objective</h3>
        <p className="mt-3 text-sm leading-7 text-slate-100">
          {parsed.objective ?? "No objective returned."}
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {parsed.phases.map((phase, index) => (
          <article
            key={`${phase.phase}-${index}`}
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
          >
            <div className="text-xs uppercase tracking-[0.18em] text-cyan-300/75">
              {phase.phase}
            </div>

            {phase.owner ? (
              <div className="mt-2 text-sm text-slate-400">
                Owner: {phase.owner}
              </div>
            ) : null}

            <ul className="mt-4 space-y-3">
              {phase.actions.map((action, actionIndex) => (
                <li
                  key={`${phase.phase}-action-${actionIndex}`}
                  className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm leading-6 text-slate-200"
                >
                  {action}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
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
            {executionRequest.summary?.objectiveHint ?? "Execution brief sent to Planner"}
          </div>
          <div className="mt-2 text-sm text-slate-200">
            Methodology preference:{" "}
            <span className="font-medium text-cyan-100">
              {executionRequest.summary?.methodologyLabel ??
                executionRequest.methodology.toUpperCase()}
            </span>
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