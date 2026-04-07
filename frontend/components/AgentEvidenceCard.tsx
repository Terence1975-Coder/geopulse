"use client";

import { AgentEvidenceItem } from "../types/geopulse";

interface Props {
  item: AgentEvidenceItem;
}

export default function AgentEvidenceCard({ item }: Props) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium text-white">{item.title}</div>
        <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-200">
          Trust {item.trust_score}
        </div>
      </div>

      <div className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">
        {item.source_type}
      </div>

      <p className="mt-3 text-sm leading-7 text-slate-300">{item.excerpt}</p>
    </div>
  );
}