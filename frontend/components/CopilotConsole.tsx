"use client";

import { DashboardResponse } from "../types";

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

export default function CopilotConsole({ dashboard }: { dashboard: DashboardResponse | null }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold text-slate-900">Enhanced Copilot Console</h2>

      {!dashboard ? (
        <p className="text-sm text-slate-500">Waiting for intelligence...</p>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
            {dashboard.summary}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="rounded-full bg-slate-100 px-3 py-1">
              narrative updated {formatTime(dashboard.updated_at)}
            </span>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
              {timeAgo(dashboard.updated_at)}
            </span>
          </div>

          <div>
            <div className="mb-2 text-sm font-medium text-slate-800">Contributing agents</div>
            <div className="flex flex-wrap gap-2">
              {dashboard.contributing_agents.map((agent) => (
                <span key={agent.agent} className="rounded-full bg-indigo-50 px-3 py-1 text-xs text-indigo-700">
                  {agent.agent}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 p-3">
              <div className="text-xs text-slate-500">Urgency</div>
              <div className="text-base font-semibold text-slate-900">{dashboard.urgency}</div>
            </div>
            <div className="rounded-xl border border-slate-200 p-3">
              <div className="text-xs text-slate-500">Confidence</div>
              <div className="text-base font-semibold text-slate-900">{dashboard.confidence}</div>
            </div>
            <div className="rounded-xl border border-slate-200 p-3">
              <div className="text-xs text-slate-500">Action horizon</div>
              <div className="text-base font-semibold text-slate-900">{dashboard.horizon}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}