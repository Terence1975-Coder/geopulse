"use client";

import { useState } from "react";
import { apiPost } from "../lib/api";
import { AgentChainResponse, AgentStage } from "../types/geopulse";
import ExplainabilityPanel from "./ExplainabilityPanel";

const stageLabels: Record<AgentStage, string> = {
  analyse: "Analyse",
  advise: "Advise",
  plan: "Create Plan",
  profile: "Build Company Profile",
};

export default function ExecutiveIntelligenceConsole() {
  const [input, setInput] = useState("");
  const [companyName, setCompanyName] = useState("GeoPulse Demo Company");
  const [loadingStage, setLoadingStage] = useState<AgentStage | null>(null);
  const [response, setResponse] = useState<AgentChainResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function engage(stage: AgentStage) {
    try {
      setError(null);
      setLoadingStage(stage);

      const result = await apiPost<AgentChainResponse>("/intel/agent/engage", {
        input,
        stage,
        company_name: companyName,
        previous_chain_state: response?.chain_state ?? null,
      });

      setResponse(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run agent chain");
    } finally {
      setLoadingStage(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
          Unified Agent Console
        </div>

        <div className="mt-4 grid gap-4">
          <input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"
            placeholder="Company name"
          />

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter company context, risk signal, market event, or executive question..."
            className="min-h-[160px] rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white outline-none"
          />

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {(["analyse", "advise", "plan", "profile"] as AgentStage[]).map(
              (stage) => (
                <button
                  key={stage}
                  onClick={() => engage(stage)}
                  disabled={loadingStage === stage}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition hover:bg-white/10 disabled:opacity-60"
                >
                  {loadingStage === stage ? "Running..." : stageLabels[stage]}
                </button>
              )
            )}
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          ) : null}
        </div>
      </div>

      {response ? (
        <>
          <div className="grid gap-6 xl:grid-cols-2">
            <OutputCard title="Analysis" content={response.outputs.analyse} />
            <OutputCard title="Advice" content={response.outputs.advise} />
            <OutputCard title="Plan" content={response.outputs.plan} />
            <OutputCard title="Company Profile" content={response.outputs.profile} />
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
              Privacy Layer
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-3">
              <PanelBlock title="Raw Input" content={response.input} />
              <PanelBlock
                title="Anonymized Input"
                content={response.anonymized_input}
              />
              <PanelBlock
                title="Privacy Risk"
                content={response.privacy.risk_level}
              />
            </div>
          </div>

          <ExplainabilityPanel
            explanation={response.explanation}
            evidence={response.evidence}
          />
        </>
      ) : null}
    </div>
  );
}

function OutputCard({
  title,
  content,
}: {
  title: string;
  content?: string | null;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
        {title}
      </div>
      <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-200">
        {content || "No output yet."}
      </div>
    </div>
  );
}

function PanelBlock({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
        {title}
      </div>
      <div className="mt-2 whitespace-pre-wrap text-sm text-slate-200">
        {content}
      </div>
    </div>
  );
}