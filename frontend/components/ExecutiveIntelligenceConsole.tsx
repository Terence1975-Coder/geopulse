"use client";

import { useState } from "react";
import { engageAgent } from "../lib/engageAgent";
import type { AgentStage } from "../types/intelligence";
import type { AgentChainResponse } from "../types/geopulse";
import ExplainabilityPanel from "./ExplainabilityPanel";

type Props = {
  defaultStage?: AgentStage;
};

export default function ExecutiveIntelligenceConsole({
  defaultStage = "full_chain",
}: Props) {
  const [input, setInput] = useState("");
  const [stage, setStage] = useState<AgentStage>(defaultStage);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AgentChainResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRun() {
    const text = input.trim();
    if (!text || loading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await engageAgent({
        input: text,
        stage,
      });

      setResult(response as unknown as AgentChainResponse);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "GeoPulse request failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">
          Executive Intelligence Console
        </div>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          Run GeoPulse Intelligence
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)]">
        <select
          value={stage}
          onChange={(e) => setStage(e.target.value as AgentStage)}
          className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white"
        >
          <option value="analyse">Analyse</option>
          <option value="advise">Advise</option>
          <option value="plan">Plan</option>
          <option value="profile">Profile</option>
          <option value="full_chain">Full Chain</option>
          <option value="multi_path">Multi Path</option>
        </select>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe the market signal, company challenge, or opportunity..."
          className="min-h-[110px] rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => void handleRun()}
          disabled={loading || !input.trim()}
          className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20 disabled:opacity-50"
        >
          {loading ? "Running..." : "Run"}
        </button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {result ? <ExplainabilityPanel data={result} /> : null}
    </div>
  );
}