"use client";

import { useMemo, useState } from "react";
import { engageAgent } from "../lib/engageAgent";
import type {
  ChainOutputs,
  CompanyProfile,
  EngageAgentResponse,
} from "../types/intelligence";

type ExecutePayload = {
  prompt: string;
  methodology: "auto" | "prince2" | "agile";
  summary: {
    methodologyLabel: string;
    objectiveHint: string;
  };
};

type Props = {
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  result: EngageAgentResponse | null;
  setResult: React.Dispatch<React.SetStateAction<EngageAgentResponse | null>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  companyProfile?: CompanyProfile | null;
  chainOutputs: ChainOutputs;
  setChainOutputs: React.Dispatch<React.SetStateAction<ChainOutputs>>;
  onExecute?: (payload: ExecutePayload) => void;
  onSave?: () => void;
  onReject?: () => void;
};

type AnyRecord = Record<string, any>;

function safeArray<T = any>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function safeText(value: unknown, fallback = "Not available."): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function pct(value?: number): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "N/A";
  return value > 1 ? `${Math.round(value)}%` : `${Math.round(value * 100)}%`;
}

function BulletList({ items }: { items?: string[] }) {
  const safeItems = safeArray<string>(items);

  if (safeItems.length === 0) {
    return <div className="text-sm text-slate-500">None noted.</div>;
  }

  return (
    <ul className="space-y-2 text-sm leading-7 text-slate-700">
      {safeItems.map((item, index) => (
        <li key={`${item}-${index}`} className="flex gap-2">
          <span className="text-cyan-300">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function MetaBar({
  confidence,
  horizon,
}: {
  confidence?: number;
  horizon?: string;
}) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {typeof confidence === "number" ? (
        <span className="rounded-full border border-cyan-300 bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-700">
          Confidence {pct(confidence)}
        </span>
      ) : null}
      {horizon ? (
        <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-600">
          Horizon {horizon}
        </span>
      ) : null}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-[0_6px_18px_rgba(15,23,42,0.07)]">
      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
        {title}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function StageShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-slate-300 bg-white p-6 shadow-[0_16px_38px_rgba(15,23,42,0.14)]">
      <div className="text-xs uppercase tracking-[0.18em] text-cyan-700">
        {title}
      </div>
      <div className="mt-4 space-y-4">{children}</div>
    </article>
  );
}

function MethodologyButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "rounded-xl border px-4 py-2 text-sm font-medium transition",
        active
          ? "border-cyan-400/40 bg-cyan-500 text-white shadow-[0_6px_16px_rgba(6,182,212,0.18)]"
          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function AnalyseCard({ value }: { value: AnyRecord | null | undefined }) {
  if (!value) {
    return (
      <StageShell title="Analyse">
        <div className="text-sm text-slate-900">No Analyse output returned.</div>
      </StageShell>
    );
  }

  return (
    <StageShell title="Analyse">
      <Section title="Headline">
        <div className="text-[1.95rem] font-semibold leading-tight text-slate-900">
          {safeText(value.headline)}
        </div>
      </Section>

      <Section title="Key Insight">
        <p className="text-sm leading-7 text-slate-700">
          {safeText(value.key_insight)}
        </p>
      </Section>

      <div className="grid gap-5 xl:grid-cols-2">
        <Section title="Drivers">
          <BulletList items={safeArray<string>(value.drivers)} />
        </Section>
        <Section title="Second-Order Effects">
          <BulletList items={safeArray<string>(value.second_order_effects)} />
        </Section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Section title="Implications">
          <BulletList items={safeArray<string>(value.implications)} />
        </Section>
        <Section title="Recommended Actions">
          <BulletList items={safeArray<string>(value.recommended_actions)} />
        </Section>
      </div>

      <MetaBar confidence={value.confidence} horizon={value.time_horizon} />
    </StageShell>
  );
}

function AdviseCard({ value }: { value: AnyRecord | null | undefined }) {
  if (!value) {
    return (
      <StageShell title="Advise">
        <div className="text-sm text-slate-400">No Advise output returned.</div>
      </StageShell>
    );
  }

  return (
    <StageShell title="Advise">
      <Section title="Headline">
	    <div className="text-lg font-semibold text-slate-900">
		  {safeText(value.headline)}
	    </div>
  </Section>

      <Section title="Decision Context">
        <p className="text-base leading-8 text-slate-700">
          {safeText(value.decision_context || value.key_insight)}
        </p>
      </Section>

      <div className="grid gap-4 xl:grid-cols-2">
        <Section title="Tradeoffs">
          <BulletList items={safeArray<string>(value.tradeoffs)} />
        </Section>
        <Section title="Recommended Actions">
          <BulletList items={safeArray<string>(value.recommended_actions)} />
        </Section>
      </div>

      <MetaBar confidence={value.confidence} horizon={value.time_horizon} />
    </StageShell>
  );
}

function MultiPathCard({ value }: { value: AnyRecord | null | undefined }) {
  if (!value) return null;

  const analystViews = safeArray<AnyRecord>(value.analyst_views);
  const strategicPaths = safeArray<AnyRecord>(
    value.strategic_paths ?? value.strategic_options
  );
  const executionPhases = safeArray<AnyRecord>(
    value.execution_plan?.phases ?? value.execution_phases
  );
  const selectedPathId =
    value.strategy_decision?.selected_path_id ?? value.recommended_option;

  return (
    <StageShell title="Strategic Paths">
      {analystViews.length > 0 ? (
        <Section title="Analyst Views">
          <div className="grid gap-4 xl:grid-cols-3">
            {analystViews.map((view, index) => (
              <div
                key={view.id ?? `analyst-${index}`}
                className="rounded-2xl border border-cyan-400/15 bg-cyan-500/10 p-4"
              >
                <div className="text-xs uppercase tracking-[0.16em] text-cyan-200/80">
                  {safeText(view.lens, `Lens ${index + 1}`)}
                </div>
                <div className="mt-2 text-base font-semibold text-slate-900">
                  {safeText(view.headline)}
                </div>
                <p className="mt-3 text-base leading-7 text-slate-700">
                  {safeText(view.key_insight)}
                </p>
                <MetaBar confidence={view.confidence} />
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {value.analysis_selection ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <Section title="Analysis Selection">
            <div className="text-sm font-semibold text-slate-900">
              Recommended analyst:{" "}
              <span className="text-cyan-700">
                {safeText(value.analysis_selection.recommended_analyst_id)}
              </span>
            </div>
            <p className="mt-3 text-base leading-7 text-slate-700">
              {safeText(value.analysis_selection.reason)}
            </p>
          </Section>

          <Section title="Selection Tradeoffs">
            <BulletList
              items={safeArray<string>(value.analysis_selection.tradeoffs)}
            />
          </Section>
        </div>
      ) : null}

      <Section title="Strategic Options">
        <div className="grid gap-4">
          {strategicPaths.length > 0 ? (
            strategicPaths.map((option, index) => {
              const optionId =
                option.id ?? option.option_id ?? `option-${index}`;
              const optionName = safeText(
                option.name ?? option.option_name ?? option.title,
                `Option ${index + 1}`
              );
              const recommended =
                optionId === selectedPathId || optionName === selectedPathId;

              return (
                <div
                  key={optionId}
                  className={[
                    "rounded-2xl border p-4",
                    recommended
                      ? "border-emerald-300 bg-emerald-50 shadow-[0_6px_18px_rgba(16,185,129,0.10)]"
                      : "border-slate-300 bg-white shadow-[0_6px_18px_rgba(15,23,42,0.06)]",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-lg font-semibold text-slate-900">
                      {optionName}
                    </div>
                    {recommended ? (
                      <span className="rounded-full border border-emerald-300 bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
                        Recommended
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-3 text-base leading-7 text-slate-700">
                    {safeText(option.approach ?? option.summary)}
                  </p>

                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <Section title="Risks">
                      <BulletList items={safeArray<string>(option.risks)} />
                    </Section>
                    <Section title="Requirements">
                      <BulletList
                        items={safeArray<string>(
                          option.requirements ?? option.required_conditions
                        )}
                      />
                    </Section>
                  </div>

                  <MetaBar
                    confidence={option.confidence}
                    horizon={option.time_horizon}
                  />
                </div>
              );
            })
          ) : (
            <div className="text-sm text-slate-400">
              No strategic paths returned.
            </div>
          )}
        </div>
      </Section>

      {value.execution_plan ? (
        <Section title="Execution Plan">
          {value.execution_plan.objective ? (
            <p className="mb-4 text-base leading-7 text-slate-700">
              {safeText(value.execution_plan.objective)}
            </p>
          ) : null}

          <div className="grid gap-4">
            {executionPhases.length > 0 ? (
              executionPhases.map((phase, index) => (
                <div
                  key={phase.phase ?? phase.phase_name ?? `phase-${index}`}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-[0_6px_18px_rgba(15,23,42,0.07)]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-lg font-semibold text-slate-900">
                      {safeText(
                        phase.phase ?? phase.phase_name,
                        `Phase ${index + 1}`
                      )}
                    </div>
                    {(phase.owner || phase.timing) && (
                      <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-600">
                        {phase.owner ?? phase.timing}
                      </span>
                    )}
                  </div>

                  <div className="mt-4">
                    <BulletList items={safeArray<string>(phase.actions)} />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-400">
                No execution phases returned.
              </div>
            )}
          </div>
        </Section>
      ) : null}
    </StageShell>
  );
}

function PlanCard({ value }: { value: AnyRecord | null | undefined }) {
  if (!value) {
    return (
      <StageShell title="Plan">
        <div className="text-sm text-slate-400">No Plan output returned.</div>
      </StageShell>
    );
  }

  return (
    <StageShell title="Plan">
      <Section title="Objective">
        <div className="text-[1.7rem] font-semibold leading-tight text-slate-900">
          {safeText(value.headline || value.objective)}
        </div>
        {value.objective ? (
          <p className="mt-3 text-base leading-7 text-slate-700">
            {safeText(value.objective)}
          </p>
        ) : null}
      </Section>

      <div className="grid gap-4 xl:grid-cols-2">
        <Section title="Dependencies">
          <BulletList items={safeArray<string>(value.dependencies)} />
        </Section>
        <Section title="Milestones">
          <BulletList items={safeArray<string>(value.milestones)} />
        </Section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Section title="Success Metrics">
          <BulletList items={safeArray<string>(value.success_metrics)} />
        </Section>
        <Section title="Review Checkpoints">
          <BulletList items={safeArray<string>(value.review_checkpoints)} />
        </Section>
      </div>

      <MetaBar confidence={value.confidence} horizon={value.time_horizon} />
    </StageShell>
  );
}

export default function AgentChainWorkspace({
  input,
  setInput,
  result,
  setResult,
  loading,
  setLoading,
  companyProfile,
  chainOutputs,
  setChainOutputs,
  onExecute,
  onSave,
  onReject,
}: Props) {
  const [methodology, setMethodology] = useState<"auto" | "prince2" | "agile">(
    "auto"
  );

  const methodologyLabel = useMemo(() => {
    if (methodology === "prince2") return "PRINCE2";
    if (methodology === "agile") return "Agile";
    return "Hybrid";
  }, [methodology]);

  async function runChain() {
    const text = input.trim();
    if (!text || loading) return;

    setLoading(true);

    try {
      const data = await engageAgent({
        input: text,
        stage: "full_chain",
        companyProfile,
        chainOutputs,
        messages: [],
      });

      setResult(data as EngageAgentResponse);

      const responseRecord = data as AnyRecord;

      setChainOutputs((prev) => ({
        ...((prev ?? {}) as AnyRecord),
        ...((responseRecord?.chain_outputs ?? {}) as AnyRecord),
        ...(responseRecord?.execution_plan
          ? { execution_plan: responseRecord.execution_plan }
          : {}),
        ...(responseRecord?.strategic_paths
          ? { strategic_paths: responseRecord.strategic_paths }
          : {}),
        ...(responseRecord?.strategy_decision
          ? { strategy_decision: responseRecord.strategy_decision }
          : {}),
        ...(responseRecord?.analysis_selection
          ? { analysis_selection: responseRecord.analysis_selection }
          : {}),
        ...(responseRecord?.interaction_hooks
          ? { interaction_hooks: responseRecord.interaction_hooks }
          : {}),
        ...(responseRecord?.multi_path_output
          ? { multi_path_output: responseRecord.multi_path_output }
          : {}),
      }));
    } catch (error) {
      setResult({
        output: {
          headline: "Chain execution failed",
          key_insight:
            error instanceof Error
              ? `GeoPulse could not complete chain execution: ${error.message}`
              : "GeoPulse could not complete chain execution.",
          recommended_actions: [
            "Check backend is running",
            "Verify API endpoint configuration",
            "Retry the request",
          ],
          confidence: 0,
          time_horizon: "short",
        },
      } as EngageAgentResponse);
    } finally {
      setLoading(false);
    }
  }

  function handleExecute() {
    if (!chainOutputs?.analyse || !chainOutputs?.advise) return;

    const objectiveHint =
      (chainOutputs.advise as AnyRecord)?.headline ||
      (chainOutputs.analyse as AnyRecord)?.headline ||
      "Execution plan requested";

    const executionPrompt = `
You are GeoPulse Planner.

Convert the following intelligence into a BOARDROOM-READY EXECUTION PLAN.

COMPANY PROFILE:
${JSON.stringify(companyProfile ?? {}, null, 2)}

ANALYSE OUTPUT:
${JSON.stringify(chainOutputs.analyse, null, 2)}

ADVISE OUTPUT:
${JSON.stringify(chainOutputs.advise, null, 2)}

PLANNING PREFERENCE:
Preferred methodology: ${methodologyLabel}

INSTRUCTIONS:
- Build a comprehensive execution-grade plan.
- Choose the best-fit delivery structure:
  - PRINCE2 for governance, control, risk, and formal stage management
  - Agile for iteration, speed, and evolving requirements
  - Hybrid when both governance and adaptability are required
- Translate strategy into action.
- Make the output boardroom-ready, practical, and measurable.
- Explicitly state why the chosen methodology fits.
- Include governance or review cadence.
- Include a next-7-days view.

OUTPUT MUST INCLUDE:
- Objective
- Recommended methodology
- Why that methodology fits
- Phases
- Actions per phase
- Owners
- Dependencies
- Milestones
- Success metrics
- Risks
- Review checkpoints

Do not be generic.
Be concrete, structured, and executive-grade.
`.trim();

    onExecute?.({
      prompt: executionPrompt,
      methodology,
      summary: {
        methodologyLabel,
        objectiveHint,
      },
    });
  }

  const data = (result ?? null) as AnyRecord | null;

  const analyseValue =
    chainOutputs?.analyse ??
    data?.chain_outputs?.analyse ??
    data?.outputs?.analyse ??
    null;

  const adviseValue =
    chainOutputs?.advise ??
    data?.chain_outputs?.advise ??
    data?.outputs?.advise ??
    null;

  const planValue =
    chainOutputs?.plan ??
    data?.chain_outputs?.plan ??
    data?.outputs?.plan ??
    null;

  const multiPathValue =
    data?.multi_path_output ??
    (data?.analyst_views ||
    data?.analysis_selection ||
    data?.strategic_paths ||
    data?.strategy_decision ||
    data?.execution_plan
      ? {
          analyst_views: data?.analyst_views,
          analysis_selection: data?.analysis_selection,
          strategic_paths: data?.strategic_paths,
          strategy_decision: data?.strategy_decision,
          execution_plan: data?.execution_plan,
          interaction_hooks: data?.interaction_hooks,
        }
      : null);

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900/95 via-slate-950/95 to-cyan-950/25 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.38)]">
        <div className="text-xs uppercase tracking-[0.28em] text-cyan-300/70">
          Agent Chain
        </div>
        <h2 className="mt-2 text-3xl font-semibold text-white">
          Full Chain Workspace
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
          Run GeoPulse through analyse, advise, and plan as one connected chain.
          This upgraded chain now supports both the classic structured chain and
          the newer multi-path strategic response layer.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-600">
            Profile calibration{" "}
            {companyProfile?.company_name ? "active" : "limited"}
          </span>
          <span className="rounded-full border border-cyan-300 bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-700 shadow-[0_4px_12px_rgba(6,182,212,0.18)]">
            Shared chain state active
          </span>
        </div>

        <div className="mt-5">
          <div className="mb-3 text-xs uppercase tracking-[0.18em] text-slate-400">
            Planner delivery mode
          </div>
          <div className="flex flex-wrap gap-3">
            <MethodologyButton
              active={methodology === "auto"}
              label="Hybrid"
              onClick={() => setMethodology("auto")}
            />
            <MethodologyButton
              active={methodology === "prince2"}
              label="PRINCE2"
              onClick={() => setMethodology("prince2")}
            />
            <MethodologyButton
              active={methodology === "agile"}
              label="Agile"
              onClick={() => setMethodology("agile")}
            />
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe the market signal, company challenge, or opportunity..."
            className="min-h-[80px] flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-[0_4px_14px_rgba(15,23,42,0.08)] outline-none placeholder:text-slate-400"
            disabled={loading}
          />
          <button
            onClick={() => void runChain()}
            disabled={loading || !input.trim()}
            className="rounded-xl border border-cyan-400/30 bg-cyan-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-cyan-400 disabled:opacity-50"
          >
            {loading ? "Running..." : "Run Full Chain"}
          </button>
        </div>

        {(onExecute || onSave || onReject) && result ? (
          <div className="mt-5 flex flex-wrap gap-3">
            {onExecute ? (
              <button
                onClick={handleExecute}
                className="rounded-xl border border-emerald-400/30 bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-[0_6px_16px_rgba(16,185,129,0.18)] transition hover:bg-emerald-500/25"
              >
                Execute with {methodologyLabel}
              </button>
            ) : null}

            {onSave ? (
              <button
                onClick={onSave}
                className="rounded-xl border border-cyan-400/30 bg-white px-4 py-2 text-sm font-medium text-cyan-700 transition hover:bg-cyan-50"
              >
                Save for later
              </button>
            ) : null}

            {onReject ? (
              <button
                onClick={onReject}
                className="rounded-xl border border-rose-300 bg-white px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50"
              >
                Reject
              </button>
            ) : null}
          </div>
        ) : null}
      </section>

      {!result ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600 shadow-[0_4px_14px_rgba(15,23,42,0.05)]">
          No chain result yet.
        </div>
      ) : (
        <div className="space-y-5">
         <AnalyseCard value={analyseValue} />
          {multiPathValue ? (
            <MultiPathCard value={multiPathValue} />
          ) : (
            <AdviseCard value={adviseValue} />
          )}
          <PlanCard value={planValue} />
        </div>
      )}
    </div>
  );
}
