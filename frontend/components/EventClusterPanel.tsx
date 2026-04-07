"use client";

import { EventCluster } from "../types";

function trendTone(trend: string) {
  if (trend.includes("escal")) return "text-red-700 bg-red-50";
  if (trend.includes("easing")) return "text-green-700 bg-green-50";
  return "text-slate-700 bg-slate-100";
}

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

export default function EventClusterPanel({ clusters }: { clusters: EventCluster[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Event Cluster Intelligence</h2>

      <div className="space-y-3">
        {clusters.map((cluster) => (
          <div key={cluster.cluster_id} className="rounded-xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-medium text-white">
                {cluster.dominant_risk_category}
              </span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${trendTone(cluster.trend_status)}`}>
                {cluster.trend_status}
              </span>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs text-blue-700">
                confidence {cluster.confidence}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                {cluster.horizon}
              </span>
            </div>

            <h3 className="mt-3 text-base font-semibold text-slate-900">{cluster.label}</h3>
            <p className="mt-1 text-sm text-slate-600">{cluster.summary}</p>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>{cluster.related_event_ids.length} related events</span>
              <span>•</span>
              <span>last updated {formatTime(cluster.last_updated)}</span>
              <span>•</span>
              <span>{timeAgo(cluster.last_updated)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}