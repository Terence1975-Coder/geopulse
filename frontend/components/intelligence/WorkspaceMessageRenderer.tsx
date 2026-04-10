"use client";

import type {
  StructuredAgentOutput,
  WorkspaceMessage,
} from "../../types/intelligence";

type Props = {
  message: WorkspaceMessage;
  stageLabel: string;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object";
}

function isStructuredAgentOutput(value: unknown): value is StructuredAgentOutput {
  return isObject(value) && "drivers" in value && "second_order_effects" in value;
}

function isStructuredAgentOutput(value: unknown): value is StructuredAgentOutput {
  return isObject(value) && "strategic_options" in value && "recommended_option" in value;
}

function isStructuredAgentOutput(value: unknown): value is StructuredAgentOutput {
  return isObject(value) && "execution_phases" in value && "go_no_go_criteria" in value;
}

function isStructuredAgentOutput(value: unknown): value is StructuredAgentOutput {
  return isObject(value) && "profile_summary" in value && "calibration_notes" in value;
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

function BulletList({ items }: { items?: string[] }) {
  if (!items || items.length === 0) {
    return <div className="text-sm text-slate-500">None noted.</div>;
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

function MetaBar({
  confidence,
  horizon,
}: {
  confidence?: number;
  horizon?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {typeof confidence === "number" ? (
        <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">
          Confidence {Math.round(confidence * 100)}%
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

function AnalyseCard({ data }: { data: StructuredAgentOutput }) {
  return (
    <div className="space-y-4">
      <Section title="Headline">
        <div className="text-lg font-semibold text-white">{data.headline}</div>
      </Section>

      <Section title="Key Insight">
        <p className="text-sm leading-7 text-slate-200">{data.key_insight}</p>
      </Section>

      <div className="grid gap-4 xl:grid-cols-2">
        <Section title="Drivers">
          <BulletList items={data.drivers} />
        </Section>
        <Section title="Second-Order Effects">
          <BulletList items={data.second_order_effects} />
        </Section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Section title="Implications">
          <BulletList items={data.implications} />
        </Section>
        <Section title="Watch Items / Uncertainty">
          <BulletList items={data.watch_items_or_uncertainties} />
        </Section>
      </div>

      <Section title="Lens Scoring">
        <div className="grid gap-3 lg:grid-cols-3">
          {data.analytical_lens_scores?.map((lens, index) => (
            <div
              key={`${lens.lens_name}-${index}`}
              className="rounded-2xl border border-cyan-400/15 bg-cyan-500/10 p-4"
            >
              <div className="text-sm font-semibold text-white">{lens.lens_name}</div>
              <div className="mt-3 space-y-1 text-xs text-slate-200">
                <div>Commercial relevance: {lens.commercial_relevance}/10</div>
                <div>Strategic clarity: {lens.strategic_clarity}/10</div>
                <div>Execution realism: {lens.execution_realism}/10</div>
                <div>Profile fit: {lens.profile_fit}/10</div>
                <div className="pt-1 font-semibold text-cyan-200">
                  Total: {lens.total_score}/40
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                {lens.why_it_scored_this_way}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <MetaBar confidence={data.confidence} horizon={data.time_horizon} />
    </div>
  );
}

function OptionCard({
  option,
  recommended,
}: {
  option: StrategicOption;
  recommended: boolean;
}) {
  return (
    <div
      className={[
        "rounded-2xl border p-4",
        recommended
          ? "border-emerald-400/25 bg-emerald-500/10"
          : "border-white/10 bg-white/[0.03]",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-base font-semibold text-white">{option.option_name}</div>
        {recommended ? (
          <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
            Recommended
          </span>
        ) : null}
      </div>

      <p className="mt-3 text-sm leading-7 text-slate-200">{option.rationale}</p>

      <div className="mt-4 text-sm font-medium text-cyan-200">Where it wins</div>
      <p className="mt-1 text-sm leading-7 text-slate-300">{option.where_it_wins}</p>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <div className="text-sm font-medium text-white">Risks</div>
          <div className="mt-2">
            <BulletList items={option.risks} />
          </div>
        </div>
        <div>
          <div className="text-sm font-medium text-white">Required conditions</div>
          <div className="mt-2">
            <BulletList items={option.required_conditions} />
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/40 p-3 text-xs text-slate-200">
        <div>Speed to value: {option.scorecard.speed_to_value}/10</div>
        <div>Risk level: {option.scorecard.risk_level}/10</div>
        <div>Margin alignment: {option.scorecard.margin_alignment}/10</div>
        <div>Profile alignment: {option.scorecard.profile_alignment}/10</div>
        <div>Implementation feasibility: {option.scorecard.implementation_feasibility}/10</div>
        <div className="mt-1 font-semibold text-cyan-200">
          Weighted total: {option.scorecard.weighted_total}/50
        </div>
      </div>
    </div>
  );
}

function AdviseCard({ data }: { data: StructuredAgentOutput }) {
  return (
    <div className="space-y-4">
      <Section title="Decision Context">
        <div className="text-lg font-semibold text-white">{data.headline}</div>
        <p className="mt-3 text-sm leading-7 text-slate-200">{data.decision_context}</p>
      </Section>

      <Section title="Strategic Options">
        <div className="grid gap-4">
          {data.strategic_options.map((option, index) => (
            <OptionCard
              key={`${option.option_name}-${index}`}
              option={option}
              recommended={option.option_name === data.recommended_option}
            />
          ))}
        </div>
      </Section>

      <div className="grid gap-4 xl:grid-cols-2">
        <Section title="Tradeoffs">
          <BulletList items={data.tradeoffs} />
        </Section>
        <Section title="What Not To Do Yet">
          <BulletList items={data.what_not_to_do_yet} />
        </Section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Section title="Why This Wins Now">
          <p className="text-sm leading-7 text-slate-200">{data.why_this_option_wins_now}</p>
        </Section>
        <Section title="Immediate Management Choices">
          <BulletList items={data.immediate_management_choices} />
        </Section>
      </div>

      <MetaBar confidence={data.confidence} horizon={data.time_horizon} />
    </div>
  );
}

function PlanCard({ data }: { data: StructuredAgentOutput }) {
  return (
    <div className="space-y-4">
      <Section title="Objective">
        <div className="text-lg font-semibold text-white">{data.headline}</div>
        <p className="mt-3 text-sm leading-7 text-slate-200">{data.objective}</p>
      </Section>

      <Section title="Execution Phases">
        <div className="grid gap-4">
          {data.execution_phases.map((phase, index) => (
            <div
              key={`${phase.phase_name}-${index}`}
              className="rounded-2xl border border-indigo-400/15 bg-indigo-500/10 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-base font-semibold text-white">{phase.phase_name}</div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                  {phase.timing}
                </span>
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-2">
                <div>
                  <div className="text-sm font-medium text-white">Actions</div>
                  <div className="mt-2">
                    <BulletList items={phase.actions} />
                  </div>
                </div>
                <div className="space-y-2 text-sm leading-7 text-slate-200">
                  <div><span className="text-slate-400">Owner:</span> {phase.owner}</div>
                  <div><span className="text-slate-400">Dependency:</span> {phase.dependency}</div>
                  <div><span className="text-slate-400">Success metric:</span> {phase.success_metric}</div>
                  <div><span className="text-slate-400">Risk if missed:</span> {phase.risk_if_missed}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <div className="grid gap-4 xl:grid-cols-2">
        <Section title="Dependencies">
          <BulletList items={data.dependencies} />
        </Section>
        <Section title="Milestones">
          <BulletList items={data.milestones} />
        </Section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Section title="Success Metrics">
          <BulletList items={data.success_metrics} />
        </Section>
        <Section title="Review Checkpoints">
          <BulletList items={data.review_checkpoints} />
        </Section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Section title="Risks to Execution">
          <BulletList items={data.execution_risks} />
        </Section>
        <Section title="Go / No-Go Criteria">
          <BulletList items={data.go_no_go_criteria} />
        </Section>
      </div>

      <MetaBar confidence={data.confidence} horizon={data.time_horizon} />
    </div>
  );
}

function ProfileCard({ data }: { data: StructuredAgentOutput }) {
  return (
    <div className="space-y-4">
      <Section title="Profile Summary">
        <div className="text-lg font-semibold text-white">{data.headline}</div>
        <p className="mt-3 text-sm leading-7 text-slate-200">{data.profile_summary}</p>
      </Section>

      <div className="grid gap-4 xl:grid-cols-2">
        <Section title="Calibration Notes">
          <BulletList items={data.calibration_notes} />
        </Section>
        <Section title="Missing Profile Data">
          <BulletList items={data.missing_profile_data} />
        </Section>
      </div>

      <MetaBar confidence={data.confidence} />
    </div>
  );
}

export default function WorkspaceMessageRenderer({
  message,
  stageLabel,
}: Props) {
  const isUser = message.role === "user";

  return (
    <article
      className={[
        "rounded-3xl border p-5",
        isUser
          ? "border-white/10 bg-white/[0.03]"
          : message.tone === "warning"
          ? "border-amber-400/20 bg-amber-500/10"
          : "border-cyan-400/15 bg-slate-900/80",
      ].join(" ")}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
          {isUser ? "User Input" : stageLabel}
        </div>
        <div className="text-xs text-slate-500">
          {new Date(message.timestamp).toLocaleString()}
        </div>
      </div>

      {typeof message.content === "string" ? (
        <p className="whitespace-pre-wrap text-sm leading-7 text-slate-200">
          {message.content}
        </p>
      ) : isStructuredAgentOutput(message.content) ? (
        <AnalyseCard data={message.content} />
      ) : isStructuredAgentOutput(message.content) ? (
        <AdviseCard data={message.content} />
      ) : isStructuredAgentOutput(message.content) ? (
        <PlanCard data={message.content} />
      ) : isStructuredAgentOutput(message.content) ? (
        <ProfileCard data={message.content} />
      ) : (
        <pre className="overflow-x-auto whitespace-pre-wrap text-xs text-slate-300">
          {JSON.stringify(message.content, null, 2)}
        </pre>
      )}
    </article>
  );
}