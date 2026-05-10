"use client";

import { useEffect, useMemo, useState } from "react";

import type {
  DashboardSummary,
  OpportunityItem,
  SignalItem,
  WorkspaceKey,
} from "../types/geopulse";

import type { ChainOutputs } from "../types/intelligence";

type CommandMode = "executive" | "command";
type MotionPreference = "strategic" | "reduced" | "immersive";

type CommandCenterWorkspaceProps = {
  summary: DashboardSummary;
  signals: SignalItem[];
  opportunities: OpportunityItem[];
  chainOutputs: ChainOutputs;
  profile?: Record<string, any> | null;
  onOpenSignal?: (signal: SignalItem) => void;
  onNavigate?: (target: WorkspaceKey) => void;
};

function toScore(value: unknown, fallback = 0): number {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return value > 1 ? Math.round(value) : Math.round(value * 100);
}

function safeText(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function getSignalTone(signal: SignalItem): {
  label: string;
  shell: string;
  text: string;
} {
  if (signal.kind === "opportunity") {
    return {
      label: "Opportunity",
      shell: "border-emerald-400/20 bg-emerald-500/10",
      text: "text-emerald-200",
    };
  }

  if (signal.severity === "high") {
    return {
      label: "Critical",
      shell: "border-red-400/20 bg-red-500/10",
      text: "text-red-200",
    };
  }

  return {
    label: "Watch",
    shell: "border-amber-400/20 bg-amber-500/10",
    text: "text-amber-200",
  };
}

function getRelativeTime(signal: SignalItem): string {
  if (typeof signal.relative_time === "string" && signal.relative_time.trim()) {
    return signal.relative_time;
  }

  const rawDate =
    (signal as any).detected_at || signal.timestamp || new Date().toISOString();

  const parsed = new Date(rawDate).getTime();
  if (Number.isNaN(parsed)) return "unknown";

  const diffMinutes = Math.max(0, Math.round((Date.now() - parsed) / 60000));

  if (diffMinutes < 60) return `${diffMinutes} mins ago`;

  const hours = Math.round(diffMinutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function getAvgSignalScore(
  signals: SignalItem[],
  field: "confidence_score" | "signal_strength"
): number {
  if (!signals.length) return 0;

  return Math.round(
    signals.reduce((sum, signal: any) => sum + toScore(signal[field], 0), 0) /
      signals.length
  );
}

function ExecutivePanel({
  id,
  title,
  eyebrow,
  focused,
  dimmed,
  onFocus,
  children,
}: {
  id: string;
  title: string;
  eyebrow: string;
  focused: boolean;
  dimmed: boolean;
  onFocus: (id: string) => void;
  children: React.ReactNode;
}) {
  return (
    <section
      onClick={() => onFocus(id)}
      className={[
        "rounded-2xl border p-5 transition duration-300",
        "bg-slate-950/70 shadow-[0_18px_54px_rgba(0,0,0,0.34)] backdrop-blur-xl",
        focused
          ? "border-cyan-300/25 ring-1 ring-cyan-300/10"
          : "border-white/10",
        dimmed ? "opacity-70" : "opacity-100",
      ].join(" ")}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
            {eyebrow}
          </div>
          <h2 className="mt-2 text-xl font-semibold text-white">{title}</h2>
        </div>

        <button
          type="button"
          className={[
            "rounded-xl border px-3 py-2 text-xs transition",
            focused
              ? "border-cyan-400/20 bg-cyan-500/10 text-cyan-200"
              : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10",
          ].join(" ")}
        >
          {focused ? "Focused" : "Focus"}
        </button>
      </div>

      {children}
    </section>
  );
}

function PresenceMetric({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  tone?: "risk" | "opportunity" | "confidence" | "neutral";
}) {
  const toneMap = {
    risk: "border-red-400/20 bg-red-500/10 text-red-200",
    opportunity: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
    confidence: "border-cyan-400/20 bg-cyan-500/10 text-cyan-200",
    neutral: "border-white/10 bg-white/5 text-slate-200",
  };

  return (
    <div className={`rounded-2xl border p-4 ${toneMap[tone]}`}>
      <div className="text-[11px] uppercase tracking-[0.2em] opacity-75">
        {label}
      </div>
      <div className="mt-2 text-3xl font-semibold text-white">{value}</div>
    </div>
  );
}

function SignalRow({
  signal,
  onOpen,
}: {
  signal: SignalItem;
  onOpen?: (signal: SignalItem) => void;
}) {
  const tone = getSignalTone(signal);

  return (
    <article className={`rounded-2xl border p-4 ${tone.shell}`}>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-400">
            <span className={tone.text}>{tone.label}</span>
            <span>•</span>
            <span>{signal.region}</span>
            <span>•</span>
            <span>{signal.cluster_tag}</span>
          </div>

          <h3 className="mt-2 text-base font-semibold leading-6 text-white">
            {signal.headline}
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-300">
            {safeText(signal.summary, "No signal summary available yet.")}
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-2 text-xs text-slate-300 xl:min-w-[170px]">
          <div className="flex justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/45 px-3 py-2">
            <span>Confidence</span>
            <span className="font-medium text-white">
              {toScore(
                (signal as any).confidence_score ?? (signal as any).confidence
              )}
              %
            </span>
          </div>

          <div className="flex justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/45 px-3 py-2">
            <span>Strength</span>
            <span className="font-medium text-white">
              {toScore((signal as any).signal_strength)}%
            </span>
          </div>

          <div className="flex justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/45 px-3 py-2">
            <span>Time</span>
            <span className="font-medium text-white">
              {getRelativeTime(signal)}
            </span>
          </div>
        </div>
      </div>

      {onOpen ? (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onOpen(signal);
            }}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
          >
            Open signal
          </button>
        </div>
      ) : null}
    </article>
  );
}

function AgentCard({
  title,
  role,
  insightTitle,
  body,
  active,
}: {
  title: string;
  role: string;
  insightTitle: string;
  body: string;
  active: boolean;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-white">{title}</div>
          <div className="mt-1 text-xs text-slate-400">{role}</div>
        </div>

        <span
          className={[
            "rounded-full border px-3 py-1 text-xs",
            active
              ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
              : "border-white/10 bg-white/5 text-slate-300",
          ].join(" ")}
        >
          {active ? "Active" : "Ready"}
        </span>
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/45 p-4">
        <div className="text-sm font-medium text-white">{insightTitle}</div>
        <p className="mt-2 text-sm leading-6 text-slate-300">{body}</p>
      </div>
    </article>
  );
}

export default function CommandCenterWorkspace({
  summary,
  signals,
  opportunities,
  chainOutputs,
  profile,
  onOpenSignal,
  onNavigate,
}: CommandCenterWorkspaceProps) {
  const [mode, setMode] = useState<CommandMode>("executive");
  const [motionPreference, setMotionPreference] =
    useState<MotionPreference>("strategic");
  const [focusTarget, setFocusTarget] = useState<string>("signals");
  const [clock, setClock] = useState("");

  useEffect(() => {
    const updateClock = () => {
      setClock(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };

    updateClock();
    const timer = window.setInterval(updateClock, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const riskSignals = useMemo(
    () => signals.filter((signal) => signal.kind === "risk"),
    [signals]
  );

  const opportunitySignals = useMemo(
    () => signals.filter((signal) => signal.kind === "opportunity"),
    [signals]
  );

  const strongestSignals = useMemo(() => {
    return [...signals]
      .sort(
        (a: any, b: any) =>
          toScore(b.signal_strength ?? b.confidence_score, 0) -
          toScore(a.signal_strength ?? a.confidence_score, 0)
      )
      .slice(0, 5);
  }, [signals]);

  const topOpportunities = useMemo(() => {
    return [...opportunities]
      .sort(
        (a: any, b: any) =>
          toScore(b.score ?? b.confidence, 0) -
          toScore(a.score ?? a.confidence, 0)
      )
      .slice(0, 4);
  }, [opportunities]);

  const riskScore = toScore(summary.overall_risk_score, 0);
  const opportunityScore = toScore(summary.opportunity_score, 0);
  const confidenceScore =
    toScore(summary.confidence, 0) ||
    getAvgSignalScore(signals, "confidence_score");

  const analystTitle = safeText(
    chainOutputs?.analyse?.headline,
    strongestSignals[0]?.headline ||
      "GeoPulse is monitoring active signal movement."
  );

  const analystBody = safeText(
    chainOutputs?.analyse?.key_insight,
    summary.summary ||
      "Run the Agent Chain to generate a deeper analyst interpretation from the current live signal picture."
  );

  const advisorTitle = safeText(
    chainOutputs?.advise?.headline,
    summary.opportunity_posture || "Advisor output is ready to be generated."
  );

  const advisorBody = safeText(
    chainOutputs?.advise?.key_insight,
    "GeoPulse will convert live signal movement into executive recommendations once the advisor stage has run."
  );

  const plannerTitle = safeText(
    chainOutputs?.plan?.headline,
    "Planner readiness is waiting for execution context."
  );

  const plannerBody = safeText(
    chainOutputs?.plan?.key_insight,
    "Run the full chain to convert analysis and advice into sequenced delivery actions."
  );

  const dimmed = (id: string) => Boolean(focusTarget && focusTarget !== id);
  const focused = (id: string) => focusTarget === id;

  return (
    <div className="relative min-h-[calc(100vh-3rem)] overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(14,116,144,0.34),_transparent_34%),radial-gradient(circle_at_right,_rgba(16,185,129,0.16),_transparent_26%),linear-gradient(180deg,_#020617_0%,_#020617_100%)] p-4 text-white shadow-[0_22px_70px_rgba(0,0,0,0.45)]">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute left-10 top-10 h-52 w-52 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-20 right-10 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" />
      </div>

      <div className="relative z-10 space-y-5">
        <header className="rounded-2xl border border-white/10 bg-slate-950/70 p-5 shadow-xl backdrop-blur-xl">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.32em] text-cyan-300/75">
                Executive Cognitive Intelligence Environment
              </div>

              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white xl:text-4xl">
                GeoPulse AI Command Center
              </h1>

              <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300">
                Live cockpit for risk posture, opportunity momentum, signal
                flow, agent interpretation, and executive action readiness.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                  Company: {profile?.company_name || "Not calibrated"}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                  Live signals: {signals.length}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                  Time: {clock}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate?.("executive")}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
              >
                Executive Dashboard
              </button>

              <button
                type="button"
                onClick={() => onNavigate?.("agent-chain")}
                className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/20"
              >
                Run Agent Chain
              </button>

              <button
                type="button"
                onClick={() =>
                  setMode(mode === "executive" ? "command" : "executive")
                }
                className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/20"
              >
                Mode: {mode === "executive" ? "Executive" : "Command"}
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <PresenceMetric label="Risk Pulse" value={riskScore} tone="risk" />
            <PresenceMetric
              label="Opportunity"
              value={opportunityScore}
              tone="opportunity"
            />
            <PresenceMetric
              label="Confidence"
              value={`${confidenceScore}%`}
              tone="confidence"
            />
            <PresenceMetric
              label="Signal Strength"
              value={`${getAvgSignalScore(signals, "signal_strength")}%`}
              tone="neutral"
            />
          </div>
        </header>

        <main className="grid gap-5 xl:grid-cols-12">
          <div className="space-y-5 xl:col-span-7">
            <ExecutivePanel
              id="signals"
              title="Live Signal Stream"
              eyebrow="Temporal Intelligence"
              focused={focused("signals")}
              dimmed={dimmed("signals")}
              onFocus={setFocusTarget}
            >
              <div className="space-y-4">
                {strongestSignals.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm text-slate-400">
                    No live signals are available yet. The Command Center will
                    populate as soon as /intel/signals returns data.
                  </div>
                ) : (
                  strongestSignals.map((signal) => (
                    <SignalRow
                      key={signal.id}
                      signal={signal}
                      onOpen={onOpenSignal}
                    />
                  ))
                )}
              </div>
            </ExecutivePanel>

            <ExecutivePanel
              id="opportunities"
              title="Opportunity Momentum"
              eyebrow="Forward Opportunity Intelligence"
              focused={focused("opportunities")}
              dimmed={dimmed("opportunities")}
              onFocus={setFocusTarget}
            >
              <div className="grid gap-4 md:grid-cols-2">
                {topOpportunities.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm text-slate-400 md:col-span-2">
                    No opportunities are available yet.
                  </div>
                ) : (
                  topOpportunities.map((item: any, index) => (
                    <article
                      key={`${item.id ?? item.title ?? "opportunity"}-${index}`}
                      className="rounded-2xl border border-emerald-400/15 bg-emerald-500/10 p-4"
                    >
                      <div className="text-[11px] uppercase tracking-[0.2em] text-emerald-200/80">
                        Opportunity
                      </div>
                      <h3 className="mt-2 text-base font-semibold text-white">
                        {item.title ?? "Untitled opportunity"}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        {item.summary ??
                          "No opportunity summary available yet."}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                          Score {toScore(item.score ?? item.confidence, 0)}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                          {item.timing_window ?? "Monitoring"}
                        </span>
                      </div>
                    </article>
                  ))
                )}
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => onNavigate?.("opportunities")}
                  className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/20"
                >
                  Open opportunities
                </button>
              </div>
            </ExecutivePanel>
          </div>

          <div className="space-y-5 xl:col-span-5">
            <ExecutivePanel
              id="agents"
              title="Analyst + Advisor Presence"
              eyebrow="Cognitive Agents"
              focused={focused("agents")}
              dimmed={dimmed("agents")}
              onFocus={setFocusTarget}
            >
              <div className="space-y-4">
                <AgentCard
                  title="Analyst Agent"
                  role="Risk Pattern Recognition"
                  insightTitle={analystTitle}
                  body={analystBody}
                  active={Boolean(chainOutputs?.analyse)}
                />

                <AgentCard
                  title="Advisor Agent"
                  role="Executive Action Framing"
                  insightTitle={advisorTitle}
                  body={advisorBody}
                  active={Boolean(chainOutputs?.advise)}
                />

                <AgentCard
                  title="Planner Agent"
                  role="Execution Sequencing"
                  insightTitle={plannerTitle}
                  body={plannerBody}
                  active={Boolean(chainOutputs?.plan)}
                />
              </div>
            </ExecutivePanel>

            <ExecutivePanel
              id="configuration"
              title="Motion Governance"
              eyebrow="Performance Guard"
              focused={focused("configuration")}
              dimmed={dimmed("configuration")}
              onFocus={setFocusTarget}
            >
              <div className="grid gap-3 md:grid-cols-3">
                {(["strategic", "reduced", "immersive"] as MotionPreference[]).map(
                  (option) => {
                    const active = motionPreference === option;

                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setMotionPreference(option)}
                        className={[
                          "rounded-xl border px-4 py-4 text-left transition",
                          active
                            ? "border-cyan-400/20 bg-cyan-500/10 text-white"
                            : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]",
                        ].join(" ")}
                      >
                        <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
                          Preference
                        </div>
                        <div className="mt-2 text-sm font-medium capitalize">
                          {option}
                        </div>
                      </button>
                    );
                  }
                )}
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/45 p-4 text-sm leading-7 text-slate-300">
                <div>
                  Risk signals:{" "}
                  <span className="font-medium text-white">
                    {riskSignals.length}
                  </span>
                </div>
                <div>
                  Opportunity signals:{" "}
                  <span className="font-medium text-white">
                    {opportunitySignals.length}
                  </span>
                </div>
                <div>
                  Motion profile:{" "}
                  <span className="font-medium text-white">
                    {motionPreference}
                  </span>
                </div>
                <div>
                  Command mode:{" "}
                  <span className="font-medium text-white">{mode}</span>
                </div>
              </div>
            </ExecutivePanel>
          </div>
        </main>
      </div>
    </div>
  );
}