"use client";

import { useMemo, useState } from "react";
import WorkspaceNavigation from "../components/WorkspaceNavigation";
import FocusModePanelShell from "../components/FocusModePanelShell";
import TestGeoPulseAPI from "@/components/TestGeoPulseAPI";
import ExecutiveDashboardView from "../workspaces/ExecutiveDashboardView";
import LiveSignalsWorkspace from "../workspaces/LiveSignalsWorkspace";
import OpportunityWorkspace from "../workspaces/OpportunityWorkspace";
import CompanyIntelligenceWorkspace from "../workspaces/CompanyIntelligenceWorkspace";
import AnalystAgentWorkspace from "../workspaces/AnalystAgentWorkspace";
import AdvisorAgentWorkspace from "../workspaces/AdvisorAgentWorkspace";
import CompanyProfileAgentWorkspace from "../workspaces/CompanyProfileAgentWorkspace";
import DataGovernanceWorkspace from "../workspaces/DataGovernanceWorkspace";
import ConfigurationWorkspace from "../workspaces/ConfigurationWorkspace";

import {
  demoAnalystMessages,
  demoAdvisorMessages,
  demoCompanyProfile,
  demoConfig,
  demoDashboardSummary,
  demoGovernance,
  demoOpportunities,
  demoProfileAgentMessages,
  demoSignals,
} from "../lib/geopulse-demo-data";

import {
  AgentMessage,
  CompanyProfile,
  ConfigState,
  GovernanceSettings,
  SignalItem,
  WorkspaceKey,
} from "../types/geopulse";

