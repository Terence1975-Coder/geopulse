"use client";

import { useMemo, useState } from "react";
import DemoModeToggle from "./DemoModeToggle";

export type OnboardingValues = {
  company_name: string;
  sector: string;
  markets: string;
  strategic_priorities: string;
  risk_tolerance: string;
  recommendation_style: string;
  website_url: string;
  uploaded_documents: string[];
};

type Props = {
  initialValues?: Partial<OnboardingValues>;
  demoMode: boolean;
  onToggleDemoMode: (enabled: boolean) => void;
  onStart: (values: OnboardingValues) => void | Promise<void>;
  loading?: boolean;
};

const DEFAULT_VALUES: OnboardingValues = {
  company_name: "",
  sector: "",
  markets: "",
  strategic_priorities: "",
  risk_tolerance: "balanced",
  recommendation_style: "balanced",
  website_url: "",
  uploaded_documents: [],
};

function splitCsv(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function StepChip({
  step,
  label,
  active,
  complete,
}: {
  step: number;
  label: string;
  active: boolean;
  complete: boolean;
}) {
  return (
    <div
      className={[
        "rounded-2xl border px-4 py-3",
        active
          ? "border-cyan-400/25 bg-cyan-500/10"
          : complete
          ? "border-emerald-400/25 bg-emerald-500/10"
          : "border-white/10 bg-white/[0.03]",
      ].join(" ")}
    >
      <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
        Step {step}
      </div>
      <div className="mt-1 text-sm font-medium text-white">{label}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <div className="mb-3 text-sm text-white/90">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <div className="mb-3 text-sm text-white/90">{label}</div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
      />
    </label>
  );
}

export default function OnboardingFlow({
  initialValues,
  demoMode,
  onToggleDemoMode,
  onStart,
  loading = false,
}: Props) {
  const [step, setStep] = useState(1);
  const [values, setValues] = useState<OnboardingValues>({
    ...DEFAULT_VALUES,
    ...initialValues,
  });

  const canContinueStep1 = useMemo(() => {
    return Boolean(values.company_name.trim() && values.sector.trim());
  }, [values.company_name, values.sector]);

  const canContinueStep2 = useMemo(() => {
    return Boolean(
      values.risk_tolerance.trim() && values.recommendation_style.trim()
    );
  }, [values.risk_tolerance, values.recommendation_style]);

  const canStart = useMemo(() => {
    return canContinueStep1 && canContinueStep2;
  }, [canContinueStep1, canContinueStep2]);

  const profileReadiness = useMemo(() => {
    const checks = [
      values.company_name,
      values.sector,
      splitCsv(values.markets).length > 0 ? "ok" : "",
      splitCsv(values.strategic_priorities).length > 0 ? "ok" : "",
      values.risk_tolerance,
      values.recommendation_style,
      values.website_url,
    ];

    return Math.round(
      (checks.filter(Boolean).length / checks.length) * 100
    );
  }, [
    values.company_name,
    values.sector,
    values.markets,
    values.strategic_priorities,
    values.risk_tolerance,
    values.recommendation_style,
    values.website_url,
  ]);

  const setField = (key: keyof OnboardingValues, value: string | string[]) => {
    setValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const addPlaceholderDocument = () => {
    const nextCount = values.uploaded_documents.length + 1;
    setField("uploaded_documents", [
      ...values.uploaded_documents,
      `Document ${nextCount}`,
    ]);
  };

  const applyDemoPreset = () => {
    setValues({
      company_name: "GeoPulse Intelligence Ltd",
      sector: "Professional Services",
      markets: "UK, Europe",
      strategic_priorities:
        "Protect margin, Grow revenue, Improve strategic visibility",
      risk_tolerance: "balanced",
      recommendation_style: "boardroom",
      website_url: "https://www.geopulse.ai",
      uploaded_documents: ["Company overview", "Service positioning"],
    });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(6,182,212,0.16),_transparent_30%),radial-gradient(circle_at_right,_rgba(16,185,129,0.12),_transparent_28%),linear-gradient(180deg,_#020617_0%,_#020617_100%)] text-white">
      <div className="mx-auto flex min-h-screen max-w-[1500px] items-center px-4 py-8 md:px-6 lg:px-8">
        <div className="grid w-full gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[34px] border border-white/10 bg-gradient-to-br from-slate-950 via-[#071224] to-slate-950 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-[11px] uppercase tracking-[0.34em] text-cyan-300">
                GeoPulse Pilot Experience
              </div>
              <DemoModeToggle
                enabled={demoMode}
                onChange={(enabled) => {
                  onToggleDemoMode(enabled);
                  if (enabled) applyDemoPreset();
                }}
              />
            </div>

            <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-[1.02] text-white md:text-5xl">
              Set up GeoPulse in under two minutes.
            </h1>

            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300">
              GeoPulse calibrates to your business first, then runs an executive
              intelligence chain that shows what matters, why it matters, and what
              to do next.
            </p>

            <div className="mt-8 grid gap-3 md:grid-cols-4">
              <StepChip step={1} label="Company" active={step === 1} complete={step > 1} />
              <StepChip step={2} label="Calibration" active={step === 2} complete={step > 2} />
              <StepChip step={3} label="Optional Inputs" active={step === 3} complete={step > 3} />
              <StepChip step={4} label="Start GeoPulse" active={step === 4} complete={false} />
            </div>

            <div className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.04] p-5 md:p-6">
              {step === 1 ? (
                <div className="space-y-5">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Step 1
                    </div>
                    <h2 className="mt-2 text-2xl font-semibold text-white">
                      Company setup
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-slate-300">
                      Give GeoPulse enough context to personalise its first readout.
                    </p>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <Field
                      label="Company name"
                      value={values.company_name}
                      onChange={(value) => setField("company_name", value)}
                      placeholder="Synnevent Consulting"
                    />
                    <Field
                      label="Sector"
                      value={values.sector}
                      onChange={(value) => setField("sector", value)}
                      placeholder="Professional Services"
                    />
                  </div>

                  <Field
                    label="Markets"
                    value={values.markets}
                    onChange={(value) => setField("markets", value)}
                    placeholder="UK, Europe"
                  />

                  <TextAreaField
                    label="Strategic priorities"
                    value={values.strategic_priorities}
                    onChange={(value) => setField("strategic_priorities", value)}
                    placeholder="Protect margin, Grow revenue, Improve strategic visibility"
                  />

                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={!canContinueStep1}
                      onClick={() => setStep(2)}
                      className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-5 py-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/20 disabled:opacity-50"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="space-y-5">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Step 2
                    </div>
                    <h2 className="mt-2 text-2xl font-semibold text-white">
                      Calibration
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-slate-300">
                      Tune GeoPulse for how this business thinks and decides.
                    </p>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <Field
                      label="Risk tolerance"
                      value={values.risk_tolerance}
                      onChange={(value) => setField("risk_tolerance", value)}
                      placeholder="balanced"
                    />
                    <Field
                      label="Recommendation style"
                      value={values.recommendation_style}
                      onChange={(value) => setField("recommendation_style", value)}
                      placeholder="boardroom"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-slate-200 transition hover:bg-white/10"
                    >
                      Back
                    </button>

                    <button
                      type="button"
                      disabled={!canContinueStep2}
                      onClick={() => setStep(3)}
                      className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-5 py-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/20 disabled:opacity-50"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              ) : null}

              {step === 3 ? (
                <div className="space-y-5">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Step 3
                    </div>
                    <h2 className="mt-2 text-2xl font-semibold text-white">
                      Optional inputs
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-slate-300">
                      Add signals that help GeoPulse personalise faster.
                    </p>
                  </div>

                  <Field
                    label="Website URL"
                    value={values.website_url}
                    onChange={(value) => setField("website_url", value)}
                    placeholder="https://yourcompany.com"
                  />

                  <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/50 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-white">
                          Document uploads
                        </div>
                        <div className="mt-1 text-sm text-slate-400">
                          Placeholder UI for financials, strategy packs, company history,
                          or customer material.
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={addPlaceholderDocument}
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
                      >
                        Add placeholder
                      </button>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {values.uploaded_documents.length === 0 ? (
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400">
                          No documents added yet
                        </span>
                      ) : (
                        values.uploaded_documents.map((doc, index) => (
                          <span
                            key={`${doc}-${index}`}
                            className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-100"
                          >
                            {doc}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-slate-200 transition hover:bg-white/10"
                    >
                      Back
                    </button>

                    <button
                      type="button"
                      onClick={() => setStep(4)}
                      className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-5 py-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/20"
                    >
                      Review setup
                    </button>
                  </div>
                </div>
              ) : null}

              {step === 4 ? (
                <div className="space-y-5">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Step 4
                    </div>
                    <h2 className="mt-2 text-2xl font-semibold text-white">
                      Start GeoPulse
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-slate-300">
                      GeoPulse will immediately run its executive chain and prepare the first plan.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Company
                      </div>
                      <div className="mt-2 text-lg font-semibold text-white">
                        {values.company_name || "Not set"}
                      </div>
                      <div className="mt-2 text-sm text-slate-300">
                        {values.sector || "No sector set"}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-emerald-200/80">
                        Readiness
                      </div>
                      <div className="mt-2 text-lg font-semibold text-white">
                        {profileReadiness}% calibrated
                      </div>
                      <div className="mt-2 text-sm text-slate-100">
                        Enough context to generate a strong first intelligence pass.
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <div className="text-sm font-medium text-white">
                      First-run prompt
                    </div>
                    <p className="mt-2 text-sm leading-7 text-slate-300">
                      Identify key risks and opportunities affecting this business right now.
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-slate-200 transition hover:bg-white/10"
                    >
                      Back
                    </button>

                    <button
                      type="button"
                      disabled={!canStart || loading}
                      onClick={() => void onStart(values)}
                      className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-6 py-3 text-sm font-medium text-emerald-100 transition hover:bg-emerald-500/20 disabled:opacity-50"
                    >
                      {loading ? "Starting GeoPulse..." : "Start GeoPulse"}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-[34px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] md:p-8">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
                What you get
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-sm font-medium text-white">
                    Situation overview
                  </div>
                  <p className="mt-2 text-sm leading-7 text-slate-300">
                    GeoPulse quickly frames the operating picture without drowning the user in noise.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-sm font-medium text-white">
                    Recommended action
                  </div>
                  <p className="mt-2 text-sm leading-7 text-slate-300">
                    The first run lands on what to do next, not just what is happening.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-sm font-medium text-white">
                    Planner handoff
                  </div>
                  <p className="mt-2 text-sm leading-7 text-slate-300">
                    The chosen path carries straight into execution rather than stopping at analysis.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[34px] border border-cyan-400/20 bg-cyan-500/10 p-6 md:p-8">
              <div className="text-xs uppercase tracking-[0.24em] text-cyan-200/80">
                Demo-ready
              </div>
              <h3 className="mt-3 text-2xl font-semibold text-white">
                Built for pilot calls, investor demos, and client walkthroughs.
              </h3>
              <p className="mt-4 text-sm leading-7 text-slate-100">
                Demo Mode preloads stronger setup context and reduces empty-state friction while
                preserving the same core GeoPulse chain flow.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}