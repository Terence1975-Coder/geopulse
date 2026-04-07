"use client";

import { CompanyProfile } from "../types";

interface Props {
  profile: CompanyProfile;
  onChange?: (profile: CompanyProfile) => void;
}

export default function CompanyProfilePanel({ profile, onChange }: Props) {
  const update = <K extends keyof CompanyProfile>(
    key: K,
    value: CompanyProfile[K]
  ) => {
    if (!onChange) return;
    onChange({
      ...profile,
      [key]: value,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs uppercase tracking-wide text-slate-400">
          Company
        </div>
        <div className="mt-1 text-lg font-semibold text-white">
          {profile.company_name || "My Company"}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-slate-400">Sector</label>
          <input
            type="text"
            value={profile.sector || ""}
            onChange={(e) => update("sector", e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-slate-400">Sub-sector</label>
          <input
            type="text"
            value={profile.sub_sector || ""}
            onChange={(e) => update("sub_sector", e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs text-slate-400">
          Exposure regions
        </label>
        <input
          type="text"
          value={(profile.supply_chain_exposure_regions || []).join(", ")}
          onChange={(e) =>
            update(
              "supply_chain_exposure_regions",
              e.target.value
                .split(",")
                .map((x) => x.trim())
                .filter(Boolean)
            )
          }
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
          placeholder="UK, EU, APAC"
        />
      </div>

      <div className="space-y-3">
        <SliderField
          label="Energy dependency"
          value={profile.energy_dependency_level ?? 50}
          onChange={(v) => update("energy_dependency_level", v)}
        />

        <SliderField
          label="Import / export exposure"
          value={profile.import_export_exposure ?? 50}
          onChange={(v) => update("import_export_exposure", v)}
        />

        <SliderField
          label="Consumer sensitivity"
          value={profile.consumer_sensitivity_level ?? 50}
          onChange={(v) => update("consumer_sensitivity_level", v)}
        />

        <SliderField
          label="Financial leverage sensitivity"
          value={profile.financial_leverage_sensitivity ?? 50}
          onChange={(v) => update("financial_leverage_sensitivity", v)}
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-slate-400">
          Strategic priorities
        </label>
        <input
          type="text"
          value={(profile.strategic_priorities || []).join(", ")}
          onChange={(e) =>
            update(
              "strategic_priorities",
              e.target.value
                .split(",")
                .map((x) => x.trim())
                .filter(Boolean)
            )
          }
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
          placeholder="resilience, growth, margin protection"
        />
      </div>
    </div>
  );
}

function SliderField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>
  );
}