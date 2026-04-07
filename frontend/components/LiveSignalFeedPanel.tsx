"use client";

import { SignalItem } from "../types";

function badgeTone(urgency: string) {
  switch (urgency) {
    case "critical":
      return "bg-red-100 text-red-800";
    case "high":
      return "bg-orange-100 text-orange-800";
    case "medium":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
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

export default function LiveSignalFeedPanel({ signals }: { signals: SignalItem[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Live Signal Feed</h2>
        <span className="text-sm text-slate-500">{signals.length} recent</span>
      </div>

      <div className="space-y-3">
        {signals.map((signal) => (
          <div key={signal.id} className="rounded-xl border border-slate-200 p-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badgeTone(signal.urgency)}`}>
                {signal.urgency}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                {signal.horizon}
              </span>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs text-blue-700">
                confidence {signal.confidence}
              </span>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700">
                {timeAgo(signal.timestamp)}
              </span>
            </div>

            <div className="mb-3 text-xs text-slate-500">
              {signal.source} · {signal.region} · detected {formatTime(signal.timestamp)}
            </div>

            <h3 className="text-sm font-semibold text-slate-900">{signal.title}</h3>
            <p className="mt-1 text-sm text-slate-600">{signal.summary}</p>

            <div className="mt-3 flex flex-wrap gap-2">
              {signal.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}