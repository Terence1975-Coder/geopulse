"use client";

import { useEffect } from "react";
import BaseAgentWorkspace from "../components/intelligence/BaseAgentWorkspace";
import { extractPlanShape } from "../lib/responseParser";
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

export default function PlannerAgentWorkspace(
  props: PlannerAgentWorkspaceProps
) {
  const { chainOutputs, messages, setMessages } = props;

  useEffect(() => {
    if (
      !chainOutputs?.analyse ||
      !chainOutputs?.advise ||
      chainOutputs?.plan ||
      messages.length > 0
    ) {
      return;
    }

    const executionPrompt = `
You are GeoPulse Planner.

Convert the following intelligence into a BOARDROOM-READY EXECUTION PLAN.

Analyse:
${JSON.stringify(chainOutputs.analyse, null, 2)}

Advise:
${JSON.stringify(chainOutputs.advise, null, 2)}

INSTRUCTIONS:
- Select methodology (PRINCE2 / Agile / Hybrid)
- Build structured plan

OUTPUT:
- Objective
- Methodology
- Phases
- Actions
- Owners
- Metrics
- Risks
- Review checkpoints

No generic output.
`;

    setMessages([
      {
        id: crypto.randomUUID(),
        role: "user",
        content: executionPrompt,
        timestamp: new Date().toISOString(),
      },
    ]);
  }, [chainOutputs, messages, setMessages]);

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