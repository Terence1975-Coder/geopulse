"use client";

import { CompanyProfile } from "../types/geopulse";

function calculateProfileCompleteness(profile?: CompanyProfile | null) {
  if (!profile) return 0;

  const checks = [
    profile.company_name,
    profile.sector,
    profile.sub_sector,
    (profile.supply_chain_exposure_regions?.length ?? 0) > 0,
    (profile.strategic_priorities?.length ?? 0) > 0,
    profile.supplier_logistics_notes,
    profile.company_notes,
    profile.custom_intelligence_notes,
    profile.registration_number,
    profile.company_status,
    profile.sic_context,
  ];

  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
}

export default function ProfileCompletenessCard({
  profile,
}: {
  profile?: CompanyProfile | null;
}) {
  const pct = calculateProfileCompleteness(profile);

  return (
    <div className="rounded-xl border border-cyan-300 bg-cyan-50 px-5 py-4 shadow-[0_12px_24px_rgba(15,23,42,0.10)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-700">
            Profile Completeness
          </div>
          <div className="mt-2 text-4xl font-semibold leading-none text-slate-950">
            {pct}%
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-700">
            Higher completeness improves alert relevance, scenario calibration,
            opportunity targeting, and advisor recommendation quality.
          </p>
        </div>

        <div className="flex shrink-0 items-center justify-center">
          <div className="h-20 w-20 rounded-full border-4 border-cyan-300 bg-slate-900 p-1 shadow-[0_8px_18px_rgba(15,23,42,0.18)]">
            <div
              className="flex h-full w-full items-center justify-center rounded-full text-sm font-semibold text-white"
              style={{
                background: `conic-gradient(rgba(8,145,178,0.95) ${pct * 3.6}deg, rgba(148,163,184,0.25) 0deg)`,
              }}
            >
              <div className="rounded-full bg-slate-950 px-2 py-1">{pct}%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}