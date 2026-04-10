"use client";

import { useState } from "react";
import AnalystAgentWorkspace from "../../workspaces/AnalystAgentWorkspace";
import AdvisorAgentWorkspace from "../../workspaces/AdvisorAgentWorkspace";
import PlannerAgentWorkspace from "../../workspaces/PlannerAgentWorkspace";
import type {
  ChainOutputs,
  CompanyProfile,
  WorkspaceMessage,
} from "@/types/intelligence";

export default function IntelligenceConsole() {
  const [activeWorkspace, setActiveWorkspace] = useState<
    "analyst" | "advisor" | "planner"
  >("analyst");

  const [analystMessages, setAnalystMessages] = useState<WorkspaceMessage[]>([]);
  const [advisorMessages, setAdvisorMessages] = useState<WorkspaceMessage[]>([]);
  const [plannerMessages, setPlannerMessages] = useState<WorkspaceMessage[]>([]);

  const [chainOutputs, setChainOutputs] = useState<ChainOutputs>({
    analyse: null,
    advise: null,
    plan: null,
    profile: null,
  });

  const [companyProfile] = useState<CompanyProfile>({
    company_name: "GeoPulse Pilot Company",
    sector: "Industrial Services",
    markets: ["UK", "Europe"],
    strategic_priorities: [
      "Protect margin",
      "Maintain team growth",
      "Reduce carbon emissions",
    ],
    operating_model: "B2B services with supply chain exposure",
    cost_sensitivities: ["fuel", "logistics", "imported inputs"],
    growth_objectives: ["Expand accounts", "Improve strategic resilience"],
    risk_tolerance: "balanced",
    recommendation_style: "balanced",
    notes: "Pilot configuration profile",
  });

  function renderWorkspace() {
    switch (activeWorkspace) {
      case "analyst":
        return (
          <AnalystAgentWorkspace
            messages={analystMessages}
            setMessages={setAnalystMessages}
            chainOutputs={chainOutputs}
            setChainOutputs={setChainOutputs}
            companyProfile={companyProfile}
          />
        );

      case "advisor":
        return (
          <AdvisorAgentWorkspace
            messages={advisorMessages}
            setMessages={setAdvisorMessages}
            chainOutputs={chainOutputs}
            setChainOutputs={setChainOutputs}
            companyProfile={companyProfile}
          />
        );

      case "planner":
        return (
          <PlannerAgentWorkspace
            messages={plannerMessages}
            setMessages={setPlannerMessages}
            chainOutputs={chainOutputs}
            setChainOutputs={setChainOutputs}
            companyProfile={companyProfile}
          />
        );

      default:
        return null;
    }
  }

  return (
    <div className="grid h-screen grid-rows-[auto_1fr] bg-slate-950 text-white">
      <div className="border-b border-white/10 px-6 py-4">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
          GeoPulse Executive Intelligence
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setActiveWorkspace("analyst")}
            className={`rounded-xl border px-4 py-2 text-sm transition ${
              activeWorkspace === "analyst"
                ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-200"
                : "border-white/10 bg-white/5 text-white"
            }`}
          >
            Analyse
          </button>

          <button
            onClick={() => setActiveWorkspace("advisor")}
            className={`rounded-xl border px-4 py-2 text-sm transition ${
              activeWorkspace === "advisor"
                ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-200"
                : "border-white/10 bg-white/5 text-white"
            }`}
          >
            Advise
          </button>

          <button
            onClick={() => setActiveWorkspace("planner")}
            className={`rounded-xl border px-4 py-2 text-sm transition ${
              activeWorkspace === "planner"
                ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-200"
                : "border-white/10 bg-white/5 text-white"
            }`}
          >
            Create Plan
          </button>
        </div>
      </div>

      <div className="min-h-0 p-6">{renderWorkspace()}</div>
    </div>
  );
}