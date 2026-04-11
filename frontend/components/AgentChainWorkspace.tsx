"use client";

import { useState } from "react";
import { engageAgent } from "../lib/engageAgent";
import type {
  ChainOutputs,
  CompanyProfile,
  EngageAgentResponse,
} from "../types/intelligence";

type ExecutePayload = {
  prompt: string;
  methodology: "auto" | "prince2" | "agile";
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
    <ul className="space-y-2 text-sm leading-7 text-slate-200">
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
        <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">
          Confidence {pct(confidence)}
        </span>
      ) : null}
      {horizon ? (
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
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
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
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
    <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="text-xs uppercase tracking-[0.18em] text-cyan-300/75">
        {title}
      </div>
      <div className="mt-4 space-y-4">{children}</div>
    </article>
  );
}

function AnalyseCard({ value }: { value: AnyRecord | null | undefined }) {
  if (!value) {
    return (
      <StageShell title="Analyse">
        <div className="text-sm text-slate-400">No Analyse output returned.</div>
      </StageShell>
    );
  }

  return (
    <StageShell title="Analyse">
      <Section title="Headline">
        <div className="text-lg font-semibold text-white">
          {safeText(value.headline)}
        </div>
      </Section>

      <Section title="Key Insight">
        <p className="text-sm leading-7 text-slate-200">
          {safeText(value.key_insight)}
        </p>
      </Section>

      <div className="grid gap-4 xl:grid-cols-2">
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
        <div className="text-lg font-semibold text-white">
          {safeText(value.headline)}
        </div>
      </Section>

      <Section title="Decision Context">
        <p className="text-sm leading-7 text-slate-200">
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
  if (!value) {
    return null;
  }

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
                <div className="mt-2 text-base font-semibold text-white">
                  {safeText(view.headline)}
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-200">
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
            <div className="text-sm font-medium text-white">
              Recommended analyst:{" "}
              <span className="text-cyan-200">
                {safeText(value.analysis_selection.recommended_analyst_id)}
              </span>
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-200">
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
                      ? "border-emerald-400/25 bg-emerald-500/10"
                      : "border-white/10 bg-white/[0.03]",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-base font-semibold text-white">
                      {optionName}
                    </div>
                    {recommended ? (
                      <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
                        Recommended
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-3 text-sm leading-7 text-slate-200">
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
            <p className="mb-4 text-sm leading-7 text-slate-200">
              {safeText(value.execution_plan.objective)}
            </p>
          ) : null}

          <div className="grid gap-4">
            {executionPhases.length > 0 ? (
              executionPhases.map((phase, index) => (
                <div
                  key={phase.phase ?? phase.phase_name ?? `phase-${index}`}
                  className="rounded-2xl border border-indigo-400/15 bg-indigo-500/10 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-base font-semibold text-white">
                      {safeText(
                        phase.phase ?? phase.phase_name,
                        `Phase ${index + 1}`
                      )}
                    </div>
                    {(phase.owner || phase.timing) && (
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
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
        <div className="text-lg font-semibold text-white">
          {safeText(value.headline || value.objective)}
        </div>
        {value.objective ? (
          <p className="mt-3 text-sm leading-7 text-slate-200">
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

      if ((data as AnyRecord)?.chain_outputs) {
        setChainOutputs((data as AnyRecord).chain_outputs);
      }
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

    const methodologyLabel =
      methodology === "prince2"
        ? "PRINCE2"
        : methodology === "agile"
        ? "Agile"
        : "Hybrid / Auto-select";

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

OUTPUT MUST INCLUDE:
- Objective
- Recommended methodology
- Why that methodology fits
- Phases
- Actions per phase
- Owners
- Dependencies
- Success metrics
- Risks
- Review checkpoints

Do not be generic.
Be concrete, structured, and executive-grade.
`.trim();

    onExecute?.({
      prompt: executionPrompt,
      methodology,
    });
  }

  const data = (result ?? null) as AnyRecord | null;

  const analyseValue =
    data?.chain_outputs?.analyse ??
    data?.outputs?.analyse ??
    data?.output?.analyse ??
    (data?.output &&
    typeof data.output === "object" &&
    "headline" in data.output
      ? data.output
      : null);

  const adviseValue =
    data?.chain_outputs?.advise ??
    data?.outputs?.advise ??
    data?.output?.advise ??
    null;

  const planValue =
    data?.chain_outputs?.plan ??
    data?.outputs?.plan ??
    data?.output?.plan ??
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
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-950/90 to-cyan-950/20 p-6 shadow-2xl">
        <div className="text-xs uppercase tracking-[0.28em] text-cyan-300/70">
          Agent Chain
        </div>
        <h2 className="mt-2 text-3xl font-semibold text-white">
          Full Chain Workspace
        </h2>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300">
          Run GeoPulse through analyse, advise, and plan as one connected chain.
          This upgraded chain now supports both the classic structured chain and
          the newer multi-path strategic response layer.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
            Profile calibration{" "}
            {companyProfile?.company_name ? "active" : "limited"}
          </span>
          <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">
            Shared chain state active
          </span>
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">
            Planner methodology
          </label>
          <select
            value={methodology}
            onChange={(e) =>
              setMethodology(e.target.value as "auto" | "prince2" | "agile")
            }
            className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
          >
            <option value="auto">Auto / Hybrid</option>
            <option value="prince2">PRINCE2</option>
            <option value="agile">Agile</option>
          </select>
        </div>

        <div className="mt-6 flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe the market signal, company challenge, or opportunity..."
            className="min-h-[110px] flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
            disabled={loading}
          />
          <button
            onClick={() => void runChain()}
            disabled={loading || !input.trim()}
            className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20 disabled:opacity-50"
          >
            {loading ? "Running..." : "Run Full Chain"}
          </button>
        </div>

        {(onExecute || onSave || onReject) && result ? (
          <div className="mt-5 flex flex-wrap gap-3">
            {onExecute ? (
              <button
                onClick={handleExecute}
                className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200 transition hover:bg-emerald-500/20"
              >
                Execute
              </button>
            ) : null}

            {onSave ? (
              <button
                onClick={onSave}
                className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200 transition hover:bg-cyan-500/20"
              >
                Save for later
              </button>
            ) : null}

            {onReject ? (
              <button
                onClick={onReject}
                className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-2 text-sm text-rose-200 transition hover:bg-rose-500/20"
              >
                Reject
              </button>
            ) : null}
          </div>
        ) : null}
      </section>

      {!result ? (
        <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm text-slate-400">
          No chain result yet.
        </div>
      ) : (
        <div className="space-y-6">
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