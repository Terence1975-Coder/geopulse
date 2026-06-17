"use client";

import { useMemo, useState } from "react";
import { engageAgent } from "../lib/engageAgent";
import type {
  ChainOutputs,
  CompanyProfile,
  EngageAgentResponse,
} from "../types/intelligence";
import {
  createDecisionCandidate,
  createExecutionFromDecision,
  type V9DecisionRecord,
  type V9ExecutionRecord,
} from "../lib/v9Intelligence";

type ExecutePayload = {
  prompt: string;
  methodology: "auto" | "prince2" | "agile" | "hybrid";
  summary: {
    methodologyLabel: string;
    objectiveHint: string;
  };
};

type ChainCandidate = {
  id: string;
  title: string;
  description: string;
  kind: "risk" | "opportunity" | string;
  scope?: string;
  source?: string;
  sourceUrl?: string;
  freshnessTier?: string;
  actionability?: string;
  impactScore?: number;
  confidenceScore?: number;
  prompt: string;
};

type Props = {
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  result: EngageAgentResponse | null;
  setResult: React.Dispatch<React.SetStateAction<EngageAgentResponse | null>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  companyProfile?: CompanyProfile | null;
  companyId?: string;
  chainOutputs: ChainOutputs;
  setChainOutputs: React.Dispatch<React.SetStateAction<ChainOutputs>>;
  onExecute?: (payload: ExecutePayload) => void;
  onSave?: () => void;
  onReject?: () => void;
  chainCandidates?: ChainCandidate[];
  onSaveCandidate?: (candidate: ChainCandidate) => void;
  signals?: Array<Record<string, any>>;
  opportunities?: Array<Record<string, any>>;
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
        <span className="rounded-full border border-cyan-400/30 bg-cyan-500/15 px-3 py-1 text-xs font-medium text-white">
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
    <section className="rounded-lg border border-slate-300 bg-slate-50 p-5 shadow-[0_4px_14px_rgba(15,23,42,0.06)]">
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
    <article className="rounded-md border border-slate-300 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.10)]">
      <div className="text-xs uppercase tracking-[0.18em] text-cyan-700">
        {title}
      </div>
      <div className="mt-4 space-y-4">{children}</div>
    </article>
  );
}

function AnalyseStageShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-md border border-slate-300 bg-white p-6 text-slate-900 shadow-[0_18px_46px_rgba(15,23,42,0.24)] ring-1 ring-slate-200/80">
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">
            {title}
          </div>
          <div className="mt-1 text-sm text-slate-500">
            Structured analyst interpretation
          </div>
        </div>

        <div className="rounded-full border border-cyan-700 bg-cyan-500 px-3 py-1 text-xs font-semibold text-slate-950 shadow-sm">
          Analyse
        </div>
      </div>

      <div className="mt-5 space-y-5">{children}</div>
    </article>
  );
}

