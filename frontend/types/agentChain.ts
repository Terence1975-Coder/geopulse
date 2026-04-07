"use client";

import { useState } from "react";
import AgentChainResults from "./AgentChainResults";
import { engageAgent } from "../lib/api";
import { ChainResponse } from "../types/agentChain";

export default function AgentChainWorkspace() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [error, setError] = useState("");
  const [data, setData] = useState<ChainResponse | null>(null);

  async function handleRunFullChain() {
    if (!input.trim()) {
      setError("Please enter a signal, scenario, or business input first.");
      return;
    }

    setError("");
    setLoading(true);
    setData(null);

    try {
      setLoadingStep("Analysing...");
      await new Promise((resolve) => setTimeout(resolve, 250));

      setLoadingStep("Advising...");
      await new Promise((resolve) => setTimeout(resolve, 250));

      setLoadingStep("Planning...");

      const result = await engageAgent(input, "full_chain");
      setData(result);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong running the chain.";
      setError(message);
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-950/90 to-slate-800/50 p-6 shadow-2xl">
        <div className="mb-2 text-xs uppercase tracking-[0.28em] text-slate-400">
          GeoPulse Intelligence Chain
        </div>

        <h1 className="text-3xl font-semibold text-white">
          Analyst → Advisor → Planner
        </h1>

        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
          Enter a market signal, business scenario, risk event, or strategic question.
          GeoPulse will analyse it, advise on it, and convert it into an execution plan.
        </p>

        <div className="mt-6 space-y-4">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Example: Oil prices are rising, shipping routes are under pressure, and our logistics costs may increase over the next quarter."
            className="min-h-[180px] w-full rounded-[20px] border border-white/10 bg-slate-950/80 p-4 text-sm text-white outline-none placeholder:text-slate-500"
          />

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRunFullChain}
              disabled={loading}
              className="rounded-[18px] bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Running Chain..." : "Run Full Intelligence Chain"}
            </button>

            {loading && (
              <span className="text-sm text-slate-400">{loadingStep}</span>
            )}
          </div>

          {error && (
            <div className="rounded-[16px] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}
        </div>
      </section>

      <AgentChainResults data={data} />
    </div>
  );
}