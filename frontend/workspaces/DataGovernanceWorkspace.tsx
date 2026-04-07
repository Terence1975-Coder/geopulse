"use client";

import AnonymisationStatusPanel from "../components/AnonymisationStatusPanel";
import { GovernanceSettings } from "../types/geopulse";

interface Props {
  settings: GovernanceSettings;
  onChange: (next: GovernanceSettings) => void;
}

export default function DataGovernanceWorkspace({ settings, onChange }: Props) {
  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-indigo-400/20 bg-gradient-to-br from-slate-900/90 via-slate-950/90 to-indigo-950/30 p-6 shadow-2xl">
        <div className="text-xs uppercase tracking-[0.28em] text-indigo-300/70">Governance</div>
        <h2 className="mt-2 text-3xl font-semibold text-white">Data Governance Workspace</h2>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300">
          An enterprise-ready governance surface showing anonymisation controls, safe processing
          logic, redaction visibility, and trust indicators.
        </p>
      </section>

      <AnonymisationStatusPanel settings={settings} onChange={onChange} />

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <div className="text-sm font-medium text-white">Fields Currently Masked</div>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            <li>• Financial values</li>
            <li>• Contact identities</li>
            <li>• Sensitive company terms</li>
          </ul>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <div className="text-sm font-medium text-white">Allowed For Enrichment</div>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            <li>• Company status</li>
            <li>• SIC / industry context</li>
            <li>• High-level strategic inputs</li>
          </ul>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <div className="text-sm font-medium text-white">Source Safety Notes</div>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            External enrichment should remain permission-based. Sensitive internal context can be
            masked before deeper AI orchestration or third-party processing.
          </p>
        </div>
      </div>
    </div>
  );
}