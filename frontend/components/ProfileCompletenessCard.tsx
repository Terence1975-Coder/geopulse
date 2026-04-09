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
    <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 p-4 shadow-[0_12px_28px_rgba(0,0,0,0.14)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-cyan-200">
            Profile Completeness
          </div>
          <div className="mt-1 text-2xl font-semibold text-white">{pct}%</div>
        </div>

        <div className="h-12 w-12 rounded-full border border-cyan-300/30 bg-slate-950/40 p-1">
          <div
            className="flex h-full w-full items-center justify-center rounded-full border border-cyan-300/10 text-[11px] font-semibold text-cyan-200"
            style={{
              background: `conic-gradient(rgba(34,211,238,0.7) ${pct * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
            }}
          >
            <div className="rounded-full bg-slate-950 px-1.5 py-1">{pct}%</div>
          </div>
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-300">
        Higher completeness improves alert relevance, scenario calibration,
        opportunity targeting, and advisor recommendation quality.
      </p>
    </div>
  );
}