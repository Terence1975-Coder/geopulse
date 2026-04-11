"use client";

import { useMemo, useState } from "react";
import type {
  StructuredAgentOutput,
  WorkspaceMessage,
} from "../../types/intelligence";

type Props = {
  message: WorkspaceMessage;
  stageLabel: string;
};

type AnyRecord = Record<string, unknown>;
type MethodologyMode = "prince2" | "agile" | "hybrid";

function isObject(value: unknown): value is AnyRecord {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isStructuredAgentOutput(value: unknown): value is StructuredAgentOutput {
  return (
    isObject(value) &&
    ("headline" in value ||
      "key_insight" in value ||
      "drivers" in value ||
      "recommended_actions" in value ||
      "confidence" in value ||
      "time_horizon" in value)
  );
}

function safeText(value: unknown, fallback = "Not available."): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function safeArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function pct(value?: number): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "N/A";
  return value > 1 ? `${Math.round(value)}%` : `${Math.round(value * 100)}%`;
}

function detectMethodology(data: StructuredAgentOutput): MethodologyMode {
  const record = data as AnyRecord;
  const textPool = [
    record.headline,
    record.key_insight,
    record.summary,
    record.decision_context,
    ...safeArray(record.reasoning_notes),
    ...safeArray(record.explanation_notes),
    ...safeArray(record.review_checkpoints),
    ...safeArray(record.milestones),
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
  const config =
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
    <span className={`rounded-full border px-3 py-1 text-xs ${config.classes}`}>
      {config.label}
    </span>
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

function StructuredOutputCard({
  data,
  compact = false,
}: {
  data: StructuredAgentOutput;
  compact?: boolean;
}) {
  const record = data as AnyRecord;
  const headline = safeText(record.headline, "Structured Response");
  const keyInsight = safeText(
    record.key_insight ??
      record.decision_context ??
      record.objective ??
      record.profile_summary,
    "No summary available."
  );

  const drivers = safeArray(record.drivers);
  const secondOrderEffects = safeArray(record.second_order_effects);
  const implications = safeArray(record.implications);
  const recommendedActions = safeArray(record.recommended_actions);
  const tradeoffs = safeArray(record.tradeoffs);
  const dependencies = safeArray(record.dependencies);
  const milestones = safeArray(record.milestones);
  const successMetrics = safeArray(record.success_metrics);
  const reviewCheckpoints = safeArray(record.review_checkpoints);
  const reasoningNotes = safeArray(record.reasoning_notes);
  const explanationNotes = safeArray(record.explanation_notes);
  const methodology = detectMethodology(data);

  if (compact) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <ModeBadge mode={methodology} />
        </div>

        <Section title="Headline">
          <div className="text-lg font-semibold text-white">{headline}</div>
        </Section>

        <Section title="Key Insight">
          <p className="text-sm leading-7 text-slate-200">{keyInsight}</p>
        </Section>

        <div className="grid gap-4 xl:grid-cols-2">
          <Section title="Milestones">
            <BulletList items={milestones} />
          </Section>
          <Section title="Success Metrics">
            <BulletList items={successMetrics} />
          </Section>
        </div>

        <MetaBar
          confidence={
            typeof record.confidence === "number" ? record.confidence : undefined
          }
          horizon={
            typeof record.time_horizon === "string"
              ? record.time_horizon
              : undefined
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <ModeBadge mode={methodology} />
      </div>

      <Section title="Headline">
        <div className="text-lg font-semibold text-white">{headline}</div>
      </Section>

      <Section title="Key Insight">
        <p className="text-sm leading-7 text-slate-200">{keyInsight}</p>
      </Section>

      {(drivers.length > 0 || secondOrderEffects.length > 0) && (
        <div className="grid gap-4 xl:grid-cols-2">
          <Section title="Drivers">
            <BulletList items={drivers} />
          </Section>
          <Section title="Second-Order Effects">
            <BulletList items={secondOrderEffects} />
          </Section>
        </div>
      )}

      {(implications.length > 0 || recommendedActions.length > 0) && (
        <div className="grid gap-4 xl:grid-cols-2">
          <Section title="Implications">
            <BulletList items={implications} />
          </Section>
          <Section title="Recommended Actions">
            <BulletList items={recommendedActions} />
          </Section>
        </div>
      )}

      {(tradeoffs.length > 0 || dependencies.length > 0) && (
        <div className="grid gap-4 xl:grid-cols-2">
          <Section title="Tradeoffs">
            <BulletList items={tradeoffs} />
          </Section>
          <Section title="Dependencies">
            <BulletList items={dependencies} />
          </Section>
        </div>
      )}

      {(milestones.length > 0 || successMetrics.length > 0) && (
        <div className="grid gap-4 xl:grid-cols-2">
          <Section title="Milestones">
            <BulletList items={milestones} />
          </Section>
          <Section title="Success Metrics">
            <BulletList items={successMetrics} />
          </Section>
        </div>
      )}

      {(reviewCheckpoints.length > 0 ||
        reasoningNotes.length > 0 ||
        explanationNotes.length > 0) && (
        <div className="grid gap-4 xl:grid-cols-2">
          <Section title="Review / Governance Notes">
            <BulletList
              items={[
                ...reviewCheckpoints,
                ...reasoningNotes,
                ...explanationNotes,
              ]}
            />
          </Section>
          <Section title="Raw Summary">
            <p className="text-sm leading-7 text-slate-200">
              {safeText(
                record.summary ??
                  record.response ??
                  record.message ??
                  record.content,
                "No additional summary available."
              )}
            </p>
          </Section>
        </div>
      )}

      <MetaBar
        confidence={
          typeof record.confidence === "number" ? record.confidence : undefined
        }
        horizon={
          typeof record.time_horizon === "string"
            ? record.time_horizon
            : undefined
        }
      />
    </div>
  );
}

export default function WorkspaceMessageRenderer({
  message,
  stageLabel,
}: Props) {
  const isUser = message.role === "user";
  const isPlannerStage = stageLabel.toLowerCase().includes("planner");
  const isAssistantStructured = isStructuredAgentOutput(message.content);
  const isHistoricalPlannerMessage = isPlannerStage && !isUser && isAssistantStructured;

  const [expanded, setExpanded] = useState(!isHistoricalPlannerMessage);

  const summary = useMemo(() => {
    if (!isStructuredAgentOutput(message.content)) return null;
    const record = message.content as AnyRecord;
    return {
      headline: safeText(record.headline, "Planner Response"),
      mode: detectMethodology(message.content),
      timestamp: new Date(message.timestamp).toLocaleString(),
    };
  }, [message.content, message.timestamp]);

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
        isHistoricalPlannerMessage ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">
                    {summary?.headline}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {summary ? <ModeBadge mode={summary.mode} /> : null}
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                      Previous plan
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setExpanded((prev) => !prev)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
                >
                  {expanded ? "Hide details" : "Show details"}
                </button>
              </div>
            </div>

            {expanded ? (
              <StructuredOutputCard data={message.content} />
            ) : (
              <StructuredOutputCard data={message.content} compact />
            )}
          </div>
        ) : (
          <StructuredOutputCard data={message.content} />
        )
      ) : (
        <pre className="overflow-x-auto whitespace-pre-wrap text-xs text-slate-300">
          {JSON.stringify(message.content, null, 2)}
        </pre>
      )}
    </article>
  );
}