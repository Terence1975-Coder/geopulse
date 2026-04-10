"use client";

import type {
  StructuredAgentOutput,
  WorkspaceMessage,
} from "../../types/intelligence";

type Props = {
  message: WorkspaceMessage;
  stageLabel: string;
};

type AnyRecord = Record<string, unknown>;

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

function StructuredOutputCard({ data }: { data: StructuredAgentOutput }) {
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
  const missingProfileData = safeArray(record.missing_profile_data);
  const calibrationNotes = safeArray(record.calibration_notes);
  const profileReferences = safeArray(record.profile_references);

  return (
    <div className="space-y-4">
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
        missingProfileData.length > 0 ||
        calibrationNotes.length > 0 ||
        profileReferences.length > 0) && (
        <div className="grid gap-4 xl:grid-cols-2">
          <Section title="Review / Profile Notes">
            <BulletList
              items={[
                ...reviewCheckpoints,
                ...missingProfileData,
                ...calibrationNotes,
                ...profileReferences,
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
        <StructuredOutputCard data={message.content} />
      ) : (
        <pre className="overflow-x-auto whitespace-pre-wrap text-xs text-slate-300">
          {JSON.stringify(message.content, null, 2)}
        </pre>
      )}
    </article>
  );
}