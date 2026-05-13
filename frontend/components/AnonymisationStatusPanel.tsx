"use client";

import { GovernanceSettings } from "../types/geopulse";

interface Props {
  settings: GovernanceSettings;
  onChange: (next: GovernanceSettings) => void;
}

export default function AnonymisationStatusPanel({ settings, onChange }: Props) {
  const update = (key: keyof GovernanceSettings) => {
    onChange({ ...settings, [key]: !settings[key] });
  };

  const toggles: { key: keyof GovernanceSettings; label: string }[] = [
    { key: "mask_company_sensitive_terms", label: "Mask company-sensitive terms" },
    { key: "mask_financial_values", label: "Mask financial values" },
    { key: "mask_contact_identities", label: "Mask contact identities" },
    { key: "anonymise_before_ai_analysis", label: "Anonymise before AI analysis" },
    {
      key: "retain_internal_reference_labels_only",
      label: "Retain internal reference labels only",
    },
  ];

  const enabledCount = Object.values(settings).filter(Boolean).length;

  return (
    <div className="rounded-lg border border-slate-300 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-lg font-semibold text-slate-950">Anonymisation Status</div>
          <p className="mt-1 text-sm text-slate-600">
            Visible governance controls to ensure privacy-aware processing is active and clear.
          </p>
        </div>

        <div className="rounded-md border border-indigo-300/20 bg-slate-950/30 px-4 py-3 text-sm text-indigo-200">
          Trust Indicator: {enabledCount >= 4 ? "Strong" : enabledCount >= 2 ? "Moderate" : "Low"}
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {toggles.map((toggle) => (
          <button
            key={toggle.key}
            onClick={() => update(toggle.key)}
            className="flex items-center justify-between rounded-md border border-slate-300 bg-white px-4 py-4 text-left transition hover:bg-slate-900/70"
          >
            <div>
              <div className="text-sm font-medium text-slate-950">{toggle.label}</div>
            </div>
            <div
              className={[
                "h-6 w-11 rounded-full border transition",
                settings[toggle.key]
                  ? "border-emerald-400/30 bg-emerald-500/30"
                  : "border-white/10 bg-white/10",
              ].join(" ")}
            >
              <div
                className={[
                  "mt-[2px] h-5 w-5 rounded-full bg-white transition",
                  settings[toggle.key] ? "ml-[22px]" : "ml-[2px]",
                ].join(" ")}
              />
            </div>
          </button>
        ))}
      </div>

      <div className="mt-5 rounded-md border border-slate-300 bg-white p-4">
        <div className="text-sm font-medium text-slate-200">Safe Processing Summary</div>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          GeoPulse can mask sensitive company references, values, and identities before higher-order
          AI analysis. This allows users to preserve strategic value while improving privacy control
          and enterprise trust.
        </p>
      </div>
    </div>
  );
}