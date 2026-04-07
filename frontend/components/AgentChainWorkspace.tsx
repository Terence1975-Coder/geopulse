"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Save,
  ShieldCheck,
  Target,
  XCircle,
} from "lucide-react";
import { engageAgent } from "../lib/engageAgent";
import type {
  ChainOutputs,
  CompanyProfile,
  EngageAgentResponse,
  SupportingSignalDetail,
} from "../types/intelligence";

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
  onOpenPlanner?: () => void;
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
  urgency,
}: {
  confidence?: number;
  horizon?: string;
  urgency?: string | null;
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
      {urgency ? (
        <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-xs text-amber-200">
          Urgency {urgency}
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
    <section className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
        {title}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function StageShell({
  title,
  subtitle,
  accent = "cyan",
  children,
}: {
  title: string;
  subtitle?: string;
  accent?: "cyan" | "emerald" | "indigo" | "amber";
  children: React.ReactNode;
}) {
  const accentMap = {
    cyan: "border-cyan-400/15 bg-cyan-500/[0.05]",
    emerald: "border-emerald-400/15 bg-emerald-500/[0.05]",
    indigo: "border-indigo-400/15 bg-indigo-500/[0.05]",
    amber: "border-amber-400/15 bg-amber-500/[0.05]",
  };

  return (
    <article
      className={[
        "rounded-[30px] border p-5 shadow-[0_22px_60px_rgba(0,0,0,0.22)]",
        accentMap[accent],
      ].join(" ")}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-cyan-300/75">
            {title}
          </div>
          {subtitle ? (
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-5 space-y-4">{children}</div>
    </article>
  );
}

function SupportingSignalsCard({
  signals,
}: {
  signals?: SupportingSignalDetail[];
}) {
  const items = safeArray<SupportingSignalDetail>(signals);

  if (items.length === 0) {
    return null;
  }

  return (
    <StageShell
      title="Supporting Signals"
      subtitle="Evidence grounding for the current chain output."
      accent="indigo"
    >
      <div className="grid gap-4 xl:grid-cols-3">
        {items.map((signal, index) => (
          <div
            key={`${signal.id ?? signal.headline ?? "signal"}-${index}`}
            className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"
          >
            <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
              Evidence {index + 1}
            </div>
            <div className="mt-2 text-base font-semibold text-white">
              {safeText(signal.headline)}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {signal.source ? (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                  {signal.source}
                </span>
              ) : null}
              {signal.lifecycle ? (
                <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
                  {signal.lifecycle}
                </span>
              ) : null}
              {typeof signal.confidence_score === "number" ? (
                <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">
                  Confidence {pct(signal.confidence_score)}
                </span>
              ) : null}
            </div>

            {signal.relative_time ? (
              <div className="mt-4 text-sm text-slate-400">
                {signal.relative_time}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </StageShell>
  );
}

function AnalyseCard({ value }: { value: AnyRecord | null | undefined }) {
  if (!value) {
    return (
      <StageShell title="Analyse" subtitle="No Analyse output returned yet.">
        <div className="text-sm text-slate-400">No Analyse output returned.</div>
      </StageShell>
    );
  }

  return (
    <StageShell
      title="Analyse"
      subtitle="What is happening, why it matters, and which forces are shaping the situation."
      accent="cyan"
    >
      <Section title="Headline">
        <div className="text-xl font-semibold text-white">
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

      {safeArray<string>(value.reasoning_notes).length > 0 ? (
        <Section title="Reasoning Notes">
          <BulletList items={safeArray<string>(value.reasoning_notes)} />
        </Section>
      ) : null}

      <MetaBar
        confidence={value.confidence}
        horizon={value.time_horizon}
        urgency={value.urgency}
      />
    </StageShell>
  );
}

function AdviseCard({ value }: { value: AnyRecord | null | undefined }) {
  if (!value) {
    return (
      <StageShell title="Advise" subtitle="No Advise output returned yet.">
        <div className="text-sm text-slate-400">No Advise output returned.</div>
      </StageShell>
    );
  }

  return (
    <StageShell
      title="Advise"
      subtitle="Management-facing decision guidance built on the analysis layer."
      accent="emerald"
    >
      <Section title="Headline">
        <div className="text-xl font-semibold text-white">
          {safeText(value.headline)}
        </div>
      </Section>

      <Section title="Decision Context">
        <p className="text-sm leading-7 text-slate-200">
          {safeText(value.decision_context || value.key_insight)}
        </p>
      </Section>

      <div className="grid gap-4 xl:grid-cols-2">
        <Section title="Implications">
          <BulletList items={safeArray<string>(value.implications)} />
        </Section>

        <Section title="Recommended Actions">
          <BulletList items={safeArray<string>(value.recommended_actions)} />
        </Section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Section title="Tradeoffs">
          <BulletList
            items={safeArray<string>(
              value.tradeoffs ??
                value.reasoning_notes ??
                value.explanation_notes
            )}
          />
        </Section>

        <Section title="Profile References">
          <BulletList items={safeArray<string>(value.profile_references)} />
        </Section>
      </div>

      <MetaBar
        confidence={value.confidence}
        horizon={value.time_horizon}
        urgency={value.urgency}
      />
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
    <StageShell
      title="Strategic Paths"
      subtitle="Executive decision layer showing alternative paths, the selected route, and execution framing."
      accent="indigo"
    >
      {analystViews.length > 0 ? (
        <Section title="Analyst Views">
          <div className="grid gap-4 xl:grid-cols-3">
            {analystViews.map((view, index) => (
              <div
                key={view.id ?? `analyst-${index}`}
                className="rounded-[24px] border border-cyan-400/15 bg-cyan-500/10 p-4"
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

                <div className="mt-4 space-y-2 text-sm text-slate-300">
                  <div>
                    <span className="text-slate-500">Upside:</span>{" "}
                    {safeText(view.opportunity_signal)}
                  </div>
                  <div>
                    <span className="text-slate-500">Risk:</span>{" "}
                    {safeText(view.risk_signal)}
                  </div>
                </div>

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
                    "rounded-[24px] border p-4",
                    recommended
                      ? "border-emerald-400/25 bg-emerald-500/10"
                      : "border-white/10 bg-white/[0.03]",
                  ].join(" ")}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
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
                    <Section title="Where It Wins">
                      <p className="text-sm leading-7 text-slate-200">
                        {safeText(option.where_it_wins)}
                      </p>
                    </Section>

                    <Section title="Recommended Actions">
                      <BulletList
                        items={safeArray<string>(option.recommended_actions)}
                      />
                    </Section>
                  </div>

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

      {value.strategy_decision ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <Section title="Selected Path Rationale">
            <div className="text-base font-semibold text-white">
              {safeText(value.strategy_decision.selected_path_id)}
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-200">
              {safeText(value.strategy_decision.reason)}
            </p>
          </Section>

          <Section title="Why Not Other Paths">
            <BulletList
              items={safeArray<string>(value.strategy_decision.why_not_others)}
            />
          </Section>
        </div>
      ) : null}

      {value.execution_plan ? (
        <Section title="Execution Preview">
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
                  className="rounded-[24px] border border-indigo-400/15 bg-indigo-500/10 p-4"
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
      <StageShell title="Plan" subtitle="No Plan output returned yet.">
        <div className="text-sm text-slate-400">No Plan output returned.</div>
      </StageShell>
    );
  }

  return (
    <StageShell
      title="Plan"
      subtitle="Operational execution layer translated from the full chain."
      accent="amber"
    >
      <Section title="Objective">
        <div className="text-xl font-semibold text-white">
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

      <MetaBar
        confidence={value.confidence}
        horizon={value.time_horizon}
        urgency={value.urgency}
      />
    </StageShell>
  );
}

function ActionBar({
  hasResult,
  onExecute,
  onSave,
  onReject,
}: {
  hasResult: boolean;
  onExecute: () => void;
  onSave: () => void;
  onReject: () => void;
}) {
  return (
    <section className="rounded-[30px] border border-white/10 bg-white/[0.03] p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
            Decision Actions
          </div>
          <div className="mt-2 text-xl font-semibold text-white">
            Move from intelligence into execution
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">
            Keep the executive flow intact: review the chain, confirm the path,
            and move into Planner when ready.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onExecute}
            disabled={!hasResult}
            className="inline-flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-5 py-3 text-sm font-medium text-emerald-100 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            Execute to Planner
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={!hasResult}
            className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-5 py-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            Save
          </button>

          <button
            type="button"
            onClick={onReject}
            disabled={!hasResult}
            className="inline-flex items-center gap-2 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-5 py-3 text-sm font-medium text-rose-100 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <XCircle className="h-4 w-4" />
            Reject
          </button>
        </div>
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
  chainOutputs,
  setChainOutputs,
  onOpenPlanner,
}: Props) {
  const [statusMessage, setStatusMessage] = useState<string>("");

  async function runChain() {
    const text = input.trim();
    if (!text || loading) return;

    setLoading(true);
    setStatusMessage("");

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

      setStatusMessage("Chain completed. Review the recommendation and execute when ready.");
    } catch (error) {
      setResult({
        output:
          error instanceof Error
            ? `GeoPulse could not complete chain execution: ${error.message}`
            : "GeoPulse could not complete chain execution.",
      } as EngageAgentResponse);

      setStatusMessage("Chain execution failed.");
    } finally {
      setLoading(false);
    }
  }

  function handleSave() {
    if (!result) return;

    try {
      localStorage.setItem("geopulse-agent-chain-last-result", JSON.stringify(result));
      setStatusMessage("Latest chain result saved locally.");
    } catch {
      setStatusMessage("Save failed in this browser.");
    }
  }

  function handleReject() {
    setResult(null);
    setStatusMessage("Latest chain result cleared.");
  }

  function handleExecute() {
    if (!result) return;
    setStatusMessage("Opening Planner with the current chain output.");
    onOpenPlanner?.();
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

  const supportingSignals = useMemo(() => {
    const fromAnalyse = safeArray<SupportingSignalDetail>(
      analyseValue?.supporting_signal_details
    );
    const fromAdvise = safeArray<SupportingSignalDetail>(
      adviseValue?.supporting_signal_details
    );
    const fromMeta = safeArray<SupportingSignalDetail>(data?.meta?.supporting_signals);
    return fromAnalyse.length > 0
      ? fromAnalyse
      : fromAdvise.length > 0
      ? fromAdvise
      : fromMeta;
  }, [analyseValue, adviseValue, data]);

  const chainReady = Boolean(result);
  const executionObjective = safeText(
    multiPathValue?.execution_plan?.objective ?? planValue?.objective,
    "No execution objective yet."
  );

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[34px] border border-white/10 bg-gradient-to-br from-slate-950 via-[#071224] to-slate-950 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <div className="grid gap-6 px-6 py-6 md:px-8 xl:grid-cols-[1.2fr_0.8fr] xl:items-center">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.34em] text-cyan-300/75">
              GeoPulse Hero Workflow
            </div>

            <h2 className="mt-3 text-4xl font-semibold leading-tight text-white md:text-5xl">
              Agent Chain
            </h2>

            <p className="mt-4 max-w-4xl text-sm leading-8 text-slate-300 md:text-base">
              Run GeoPulse through Analyse, Advise, and Plan as one connected
              executive workflow. This is now the primary operating surface for
              moving from signal to decision to execution.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <StagePill label="Analyse" complete={Boolean(analyseValue)} />
              <StagePill label="Advise" complete={Boolean(adviseValue)} />
              <StagePill label="Plan" complete={Boolean(planValue)} />
              <StagePill
                label="Execution"
                active={Boolean(chainReady && !loading)}
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                Profile calibration{" "}
                {companyProfile?.company_name ? "active" : "limited"}
              </span>
              <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">
                Shared chain state active
              </span>
              {companyProfile?.company_name ? (
                <span className="rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-200">
                  {companyProfile.company_name}
                </span>
              ) : null}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
              Execution Readiness
            </div>

            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-cyan-400/15 bg-cyan-500/10 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-cyan-200">
                  <ShieldCheck className="h-4 w-4" />
                  Chain Status
                </div>
                <div className="mt-2 text-base text-white">
                  {chainReady ? "Ready for executive review" : "Awaiting chain run"}
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-400/15 bg-emerald-500/10 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-emerald-200">
                  <Target className="h-4 w-4" />
                  Current Objective
                </div>
                <div className="mt-2 text-sm leading-7 text-slate-100">
                  {executionObjective}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
                  <Clock3 className="h-4 w-4" />
                  Current Focus
                </div>
                <div className="mt-2 text-sm leading-7 text-slate-300">
                  {loading
                    ? "GeoPulse is building the current chain response."
                    : chainReady
                    ? "Review the selected path and move into Planner when ready."
                    : "Describe the signal, risk, opportunity, or decision context to begin."}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 px-6 py-6 md:px-8">
          <div className="flex flex-col gap-3 xl:flex-row">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe the market signal, company challenge, or opportunity..."
              className="min-h-[130px] flex-1 rounded-[24px] border border-white/10 bg-white/5 px-4 py-4 text-sm text-white outline-none placeholder:text-white/35"
              disabled={loading}
            />

            <button
              onClick={() => void runChain()}
              disabled={loading || !input.trim()}
              className="inline-flex min-w-[210px] items-center justify-center gap-2 rounded-[24px] border border-cyan-400/20 bg-cyan-400/10 px-5 py-4 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20 disabled:opacity-50"
            >
              {loading ? (
                "Running Full Chain..."
              ) : (
                <>
                  Run Full Chain
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          {statusMessage ? (
            <div className="mt-4 text-sm text-slate-400">{statusMessage}</div>
          ) : null}
        </div>
      </section>

      <ActionBar
        hasResult={Boolean(result)}
        onExecute={handleExecute}
        onSave={handleSave}
        onReject={handleReject}
      />

      {!result ? (
        <div className="rounded-[30px] border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm text-slate-400">
          No chain result yet.
        </div>
      ) : (
        <div className="space-y-6">
          <AnalyseCard value={analyseValue} />
          <AdviseCard value={adviseValue} />
          <MultiPathCard value={multiPathValue} />
          <PlanCard value={planValue} />
          <SupportingSignalsCard signals={supportingSignals} />
        </div>
      )}
    </div>
  );
}