export default function HomePage() {
  const [activeWorkspace, setActiveWorkspace] =
    useState<WorkspaceKey>("executive");
  const [profile, setProfile] = useState<CompanyProfile>(demoCompanyProfile);
  const [governance, setGovernance] =
    useState<GovernanceSettings>(demoGovernance);
  const [config, setConfig] = useState<ConfigState>(demoConfig);

  const [analystMessages, setAnalystMessages] =
    useState<AgentMessage[]>(demoAnalystMessages);
  const [advisorMessages, setAdvisorMessages] =
    useState<AgentMessage[]>(demoAdvisorMessages);
  const [profileMessages, setProfileMessages] =
    useState<AgentMessage[]>(demoProfileAgentMessages);

  const [focusOpen, setFocusOpen] = useState(false);
  const [focusTitle, setFocusTitle] = useState("Panel Detail");
  const [focusBreadcrumb, setFocusBreadcrumb] = useState<string[]>([
    "Executive Dashboard",
    "Panel",
  ]);
  const [selectedSignal, setSelectedSignal] = useState<SignalItem | null>(null);

  const dashboardSummary = useMemo(() => {
    const safeSummary = demoDashboardSummary ?? {
      overall_risk_score: 0,
      opportunity_score: 0,
      posture: "Unknown",
      opportunity_posture: "Unknown",
      urgency: "Unknown",
      confidence: 0,
      horizon: "Unknown",
      summary: "No executive summary available yet.",
      live_signal_count: 0,
      positive_signal_count: 0,
      agent_snapshots: {
        analyst: "No analyst snapshot available yet.",
        advisor: "No advisor snapshot available yet.",
        profile_agent: "No profile agent snapshot available yet.",
      },
    };

    return {
      ...safeSummary,
      agent_snapshots: {
        analyst:
          safeSummary.agent_snapshots?.analyst ??
          "No analyst snapshot available yet.",
        advisor:
          safeSummary.agent_snapshots?.advisor ??
          "No advisor snapshot available yet.",
        profile_agent:
          profile.strategic_priorities.length > 0
            ? `GeoPulse is currently calibrated around: ${profile.strategic_priorities.join(
                ", "
              )}. More market and exposure detail will further improve advisory precision.`
            : safeSummary.agent_snapshots?.profile_agent ??
              "No profile agent snapshot available yet.",
      },
    };
  }, [profile]);

  const openPanel = (panelTitle: string) => {
    setFocusTitle(panelTitle);
    setFocusBreadcrumb(["Executive Dashboard", panelTitle]);
    setSelectedSignal(null);
    setFocusOpen(true);
  };

  const openSignal = (signal: SignalItem) => {
    setSelectedSignal(signal);
    setFocusTitle(signal.headline);
    setFocusBreadcrumb(["Live Signals", signal.cluster_tag, "Signal Detail"]);
    setFocusOpen(true);
  };

  const appendMessage = (
    setter: React.Dispatch<React.SetStateAction<AgentMessage[]>>,
    userText: string,
    assistantText: string
  ) => {
    const now = new Date().toISOString();
    setter((prev) => [
      ...prev,
      { id: `${now}-u`, role: "user", content: userText, timestamp: now },
      { id: `${now}-a`, role: "assistant", content: assistantText, timestamp: now },
    ]);
  };

  const renderWorkspace = () => {
    switch (activeWorkspace) {
      case "executive":
        return (
          <ExecutiveDashboardView
            summary={dashboardSummary}
            signals={demoSignals}
            opportunities={demoOpportunities}
            profile={profile}
            onExpandPanel={openPanel}
            onNavigate={(target) => setActiveWorkspace(target)}
          />
        );

      case "signals":
        return (
          <LiveSignalsWorkspace
            signals={demoSignals}
            onOpenSignal={openSignal}
          />
        );

      case "opportunities":
        return <OpportunityWorkspace opportunities={demoOpportunities} />;

      case "company":
        return (
          <CompanyIntelligenceWorkspace
            profile={profile}
            onUpdate={setProfile}
          />
        );

  case "analyst":
  return (
    <AnalystAgentWorkspace
      messages={analystMessages}
      onSend={async (text) => {
        const userMessage = {
          id: crypto.randomUUID(),
          role: "user",
          timestamp: new Date().toISOString(),
          tone: "neutral",
          content: text,
        };

        setAnalystMessages((prev) => [...prev, userMessage]);

        try {
          const response = await fetch("http://127.0.0.1:8000/intel/agent/engage", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              input: text,
              stage: "analyse",
            }),
          });

          const data = await response.json();

          const analystReply = {
            id: crypto.randomUUID(),
            role: "assistant",
            timestamp: new Date().toISOString(),
            tone: "analytical",
            content:
              data?.outputs?.analyse ||
              "No analyst response returned from backend.",
          };

          setAnalystMessages((prev) => [...prev, analystReply]);
        } catch (error) {
          console.error("Analyst API call failed:", error);

          const errorReply = {
            id: crypto.randomUUID(),
            role: "assistant",
            timestamp: new Date().toISOString(),
            tone: "analytical",
            content: "Backend call failed. Check API connection and console logs.",
          };

          setAnalystMessages((prev) => [...prev, errorReply]);
        }
      }}
    />
  );
      case "advisor":
  return (
    <AdvisorAgentWorkspace
      messages={advisorMessages}
      onSend={async (text) => {
        const userMessage = {
          id: crypto.randomUUID(),
          role: "user",
          timestamp: new Date().toISOString(),
          tone: "neutral",
          content: text,
        };

        setAdvisorMessages((prev) => [...prev, userMessage]);

        try {
          const response = await fetch("http://127.0.0.1:8000/intel/agent/engage", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              input: text,
              stage: "advise",
            }),
          });

          const data = await response.json();

          const advisorReply = {
            id: crypto.randomUUID(),
            role: "assistant",
            timestamp: new Date().toISOString(),
            tone: "executive",
            content:
              data?.outputs?.advise ||
              "No advisor response returned from backend.",
          };

          setAdvisorMessages((prev) => [...prev, advisorReply]);
        } catch (error) {
          console.error("Advisor API call failed:", error);

          const errorReply = {
            id: crypto.randomUUID(),
            role: "assistant",
            timestamp: new Date().toISOString(),
            tone: "executive",
            content: "Backend call failed. Check API connection and console logs.",
          };

          setAdvisorMessages((prev) => [...prev, errorReply]);
        }
      }}
    />
  );

      case "profile-agent":
  return (
    <CompanyProfileAgentWorkspace
      messages={profileMessages}
      onSend={async (text) => {
        const userMessage = {
          id: crypto.randomUUID(),
          role: "user",
          timestamp: new Date().toISOString(),
          tone: "neutral",
          content: text,
        };

        setProfileMessages((prev) => [...prev, userMessage]);

        try {
          const response = await fetch("http://127.0.0.1:8000/intel/agent/engage", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              input: text,
              stage: "profile",
            }),
          });

          const data = await response.json();

          const profileReply = {
            id: crypto.randomUUID(),
            role: "assistant",
            timestamp: new Date().toISOString(),
            tone: "consultative",
            content:
              data?.outputs?.profile ||
              "No profile response returned from backend.",
          };

          setProfileMessages((prev) => [...prev, profileReply]);
        } catch (error) {
          console.error("Profile API call failed:", error);

          const errorReply = {
            id: crypto.randomUUID(),
            role: "assistant",
            timestamp: new Date().toISOString(),
            tone: "consultative",
            content: "Backend call failed. Check API connection and console logs.",
          };

          setProfileMessages((prev) => [...prev, errorReply]);
        }
      }}
    />
  );

      case "governance":
        return (
          <DataGovernanceWorkspace
            settings={governance}
            onChange={setGovernance}
          />
        );

      case "configuration":
        return (
          <ConfigurationWorkspace
            config={config}
            onChange={setConfig}
          />
        );

      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(6,182,212,0.12),_transparent_30%),radial-gradient(circle_at_right,_rgba(16,185,129,0.10),_transparent_25%),linear-gradient(180deg,_#020617_0%,_#020617_100%)] text-white">
      <div className="mx-auto max-w-[1900px] px-4 py-4 md:px-6 lg:px-8 lg:py-6">
        <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <WorkspaceNavigation
            active={activeWorkspace}
            onChange={setActiveWorkspace}
          />

          <section className="min-w-0">{renderWorkspace()}</section>
        </div>
      </div>

      <FocusModePanelShell
        open={focusOpen}
        title={focusTitle}
        breadcrumb={focusBreadcrumb}
        onClose={() => setFocusOpen(false)}
      >
        {selectedSignal ? (
          <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Signal Detail
              </div>
              <h3 className="mt-3 text-2xl font-semibold text-white">
                {selectedSignal.headline}
              </h3>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-300">
                  {selectedSignal.source}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-300">
                  {selectedSignal.region}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-300">
                  {selectedSignal.cluster_tag}
                </span>
              </div>

              <p className="mt-5 text-base leading-8 text-slate-300">
                {selectedSignal.summary}
              </p>
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border border-cyan-400/20 bg-cyan-500/10 p-5">
                <div className="text-sm font-medium text-cyan-200">
                  Analyst View
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-200">
                  This signal matters because it reinforces broader cluster
                  momentum around {selectedSignal.cluster_tag}. The likely
                  implication is heightened executive need for timing-sensitive
                  visibility and targeted response planning.
                </p>
              </div>

              <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-5">
                <div className="text-sm font-medium text-emerald-200">
                  Advisor View
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-200">
                  Recommended response: assess exposure, identify direct
                  commercial risk or upside, and convert this signal into either
                  a mitigation plan or an opportunity capture action.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <div className="text-sm font-medium text-white">Panel Summary</div>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                This focus mode is designed to widen exploration surfaces,
                reduce clutter, and give GeoPulse a premium boardroom-grade
                drill-down experience.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <div className="text-sm font-medium text-white">
                Mid-Layer Insight
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Use this space to inject richer cluster analysis, scenario
                implications, source metadata, and deeper agent interpretation.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <div className="text-sm font-medium text-white">
                Deeper Workspace Surface
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                This shell is intentionally wide so future drill-downs can
                include charts, timelines, agent debates, source provenance, and
                company-specific calibration overlays.
              </p>
            </div>
          </div>
        )}
      </FocusModePanelShell>
    </main>
  );
}