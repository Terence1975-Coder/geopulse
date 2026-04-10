"use client";

import CompanyUploadPanel from "../CompanyUploadPanel";
import type { CompanyProfile } from "../../types/intelligence";

type CompanyIntelligenceWorkspaceProps = {
  profile: Partial<CompanyProfile> & Record<string, any>;
  onUpdate: (next: Partial<CompanyProfile> & Record<string, any>) => void;
};

type InputFieldProps = {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
};

type SliderFieldProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
};

function InputField({
  label,
  value,
  onChange,
  placeholder,
}: InputFieldProps) {
  return (
    <label className="block">
      <div className="mb-3 text-sm text-white/90">{label}</div>
      <input
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
      />
    </label>
  );
}

function SliderField({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
}: SliderFieldProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
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

function splitCsv(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function CompanyIntelligenceWorkspace({
  profile,
  onUpdate,
}: CompanyIntelligenceWorkspaceProps) {
  const setField = (key: string, value: any) => {
    onUpdate({
      ...profile,
      [key]: value,
    });
  };

  const completeness = (() => {
    const checks = [
      profile.company_name,
      profile.registration_number,
      profile.company_status,
      profile.incorporation_date,
      profile.sector,
      profile.sub_sector,
      profile.exposure_regions,
      profile.strategic_priorities?.length
        ? profile.strategic_priorities
        : profile.markets?.length
          ? profile.markets
          : null,
      profile.risk_tolerance,
      profile.recommendation_style,
    ];

    const complete = checks.filter(Boolean).length;
    return Math.round((complete / checks.length) * 100);
  })();

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-6">
            <div className="text-xs uppercase tracking-[0.22em] text-cyan-200/80">
              Company Enrichment
            </div>
            <div className="mt-2 text-3xl font-semibold text-white">
              Companies House Lookup
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-200">
              Live-compatible scaffold for external company enrichment and
              profile population.
            </p>

            <div className="mt-6 flex gap-3">
              <input
                value={profile.company_name ?? ""}
                onChange={(e) => setField("company_name", e.target.value)}
                placeholder="Search company name..."
                className="flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
              />
              <button
                type="button"
                className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-6 py-3 text-sm font-medium text-cyan-100"
              >
                Search
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-black/20 p-5">
                <div className="text-base font-medium text-white">
                  Results Preview
                </div>
                <div className="mt-4 text-sm text-white/45">No results yet</div>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/20 p-5">
                <div className="text-base font-medium text-white">
                  Selected Company Details
                </div>
                <div className="mt-4 text-sm text-white/45">
                  Select a result to preview details
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="text-2xl font-semibold text-white">
              Intelligence Use Notice
            </div>
            <p className="mt-5 text-base leading-8 text-slate-300">
              Company context is used to calibrate risk interpretation,
              personalise opportunity scoring, improve advisor recommendations,
              and refine scenario relevance.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm uppercase tracking-[0.18em] text-cyan-200/80">
                  Profile Completeness
                </div>
                <div className="mt-2 text-5xl font-semibold text-white">
                  {completeness}%
                </div>
                <p className="mt-4 max-w-xl text-sm leading-7 text-slate-200">
                  Higher completeness improves alert relevance, scenario
                  calibration, opportunity targeting, and advisor recommendation
                  quality.
                </p>
              </div>

              <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-cyan-300/40 text-xl font-semibold text-cyan-100">
                {completeness}%
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="text-3xl font-semibold text-white">
              Company Knowledge Editor
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <InputField
                label="Company Name"
                value={profile.company_name ?? ""}
                onChange={(v) => setField("company_name", v)}
              />

              <InputField
                label="Registration Number"
                value={profile.registration_number ?? ""}
                onChange={(v) => setField("registration_number", v)}
              />

              <InputField
                label="Company Status"
                value={profile.company_status ?? ""}
                onChange={(v) => setField("company_status", v)}
              />

              <InputField
                label="Incorporation Date"
                value={profile.incorporation_date ?? ""}
                onChange={(v) => setField("incorporation_date", v)}
              />

              <InputField
                label="SIC / Industry Context"
                value={profile.sic_context ?? ""}
                onChange={(v) => setField("sic_context", v)}
              />

              <InputField
                label="Sector"
                value={profile.sector ?? ""}
                onChange={(v) => setField("sector", v)}
              />

              <InputField
                label="Sub-Sector"
                value={profile.sub_sector ?? ""}
                onChange={(v) => setField("sub_sector", v)}
              />

              <InputField
                label="Exposure Regions"
                value={
                  typeof profile.exposure_regions === "string"
                    ? profile.exposure_regions
                    : Array.isArray(profile.markets)
                      ? profile.markets.join(", ")
                      : ""
                }
                onChange={(v) => {
                  setField("exposure_regions", v);
                  setField("markets", splitCsv(v));
                }}
              />

              <InputField
                label="Strategic Priorities"
                value={(profile.strategic_priorities ?? []).join(", ")}
                onChange={(v) => setField("strategic_priorities", splitCsv(v))}
                placeholder="Protect margin, Grow revenue, Improve visibility"
              />

              <InputField
                label="Recommendation Style"
                value={profile.recommendation_style ?? "balanced"}
                onChange={(v) => setField("recommendation_style", v)}
              />

              <InputField
                label="Risk Tolerance"
                value={profile.risk_tolerance ?? "balanced"}
                onChange={(v) => setField("risk_tolerance", v)}
              />

              <InputField
                label="Growth Objectives"
                value={(profile.growth_objectives ?? []).join(", ")}
                onChange={(v) => setField("growth_objectives", splitCsv(v))}
              />

              <InputField
                label="Cost Sensitivities"
                value={(profile.cost_sensitivities ?? []).join(", ")}
                onChange={(v) => setField("cost_sensitivities", splitCsv(v))}
              />

              <InputField
                label="Supply Chain Exposure Regions"
                value={(profile.supply_chain_exposure_regions ?? []).join(", ")}
                onChange={(v) =>
                  setField("supply_chain_exposure_regions", splitCsv(v))
                }
              />

              <div className="md:col-span-2">
                <label className="block">
                  <div className="mb-3 text-sm text-white/90">Notes</div>
                  <textarea
                    value={profile.notes ?? ""}
                    onChange={(e) => setField("notes", e.target.value)}
                    rows={4}
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
                  />
                </label>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <SliderField
                label="Energy Dependency"
                value={Number(profile.energy_dependency ?? 38)}
                onChange={(v) => setField("energy_dependency", v)}
              />

              <SliderField
                label="Import / Export Exposure"
                value={Number(profile.import_export_exposure ?? 42)}
                onChange={(v) => setField("import_export_exposure", v)}
              />

              <SliderField
                label="Consumer Sensitivity"
                value={Number(profile.consumer_sensitivity ?? 51)}
                onChange={(v) => setField("consumer_sensitivity", v)}
              />

              <SliderField
                label="Financial Leverage Sensitivity"
                value={Number(profile.financial_leverage_sensitivity ?? 34)}
                onChange={(v) => setField("financial_leverage_sensitivity", v)}
              />
            </div>
          </div>
        </div>
      </div>

      <CompanyUploadPanel />
    </div>
  );
}