"use client";

import { DashboardTrendsResponse } from "../types";

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeAgo(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const mins = Math.floor(diffMs / 60000);

  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function RiskMomentumPanel({ trends }: { trends: DashboardTrendsResponse | null }) {
  if (!trends || trends.snapshots.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Risk Momentum</h2>
        <p className="mt-2 text-sm text-slate-500">No trend data available yet.</p>
      </div>
    );
  }

  const max = Math.max(...trends.snapshots.map((s) => s.overall_risk), 1);
  const latest = trends.snapshots[trends.snapshots.length - 1];
  const showBars = trends.snapshots.length > 1;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Risk Momentum</h2>
          <div className="mt-1 text-xs text-slate-500">
            last snapshot {formatTime(latest.timestamp)} · {timeAgo(latest.timestamp)}
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm font-medium text-slate-900">{trends.momentum}</div>
          <div className="text-xs text-slate-500">
            delta {trends.delta >= 0 ? `+${trends.delta}` : trends.delta}
          </div>
        </div>
      </div>

      {showBars ? (
        <div className="flex h-32 items-end gap-2">
          {trends.snapshots.map((point) => (
            <div key={point.timestamp} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-t-md bg-slate-900/80"
                style={{ height: `${Math.max(8, (point.overall_risk / max) * 100)}%` }}
              />
              <div className="text-[10px] text-slate-400">{formatTime(point.timestamp)}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
          More snapshots will appear here as GeoPulse builds risk memory over time.
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="text-xs text-slate-500">Current risk</div>
          <div className="text-xl font-semibold text-slate-900">{trends.current_overall_risk}</div>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="text-xs text-slate-500">Previous</div>
          <div className="text-xl font-semibold text-slate-900">{trends.previous_overall_risk}</div>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="text-xs text-slate-500">Momentum</div>
          <div className="text-base font-semibold text-slate-900">{trends.momentum}</div>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="text-xs text-slate-500">Posture</div>
          <div className="text-base font-semibold text-slate-900">{trends.posture}</div>
        </div>
      </div>
    </div>
  );
}