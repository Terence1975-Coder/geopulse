"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import DemoScenarioSelector from "../../components/demo/DemoScenarioSelector";
import DemoWorkspaceNavigation, {
  type DemoWorkspaceKey,
} from "../../components/demo/DemoWorkspaceNavigation";
import {
  demoScenarioList,
  demoScenarios,
} from "../../lib/demo/geopulse-demo-scenario";
import DemoAgentChainWorkspace from "../../workspaces/demo/DemoAgentChainWorkspace";
import DemoExecutiveDashboardView from "../../workspaces/demo/DemoExecutiveDashboardView";
import DemoPlannerWorkspace from "../../workspaces/demo/DemoPlannerWorkspace";

export default function GeoPulseDemoPage() {
  const [activeScenarioKey, setActiveScenarioKey] = useState("automotive");
  const [activeWorkspace, setActiveWorkspace] =
    useState<DemoWorkspaceKey>("executive");

  const scenario = useMemo(() => {
    return demoScenarios[activeScenarioKey] ?? demoScenarios.automotive;
  }, [activeScenarioKey]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(6,182,212,0.14),_transparent_30%),radial-gradient(circle_at_right,_rgba(16,185,129,0.10),_transparent_26%),linear-gradient(180deg,_#020617_0%,_#020617_100%)] text-white">
      <div className="mx-auto max-w-[1900px] px-4 py-6 md:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.3em] text-cyan-300/80">
              GeoPulse Demo Experience
            </div>
            <h1 className="mt-2 text-3xl font-semibold text-white md:text-4xl">
              Executive Intelligence Demo Twin
            </h1>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-200 transition hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>

            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-2.5 text-sm text-cyan-100 transition hover:bg-cyan-500/20"
            >
              Enter Live Platform
            </Link>
          </div>
        </div>

        <div className="space-y-6">
          <DemoScenarioSelector
            scenarios={demoScenarioList}
            activeScenarioKey={activeScenarioKey}
            onChange={(scenarioKey) => {
              setActiveScenarioKey(scenarioKey);
              setActiveWorkspace("executive");
            }}
          />

          <div className="grid gap-6 lg:grid-cols-[290px_minmax(0,1fr)]">
            <DemoWorkspaceNavigation
              active={activeWorkspace}
              onChange={setActiveWorkspace}
            />

            <section className="min-w-0">
              {activeWorkspace === "executive" ? (
                <DemoExecutiveDashboardView
                  scenario={scenario}
                  onOpenAgentChain={() => setActiveWorkspace("agent-chain")}
                />
              ) : null}

              {activeWorkspace === "agent-chain" ? (
                <DemoAgentChainWorkspace
                  scenario={scenario}
                  onOpenPlanner={() => setActiveWorkspace("planner")}
                />
              ) : null}

              {activeWorkspace === "planner" ? (
                <DemoPlannerWorkspace scenario={scenario} />
              ) : null}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}