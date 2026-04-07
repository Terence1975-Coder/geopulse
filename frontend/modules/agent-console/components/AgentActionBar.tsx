"use client";

import { ActionType } from "../types/agentConsole";

const actions: { id: ActionType; label: string }[] = [
  { id: "analyze", label: "Analyse" },
  { id: "advise", label: "Advise" },
  { id: "plan", label: "Create Plan" },
  { id: "build_profile", label: "Build Company Profile" },
];

type Props = {
  onAction: (action: ActionType) => void;
  isRunning: boolean;
  activeAction: ActionType | null;
};

export function AgentActionBar({ onAction, isRunning, activeAction }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={() => onAction(action.id)}
          disabled={isRunning}
          className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20 disabled:opacity-50"
        >
          {isRunning && activeAction === action.id ? "Running..." : action.label}
        </button>
      ))}
    </div>
  );
}