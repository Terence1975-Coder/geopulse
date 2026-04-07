"use client";

import { Expand } from "lucide-react";

interface Props {
  title: string;
  subtitle?: string;
  accent?: "risk" | "opportunity" | "governance" | "company" | "neutral" | "advisor";
  onExpand?: () => void;
  children: React.ReactNode;
}

const accentMap = {
  risk: "from-amber-500/20 to-red-500/10 border-amber-400/20",
  opportunity: "from-emerald-500/20 to-teal-500/10 border-emerald-400/20",
  governance: "from-indigo-500/20 to-slate-500/10 border-indigo-400/20",
  company: "from-cyan-500/20 to-blue-500/10 border-cyan-400/20",
  neutral: "from-white/10 to-white/[0.03] border-white/10",
  advisor: "from-emerald-500/15 to-amber-500/10 border-emerald-400/20",
};

export default function DashboardPanel({
  title,
  subtitle,
  accent = "neutral",
  onExpand,
  children,
}: Props) {
  return (
    <section
      className={[
        "rounded-2xl border bg-gradient-to-br p-5 shadow-xl backdrop-blur-xl",
        accentMap[accent],
      ].join(" ")}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-semibold text-white">{title}</div>
          {subtitle && <div className="mt-1 text-sm text-slate-300">{subtitle}</div>}
        </div>

        {onExpand && (
          <button
            onClick={onExpand}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 transition hover:bg-white/10"
          >
            <span className="flex items-center gap-2">
              <Expand size={14} />
              Expand
            </span>
          </button>
        )}
      </div>

      {children}
    </section>
  );
}