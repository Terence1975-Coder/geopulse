"use client";

import type { ConfigState } from "../types/geopulse";

type Props = {
  config: ConfigState;
  onChange: React.Dispatch<React.SetStateAction<ConfigState>>;
};

type SliderProps = {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
};

type SelectProps = {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
};

type ToggleProps = {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
};

function SliderField({
  label,
  value,
  min = 0,
  max = 100,
  onChange,
}: SliderProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="text-sm text-white/90">{label}</div>
        <div className="text-sm font-medium text-cyan-200">{value}</div>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>
  );
}

function SelectField({ label, value, options, onChange }: SelectProps) {
  return (
    <label className="block rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-3 text-sm text-white/90">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function ToggleField({ label, checked, onChange }: ToggleProps) {
  return (
    <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <div className="text-sm text-white/90">{label}</div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`rounded-full border px-4 py-2 text-sm transition ${
          checked
            ? "border-cyan-400/20 bg-cyan-500/10 text-cyan-200"
            : "border-white/10 bg-white/5 text-slate-300"
        }`}
      >
        {checked ? "Enabled" : "Disabled"}
      </button>
    </div>
  );
}

export default function ConfigurationWorkspace({ config, onChange }: Props) {
  const setField = <K extends keyof ConfigState>(key: K, value: ConfigState[K]) => {
    onChange((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-950/90 to-cyan-950/20 p-6 shadow-2xl">
        <div className="text-xs uppercase tracking-[0.28em] text-cyan-300/70">
          Configuration
        </div>
        <h2 className="mt-2 text-3xl font-semibold text-white">
          GeoPulse Configuration Workspace
        </h2>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300">
          Control signal sensitivity, recommendation posture, governance behavior,
          and live intelligence tuning for the pilot environment.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <SliderField
          label="Signal Threshold"
          value={config.signal_threshold}
          onChange={(value) => setField("signal_threshold", value)}
        />
        <SliderField
          label="Severity Weighting"
          value={config.severity_weighting}
          onChange={(value) => setField("severity_weighting", value)}
        />
        <SliderField
          label="Opportunity Sensitivity"
          value={config.opportunity_sensitivity}
          onChange={(value) => setField("opportunity_sensitivity", value)}
        />
        <SliderField
          label="Risk / Opportunity Weighting"
          value={config.risk_opportunity_weighting}
          onChange={(value) => setField("risk_opportunity_weighting", value)}
        />
        <SliderField
          label="Recommendation Aggressiveness"
          value={config.recommendation_aggressiveness}
          onChange={(value) =>
            setField("recommendation_aggressiveness", value)
          }
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <SelectField
          label="Horizon Preference"
          value={config.horizon_preference}
          options={["short-term", "balanced", "long-term"]}
          onChange={(value) => setField("horizon_preference", value)}
        />
        <SelectField
          label="Analyst Tone Mode"
          value={config.analyst_tone_mode}
          options={["boardroom", "balanced", "analytical"]}
          onChange={(value) => setField("analyst_tone_mode", value)}
        />
        <SelectField
          label="Advisor Stance Mode"
          value={config.advisor_stance_mode}
          options={["conservative", "balanced", "assertive"]}
          onChange={(value) => setField("advisor_stance_mode", value)}
        />
        <SelectField
          label="Profile Question Depth"
          value={config.profile_question_depth}
          options={["light", "medium", "deep"]}
          onChange={(value) => setField("profile_question_depth", value)}
        />
        <SelectField
          label="Refresh Cadence"
          value={config.refresh_cadence}
          options={[
            "Every 5 minutes",
            "Every 15 minutes",
            "Every 30 minutes",
            "Hourly",
          ]}
          onChange={(value) => setField("refresh_cadence", value)}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <ToggleField
          label="Live Ingestion Enabled"
          checked={config.live_ingestion_enabled}
          onChange={(value) => setField("live_ingestion_enabled", value)}
        />
        <ToggleField
          label="External Lookup Enabled"
          checked={config.external_lookup_enabled}
          onChange={(value) => setField("external_lookup_enabled", value)}
        />
        <ToggleField
          label="Anonymisation Enabled"
          checked={config.anonymisation_enabled}
          onChange={(value) => setField("anonymisation_enabled", value)}
        />
        <ToggleField
          label="Profile Enrichment Allowed"
          checked={config.profile_enrichment_allowed}
          onChange={(value) => setField("profile_enrichment_allowed", value)}
        />
      </section>
    </div>
  );
}