"use client";

import { AgentContribution } from "../types";

export default function AgentContributionPanel({ agents }: { agents: AgentContribution[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Multi-Agent Intelligence</h2>

      <div className="space-y-4">
        {agents.map((agent) => (
          <div key={agent.agent} className="rounded-xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900">{agent.agent}</h3>
              {agent.perspective_tags.map((tag) => (
                <span key={tag} className="rounded-full bg-indigo-50 px-2 py-1 text-xs text-indigo-700">
                  {tag}
                </span>
              ))}
            </div>

            <p className="mt-2 text-sm text-slate-600">{agent.reason}</p>

            <div className="mt-3 space-y-2">
              {agent.insight_points.map((point, index) => (
                <div key={index} className="text-sm text-slate-700">
                  • {point}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}