function AnalyseSection({
  title,
  children,
  emphasis = false,
}: {
  title: string;
  children: React.ReactNode;
  emphasis?: boolean;
}) {
  return (
    <section
      className={[
        "rounded-md border p-5 shadow-[0_8px_22px_rgba(15,23,42,0.10)]",
        emphasis
          ? "border-cyan-700/30 bg-cyan-50"
          : "border-slate-300 bg-slate-50",
      ].join(" ")}
    >
      <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
        {title}
      </div>
      <div className="mt-3">{children}</div>
    </section>
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
        "rounded-md border px-4 py-2 text-sm transition",
        active
          ? "border-cyan-400/40 bg-cyan-500/20 text-white shadow-[0_6px_16px_rgba(6,182,212,0.18)]"
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
      <AnalyseStageShell title="Analyse">
        <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
          No Analyse output returned.
        </div>
      </AnalyseStageShell>
    );
  }

  return (
    <AnalyseStageShell title="Analyse">
      <AnalyseSection title="Headline" emphasis>
        <div className="text-[1.75rem] font-semibold leading-tight text-slate-950">
          {safeText(value.headline)}
        </div>
      </AnalyseSection>

      <AnalyseSection title="Key Insight">
        <p className="text-base leading-8 text-slate-700">
          {safeText(value.key_insight)}
        </p>
      </AnalyseSection>

      <div className="grid gap-5 xl:grid-cols-2">
        <AnalyseSection title="Drivers">
          <BulletList items={safeArray<string>(value.drivers)} />
        </AnalyseSection>

        <AnalyseSection title="Second-Order Effects">
          <BulletList items={safeArray<string>(value.second_order_effects)} />
        </AnalyseSection>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <AnalyseSection title="Implications">
          <BulletList items={safeArray<string>(value.implications)} />
        </AnalyseSection>

        <AnalyseSection title="Recommended Actions">
          <BulletList items={safeArray<string>(value.recommended_actions)} />
        </AnalyseSection>
      </div>

      <div className="border-t border-slate-200 pt-1">
        <MetaBar confidence={value.confidence} horizon={value.time_horizon} />
      </div>
    </AnalyseStageShell>
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
                className="rounded-md border border-cyan-400/15 bg-cyan-500/10 p-4"
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
                    "rounded-md border p-4",
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
                  className="rounded-md border border-slate-300 bg-slate-50 p-5 shadow-[0_4px_14px_rgba(15,23,42,0.06)]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-lg font-semibold text-slate-900">
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

function extractSupportingSignalIds(data: AnyRecord | null): string[] {
  const fromContext = safeArray<string>(data?.context_summary?.supporting_signals);

  const fromMeta = safeArray<AnyRecord>(data?.meta?.supporting_signals)
    .map((signal) => signal?.id)
    .filter((id): id is string => typeof id === "string" && id.trim().length > 0);

  const fromAnalyse = safeArray<string>(
    data?.chain_outputs?.analyse?.based_on_signals
  );

  return Array.from(new Set([...fromContext, ...fromMeta, ...fromAnalyse]));
}

function buildDecisionAgentOutput(data: AnyRecord | null): AnyRecord | null {
  if (!data) return null;

  if (data.multi_path_output && typeof data.multi_path_output === "object") {
    return data.multi_path_output as AnyRecord;
  }

  const candidate = {
    analyst_views: data.analyst_views,
    analysis_selection: data.analysis_selection,
    strategic_paths: data.strategic_paths,
    strategy_decision: data.strategy_decision,
    execution_plan: data.execution_plan,
    interaction_hooks: data.interaction_hooks,
  };

  if (
    candidate.analyst_views ||
    candidate.analysis_selection ||
    candidate.strategic_paths ||
    candidate.strategy_decision ||
    candidate.execution_plan
  ) {
    return candidate;
  }

  if (data.output && typeof data.output === "object") {
    return data.output as AnyRecord;
  }

  return null;
}

function V9DecisionBridge({
  data,
  companyProfile,
}: {
  data: AnyRecord | null;
  companyProfile?: CompanyProfile | null;
}) {
  const [saving, setSaving] = useState(false);
  const [creatingExecution, setCreatingExecution] = useState(false);
  const [decision, setDecision] = useState<V9DecisionRecord | null>(null);
  const [execution, setExecution] = useState<V9ExecutionRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  const agentOutput = useMemo(() => buildDecisionAgentOutput(data), [data]);
  const signalIds = useMemo(() => extractSupportingSignalIds(data), [data]);

  async function handleSaveDecision() {
    if (!agentOutput || saving) return;

    setSaving(true);
    setError(null);

    try {
      const saved = await createDecisionCandidate({
        companyId: companyProfile?.company_id as string | undefined,
        agentOutput,
        originatingSignalIds: signalIds,
        priority: "medium",
      });

      setDecision(saved);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not save decision candidate."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateExecution() {
    if (!decision?.decision_id || creatingExecution) return;

    setCreatingExecution(true);
    setError(null);

    try {
      const created = await createExecutionFromDecision(decision.decision_id);
      setExecution(created);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not create execution record."
      );
    } finally {
      setCreatingExecution(false);
    }
  }

  if (!agentOutput) return null;

  return (
    <section className="rounded-md border border-emerald-300/40 bg-emerald-50/80 p-4 shadow-[0_14px_34px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-500">
            V9 Decision Bridge
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-slate-950">
              Decision memory
            </h3>

            <span className="rounded-full border border-emerald-200 bg-white/70 px-2.5 py-1 text-xs font-medium text-emerald-700">
              Evidence {signalIds.length}
            </span>

            <span className="rounded-full border border-slate-200 bg-white/70 px-2.5 py-1 text-xs font-medium text-slate-600">
              Decision {decision?.status ?? "not saved"}
            </span>

            <span className="rounded-full border border-slate-200 bg-white/70 px-2.5 py-1 text-xs font-medium text-slate-600">
              Execution {execution?.status ?? "not created"}
            </span>
          </div>

          <p className="mt-1 text-sm leading-6 text-slate-600">
            Save the chain result as a decision candidate, then create execution
            tracking when ready.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void handleSaveDecision()}
            disabled={saving || Boolean(decision)}
            className="rounded-md border border-emerald-300 bg-emerald-100 px-3.5 py-2 text-sm font-medium text-emerald-800 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : decision ? "Decision Saved" : "Save Decision"}
          </button>

          <button
            type="button"
            onClick={() => void handleCreateExecution()}
            disabled={creatingExecution || !decision || Boolean(execution)}
            className="rounded-md border border-cyan-300 bg-cyan-100 px-3.5 py-2 text-sm font-medium text-cyan-800 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creatingExecution
              ? "Creating..."
              : execution
              ? "Execution Created"
              : "Create Execution"}
          </button>
        </div>
      </div>

      {(decision || execution) && (
        <div className="mt-4 grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
          {decision ? (
            <div className="rounded-md border border-emerald-200 bg-white/80 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Saved Decision
                  </div>
                  <div className="mt-1 truncate text-sm font-semibold text-slate-950">
                    {decision.title}
                  </div>
                </div>

                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
                  {decision.decision_id}
                </span>
              </div>

              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                {decision.recommendation_summary}
              </p>
            </div>
          ) : null}

          {execution ? (
            <div className="rounded-md border border-cyan-200 bg-white/80 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Execution Record
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-950">
                    {execution.phases.length} phases ·{" "}
                    {execution.phases.reduce(
                      (total, phase) => total + phase.tasks.length,
                      0
                    )}{" "}
                    tasks
                  </div>
                </div>

                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
                  {execution.execution_id}
                </span>
              </div>

              <div className="mt-3 grid gap-2 md:grid-cols-3">
                {execution.phases.map((phase) => (
                  <div
                    key={phase.phase_id}
                    className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
                  >
                    <div className="truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-cyan-700">
                      {phase.title}
                    </div>
                    <div className="mt-1 text-xs text-slate-600">
                      {phase.tasks.length} tasks
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {error ? (
        <div className="mt-3 rounded-md border border-red-300 bg-red-50 p-3 text-sm leading-6 text-red-800">
          {error}
        </div>
      ) : null}
    </section>
  );
}

function IntelligenceSelectionPanel({
  candidates,
  onUse,
  onSave,
}: {
  candidates: ChainCandidate[];
  onUse: (candidate: ChainCandidate) => void;
  onSave?: (candidate: ChainCandidate) => void;
}) {
  const visibleCandidates = candidates.slice(0, 8);

  if (visibleCandidates.length === 0) {
    return (
      <section className="rounded-md border border-slate-300 bg-white p-5 text-slate-900 shadow-[0_18px_42px_rgba(15,23,42,0.18)] ring-1 ring-slate-200/80">
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">
          Analysed Intelligence Options
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          No live risk or opportunity candidates are currently available. Once
          Live Signals contains relevant risks or opportunities, they will appear
          here for controlled chain selection.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-md border border-slate-300 bg-white p-5 text-slate-900 shadow-[0_18px_42px_rgba(15,23,42,0.18)] ring-1 ring-slate-200/80">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">
            Analysed Intelligence Options
          </div>
          <h3 className="mt-2 text-xl font-semibold text-slate-950">
            Select a risk or opportunity to run through the full chain
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Choose a live intelligence item below. GeoPulse will place a
            structured chain prompt into the text box, ready for Analyse ?
            Advise ? Plan.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {visibleCandidates.map((candidate) => {
          const isOpportunity = candidate.kind === "opportunity";

          return (
            <article
              key={candidate.id}
              className="rounded-md border border-slate-300 bg-white p-5 text-slate-900 shadow-[0_18px_42px_rgba(15,23,42,0.24)] ring-1 ring-slate-200/80 transition hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-[0_22px_50px_rgba(15,23,42,0.30)]"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={[
                    "rounded-full border px-3 py-1 text-xs font-semibold shadow-sm",
                    isOpportunity
                      ? "border-emerald-700 bg-emerald-500 text-white"
                      : "border-amber-700 bg-amber-400 text-slate-950",
                  ].join(" ")}
                >
                  {candidate.kind}
                </span>

                {candidate.scope ? (
                  <span className="rounded-full border border-cyan-700 bg-cyan-500 px-3 py-1 text-xs font-semibold text-slate-950 shadow-sm">
                    {candidate.scope}
                  </span>
                ) : null}

                {candidate.freshnessTier ? (
                  <span className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {candidate.freshnessTier}
                  </span>
                ) : null}

                {candidate.actionability === "actionable" ? (
                  <span className="rounded-full border border-emerald-700 bg-emerald-500 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                    actionable
                  </span>
                ) : null}
              </div>

              <h4 className="mt-3 text-base font-semibold leading-snug text-slate-950">
                {candidate.title}
              </h4>

              <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-700">
                {candidate.description}
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs font-medium text-slate-500">
                  {candidate.source || "Unknown source"}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onUse(candidate)}
                    className="rounded-md border border-cyan-700 bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-[0_8px_18px_rgba(8,145,178,0.28)] transition hover:bg-cyan-400"
                  >
                    Use in Full Chain
                  </button>

                  {onSave ? (
                    <button
                      type="button"
                      onClick={() => onSave(candidate)}
                      className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                      Save selection
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
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
  companyId,
  chainOutputs,
  setChainOutputs,
  onExecute,
  onSave,
  onReject,
  chainCandidates = [],
  onSaveCandidate,
  signals = [],
  opportunities = [],
}: Props) {
  const [methodology, setMethodology] = useState<
    "auto" | "prince2" | "agile" | "hybrid"
  >("auto");

  const methodologyLabel = useMemo(() => {
    if (methodology === "prince2") return "PRINCE2";
    if (methodology === "agile") return "Agile";
    return "Hybrid";
  }, [methodology]);

  const topRiskSignals = signals
    .filter((signal) => signal?.kind === "risk")
    .slice(0, 3);

  const topOpportunitySignals = signals
    .filter((signal) => signal?.kind === "opportunity")
    .slice(0, 3);

  const topOpportunities = opportunities.slice(0, 3);

  function buildChainInputFromSignal(signal: Record<string, any>): string {
    return [
      `${signal.kind === "opportunity" ? "Opportunity" : "Risk"} signal: ${
        signal.headline ?? "Untitled signal"
      }`,
      signal.summary ? `Summary: ${signal.summary}` : null,
      signal.region ? `Region: ${signal.region}` : null,
      signal.cluster_tag ? `Theme: ${signal.cluster_tag}` : null,
      signal.source ? `Source: ${signal.source}` : null,
      "Assess the commercial implications, strategic options, recommended actions, and execution plan.",
    ]
      .filter(Boolean)
      .join("\n");
  }

  function buildChainInputFromOpportunity(opportunity: Record<string, any>): string {
    return [
      `Selected opportunity: ${opportunity.title ?? "Untitled opportunity"}`,
      opportunity.summary ? `Summary: ${opportunity.summary}` : null,
      opportunity.category ? `Category: ${opportunity.category}` : null,
      opportunity.timing_window ? `Timing window: ${opportunity.timing_window}` : null,
      typeof opportunity.score === "number"
        ? `Opportunity score: ${opportunity.score}`
        : null,
      "Assess the opportunity, strategic options, recommended actions, and execution plan.",
    ]
      .filter(Boolean)
      .join("\n");
  }
  
  async function runChain() {
    const text = input.trim();
    if (!text || loading) return;

    setLoading(true);

    try {
      const data = await engageAgent({
        input: text,
        stage: "full_chain",
        companyProfile,
        companyId,
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
    ((data?.analyst_views ||
      data?.analysis_selection ||
      data?.strategic_paths ||
      data?.strategy_decision ||
      data?.execution_plan)
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
      <section className="rounded-lg border border-white/10 bg-slate-950 p-6 text-white shadow-[0_18px_40px_rgba(15,23,42,0.38)]">
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
          <span className="rounded-full border border-cyan-400/30 bg-cyan-500/15 px-3 py-1 text-xs font-medium text-white shadow-[0_4px_12px_rgba(6,182,212,0.18)]">
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
        
		        <div className="mt-6 grid gap-4 xl:grid-cols-3">
          <div className="rounded-md border border-red-400/15 bg-red-500/10 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-red-200/80">
              Risk candidates
            </div>

            <div className="mt-3 space-y-3">
              {topRiskSignals.length === 0 ? (
                <div className="text-sm text-slate-400">
                  No risk signals available.
                </div>
              ) : (
                topRiskSignals.map((signal, index) => (
                  <div
                    key={signal.id ?? `risk-${index}`}
                    className="rounded-md border border-white/10 bg-slate-950/45 p-3"
                  >
                    <div className="text-sm font-medium text-white">
                      {signal.headline ?? "Untitled risk"}
                    </div>
                    <div className="mt-1 text-xs leading-5 text-slate-400">
                      {signal.region ?? "Unknown region"} ·{" "}
                      {signal.cluster_tag ?? "Unclassified"}
                    </div>

                    <button
                      type="button"
                      onClick={() => setInput(buildChainInputFromSignal(signal))}
                      className="mt-3 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/10"
                    >
                      Use in Chain
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-md border border-emerald-400/15 bg-emerald-500/10 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-emerald-200/80">
              Opportunity signals
            </div>

            <div className="mt-3 space-y-3">
              {topOpportunitySignals.length === 0 ? (
                <div className="text-sm text-slate-400">
                  No opportunity signals available.
                </div>
              ) : (
                topOpportunitySignals.map((signal, index) => (
                  <div
                    key={signal.id ?? `opp-signal-${index}`}
                    className="rounded-md border border-white/10 bg-slate-950/45 p-3"
                  >
                    <div className="text-sm font-medium text-white">
                      {signal.headline ?? "Untitled opportunity signal"}
                    </div>
                    <div className="mt-1 text-xs leading-5 text-slate-400">
                      {signal.region ?? "Unknown region"} ·{" "}
                      {signal.cluster_tag ?? "Unclassified"}
                    </div>

                    <button
                      type="button"
                      onClick={() => setInput(buildChainInputFromSignal(signal))}
                      className="mt-3 rounded-md border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-200 transition hover:bg-emerald-500/20"
                    >
                      Use in Chain
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-md border border-cyan-400/15 bg-cyan-500/10 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-cyan-200/80">
              Identified opportunities
            </div>

            <div className="mt-3 space-y-3">
              {topOpportunities.length === 0 ? (
                <div className="text-sm text-slate-400">
                  No opportunity records available.
                </div>
              ) : (
                topOpportunities.map((opportunity, index) => (
                  <div
                    key={opportunity.id ?? `opportunity-${index}`}
                    className="rounded-md border border-white/10 bg-slate-950/45 p-3"
                  >
                    <div className="text-sm font-medium text-white">
                      {opportunity.title ?? "Untitled opportunity"}
                    </div>
                    <div className="mt-1 text-xs leading-5 text-slate-400">
                      {opportunity.category ?? "Opportunity"} ·{" "}
                      {opportunity.timing_window ?? "Timing under review"}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setInput(buildChainInputFromOpportunity(opportunity))
                      }
                      className="mt-3 rounded-md border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-200 transition hover:bg-cyan-500/20"
                    >
                      Use in Chain
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
		
        <div className="mt-5 flex items-center gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe the market signal, company challenge, or opportunity..."
            className="min-h-[80px] flex-1 rounded-md border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-[0_4px_14px_rgba(15,23,42,0.08)] outline-none placeholder:text-slate-400"
            disabled={loading}
          />
          <button
            onClick={() => void runChain()}
            disabled={loading || !input.trim()}
            className="rounded-md border border-cyan-400/30 bg-cyan-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-cyan-400 disabled:opacity-50"
          >
            {loading ? "Running..." : "Run Full Chain"}
          </button>
        </div>

        {(onExecute || onSave || onReject) && result ? (
          <div className="mt-5 flex flex-wrap gap-3">
            {onExecute ? (
              <button
                onClick={handleExecute}
                className="rounded-md border border-emerald-400/30 bg-emerald-500/15 px-4 py-2 text-sm font-medium text-white shadow-[0_6px_16px_rgba(16,185,129,0.18)] transition hover:bg-emerald-500/25"
              >
                Execute with {methodologyLabel}
              </button>
            ) : null}

            {onSave ? (
              <button
                onClick={onSave}
                className="rounded-md border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200 transition hover:bg-cyan-500/20"
              >
                Save for later
              </button>
            ) : null}

            {onReject ? (
              <button
                onClick={onReject}
                className="rounded-md border border-rose-400/20 bg-rose-500/10 px-4 py-2 text-sm text-rose-200 transition hover:bg-rose-500/20"
              >
                Reject
              </button>
            ) : null}
          </div>
        ) : null}
      </section>
	  
	          <div className="mt-5">
          <IntelligenceSelectionPanel
            candidates={chainCandidates}
            onUse={(candidate) => {
              setInput(candidate.prompt);
            }}
            onSave={onSaveCandidate}
          />
        </div>

            {!result ? (
        <div className="rounded-md border border-dashed border-slate-400 bg-slate-50 p-6 text-sm text-slate-600 shadow-[0_4px_14px_rgba(15,23,42,0.05)]">
          No chain result yet.
        </div>
      ) : (
        <div className="space-y-5">
		 <V9DecisionBridge data={data} companyProfile={companyProfile} />
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


