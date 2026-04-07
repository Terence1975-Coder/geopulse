"use client";

import { AgentChainState } from "../types/agentConsole";

export function ConsoleMetaRail({ chainState }: { chainState: AgentChainState }) {
  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">
      <div>
        <div className="text-xs uppercase tracking-wide text-slate-500">Session</div>
        <div>{chainState.session_id}</div>
      </div>
      <div>
        <div className="text-xs uppercase tracking-wide text-slate-500">Privacy Risk</div>
        <div>{chainState.privacy_risk_level || "Not assessed"}</div>
      </div>
      <div>
        <div className="text-xs uppercase tracking-wide text-slate-500">Selected Agents</div>
        <div className="space-y-1">
          {Object.entries(chainState.selected_agent_map || {}).map(([key, value]) => (
            <div key={key}>{key}: {value}</div>
          ))}
        </div>
      </div>
      <div>
        <div className="text-xs uppercase tracking-wide text-slate-500">Selected Models</div>
        <div className="space-y-1">
          {Object.entries(chainState.selected_model_map || {}).map(([key, value]) => (
            <div key={key}>{key}: {value}</div>
          ))}
        </div>
      </div>
    </div>
  );
}