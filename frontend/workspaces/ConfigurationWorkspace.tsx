"use client";

import BaseAgentWorkspace from "../components/intelligence/BaseAgentWorkspace";
import { ConfigState } from "../types/geopulse";
import type {
  ChainOutputs,
  CompanyProfile,
  WorkspaceMessage,
} from "../types/intelligence";

interface Props {
  config: ConfigState;
  onChange: (next: ConfigState) => void;

  analystMessages: WorkspaceMessage[];
  setAnalystMessages: React.Dispatch<React.SetStateAction<WorkspaceMessage[]>>;

  advisorMessages: WorkspaceMessage[];
  setAdvisorMessages: React.Dispatch<React.SetStateAction<WorkspaceMessage[]>>;

  chainOutputs: ChainOutputs;
  setChainOutputs: React.Dispatch<React.SetStateAction<ChainOutputs>>;

  companyProfile?: CompanyProfile | null;
}

export default function ConfigurationWorkspace({
  config,
  onChange,
  analystMessages,
  setAnalystMessages,
  advisorMessages,
  setAdvisorMessages,
  chainOutputs,
  setChainOutputs,
  companyProfile,
}: Props) {
  const setField = <K extends keyof ConfigState>(
    key: K,
    value: ConfigState[K]
  ) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-slate-400/20 bg-gradient-to-br from-slate-900/90 via-slate-950/90 to-slate-800/30 p-6 shadow-2xl">
        <div className="text-xs uppercase tracking-[0.28em] text-slate-400">
          Configuration
        </div>
        <h2 className="mt-2 text-3xl font-semibold text-white">
          Calibration, Settings & Agent Control
        </h2>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300">
          Tune platform behaviour, signal sensitivity, agent posture, ingestion
          readiness, privacy permissions, and directly engage the embedded
          analyst and advisor workspaces from one control surface.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <ConfigCard title="Intelligence Settings">
          <Slider
            label="Signal Threshold"
            value={config.signal_threshold}
            onChange={(v) => setField("signal_threshold", v)}
          />
          <Slider
            label="Severity Weighting"
            value={config.severity_weighting}
            onChange={(v) => setField("severity_weighting", v)}
          />
          <Slider
            label="Opportunity Sensitivity"
            value={config.opportunity_sensitivity}
            onChange={(v) => setField("opportunity_sensitivity", v)}
          />
          <Slider
            label="Risk / Opportunity Weighting"
            value={config.risk_opportunity_weighting}
            onChange={(v) => setField("risk_opportunity_weighting", v)}
          />
          <Select
            label="Horizon Preference"
            value={config.horizon_preference}
            onChange={(v) =>
              setField(
                "horizon_preference",
                v as ConfigState["horizon_preference"]
              )
            }
            options={["immediate", "balanced", "longer-term"]}
          />
        </ConfigCard>

        <ConfigCard title="Agent Behaviour Settings">
          <Select
            label="Analyst Tone Mode"
            value={config.analyst_tone_mode}
            onChange={(v) =>
              setField(
                "analyst_tone_mode",
                v as ConfigState["analyst_tone_mode"]
              )
            }
            options={["boardroom", "analytical", "calm"]}
          />
          <Select
            label="Advisor Stance Mode"
            value={config.advisor_stance_mode}
            onChange={(v) =>
              setField(
                "advisor_stance_mode",
                v as ConfigState["advisor_stance_mode"]
              )
            }
            options={["conservative", "balanced", "aggressive"]}
          />
          <Slider
            label="Recommendation Aggressiveness"
            value={config.recommendation_aggressiveness}
            onChange={(v) => setField("recommendation_aggressiveness", v)}
          />
          <Select
            label="Profile Question Depth"
            value={config.profile_question_depth}
            onChange={(v) =>
              setField(
                "profile_question_depth",
                v as ConfigState["profile_question_depth"]
              )
            }
            options={["light", "medium", "deep"]}
          />
        </ConfigCard>

        <ConfigCard title="Source Settings">
          <Toggle
            label="Live Ingestion Enabled"
            checked={config.live_ingestion_enabled}
            onChange={() =>
              setField("live_ingestion_enabled", !config.live_ingestion_enabled)
            }
          />
          <Input
            label="Refresh Cadence"
            value={config.refresh_cadence}
            onChange={(v) => setField("refresh_cadence", v)}
          />
          <Toggle
            label="External Lookup Enabled"
            checked={config.external_lookup_enabled}
            onChange={() =>
              setField(
                "external_lookup_enabled",
                !config.external_lookup_enabled
              )
            }
          />
        </ConfigCard>

        <ConfigCard title="Privacy Settings">
          <Toggle
            label="Anonymisation Enabled"
            checked={config.anonymisation_enabled}
            onChange={() =>
              setField("anonymisation_enabled", !config.anonymisation_enabled)
            }
          />
          <Toggle
            label="Profile Enrichment Allowed"
            checked={config.profile_enrichment_allowed}
            onChange={() =>
              setField(
                "profile_enrichment_allowed",
                !config.profile_enrichment_allowed
              )
            }
          />
        </ConfigCard>
      </div>

      <section className="rounded-[32px] border border-cyan-400/15 bg-gradient-to-br from-slate-950/95 via-slate-950/90 to-cyan-950/20 p-6 shadow-2xl">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.28em] text-cyan-300/70">
              Embedded Agents
            </div>
            <h3 className="mt-2 text-2xl font-semibold text-white">
              Analyst and Advisor Control Surface
            </h3>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300">
              These workspaces remain fully persistent because they still use the
              same page-level message state and chain output state. You are only
              changing where they appear in the UI.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
            Shared chain state active
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <div className="min-h-[760px]">
            <BaseAgentWorkspace
              title="Analyst Workspace"
              stage="analyse"
              stageLabel="Analyst Agent"
              messages={analystMessages}
              setMessages={setAnalystMessages}
              chainOutputs={chainOutputs}
              setChainOutputs={setChainOutputs}
              companyProfile={companyProfile}
            />
          </div>

          <div className="min-h-[760px]">
            <BaseAgentWorkspace
              title="Advisor Workspace"
              stage="advise"
              stageLabel="Advisor Agent"
              messages={advisorMessages}
              setMessages={setAdvisorMessages}
              chainOutputs={chainOutputs}
              setChainOutputs={setChainOutputs}
              companyProfile={companyProfile}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function ConfigCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="text-lg font-semibold text-white">{title}</div>
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  );
}

function Slider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-300">{label}</div>
        <div className="text-sm font-medium text-white">{value}</div>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 w-full"
      />
    </div>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <div className="mb-2 text-sm text-slate-300">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-4 text-left"
    >
      <span className="text-sm text-slate-300">{label}</span>
      <div
        className={[
          "h-6 w-11 rounded-full border transition",
          checked
            ? "border-emerald-400/30 bg-emerald-500/30"
            : "border-white/10 bg-white/10",
        ].join(" ")}
      >
        <div
          className={[
            "mt-[2px] h-5 w-5 rounded-full bg-white transition",
            checked ? "ml-[22px]" : "ml-[2px]",
          ].join(" ")}
        />
      </div>
    </button>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <div className="mb-2 text-sm text-slate-300">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white"
      />
    </label>
  );
}