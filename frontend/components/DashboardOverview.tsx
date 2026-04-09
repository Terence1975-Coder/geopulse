"use client";

import {
  Activity,
  ArrowDown,
  ArrowUp,
  Radar,
  ShieldAlert,
  Zap,
} from "lucide-react";

import type { DashboardSummary } from "../types/geopulse";

type Props = {
  dashboard: DashboardSummary | null;
};

function momentumIcon(direction?: string) {
  if (direction === "↑") return <ArrowUp size={18} />;
  if (direction === "↓") return <ArrowDown size={18} />;
  return <Activity size={18} />;
}

export default function DashboardOverview({ dashboard }: Props) {
  if (!dashboard) {
    return (
      <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm text-slate-400">
        No dashboard data available.
      </div>
    );
  }

  const momentum =
    typeof dashboard.momentum === "string" ? dashboard.momentum : undefined;

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-[0.2em] text-rose-200/70">
            Risk Score
          </span>
          <ShieldAlert size={18} className="text-rose-300" />
        </div>
        <div className="mt-4 text-3xl font-semibold text-white">
          {dashboard.overall_risk_score ?? "N/A"}
        </div>
        <div className="mt-2 text-sm text-slate-300">
          {dashboard.posture ?? "Unknown posture"}
        </div>
      </div>

      <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-[0.2em] text-emerald-200/70">
            Opportunity
          </span>
          <Zap size={18} className="text-emerald-300" />
        </div>
        <div className="mt-4 text-3xl font-semibold text-white">
          {dashboard.opportunity_score ?? "N/A"}
        </div>
        <div className="mt-2 text-sm text-slate-300">
          {dashboard.opportunity_posture ?? "Unknown posture"}
        </div>
      </div>

      <div className="rounded-3xl border border-cyan-400/20 bg-cyan-500/10 p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-[0.2em] text-cyan-200/70">
            Momentum
          </span>
          {momentumIcon(momentum)}
        </div>
        <div className="mt-4 text-3xl font-semibold text-white">
          {momentum ?? "—"}
        </div>
        <div className="mt-2 text-sm text-slate-300">Trend direction</div>
      </div>

      <div className="rounded-3xl border border-indigo-400/20 bg-indigo-500/10 p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-[0.2em] text-indigo-200/70">
            Coverage
          </span>
          <Radar size={18} className="text-indigo-300" />
        </div>
        <div className="mt-4 text-3xl font-semibold text-white">
          {typeof dashboard.signal_coverage === "number" ||
		  typeof dashboard.signal_coverage === "string"
			? dashboard.signal_coverage
			: "N/A"}
        </div>
        <div className="mt-2 text-sm text-slate-300">
          Active signals tracked
        </div>
      </div>
    </div>
  );
}