"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import AmbientIntelligenceBackground from "../components/AmbientIntelligenceBackground";
import AgentPresencePanel from "../components/AgentPresencePanel";
import CognitiveFocusLayer from "../components/CognitiveFocusLayer";
import CommandModeToggle from "../components/CommandModeToggle";
import CommandPresenceStrip from "../components/CommandPresenceStrip";
import ExecutivePanel from "../components/ExecutivePanel";
import LiveSignalStream from "../components/LiveSignalStream";
import OpportunityMomentumPanel from "../components/OpportunityMomentumPanel";
import {
  CommandMode,
  MotionPreference,
  getMotionProfile,
} from "../lib/motion-config";

const demoSignals = [
  {
    id: "s1",
    title: "Sanctions pressure intensifies freight routing exposure",
    region: "EMEA",
    source: "Live Intel Mesh",
    detectedAt: new Date(Date.now() - 6 * 60000).toISOString(),
    urgency: "critical" as const,
    summary: "Risk concentration is increasing across east-west corridors, raising probability of cost distortion and timeline variance.",
  },
  {
    id: "s2",
    title: "Utility storage acceleration opens procurement timing advantage",
    region: "UK",
    source: "Opportunity Engine",
    detectedAt: new Date(Date.now() - 22 * 60000).toISOString(),
    urgency: "opportunity" as const,
    summary: "A favourable timing window has emerged for energy resilience investment with likely short-horizon margin support.",
  },
  {
    id: "s3",
    title: "Container rate volatility stabilising across secondary lanes",
    region: "Global",
    source: "Signal Watch",
    detectedAt: new Date(Date.now() - 92 * 60000).toISOString(),
    urgency: "background" as const,
    summary: "Conditions remain relevant but have moved into strategic memory status unless paired with fresh disruption signals.",
  },
];

const opportunityItems = [
  {
    id: "o1",
    title: "Energy hedging window for Q2 margin protection",
    summary: "Momentum suggests a narrow but attractive opportunity to lock resilience upside before price narrative shifts against buyers.",
    valueScore: 87,
    timePressure: "High",
  },
  {
    id: "o2",
    title: "Supplier diversification narrative strengthens negotiation leverage",
    summary: "Procurement strategy can convert current uncertainty into better terms if action is taken while alternatives are visible.",
    valueScore: 74,
    timePressure: "Moderate",
  },
];

export default function DashboardPage() {
  const browserReduceMotion = useReducedMotion();
  const [mode, setMode] = useState<CommandMode>("executive");
  const [motionPreference, setMotionPreference] = useState<MotionPreference>("strategic");
  const [focusTarget, setFocusTarget] = useState<string | null>("signals");
  const [clock, setClock] = useState<string>("");
  const [lowPowerMode, setLowPowerMode] = useState(false);

  useEffect(() => {
    const updateClock = () => {
      setClock(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };

    updateClock();
    const timer = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const nav = navigator as Navigator & {
      getBattery?: () => Promise<{ level: number; charging: boolean }>;
      deviceMemory?: number;
    };

    const assess = async () => {
      const memoryLow = typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4;
      let batteryLow = false;

      if (nav.getBattery) {
        try {
          const battery = await nav.getBattery();
          batteryLow = !battery.charging && battery.level <= 0.2;
        } catch {
          batteryLow = false;
        }
      }

      setLowPowerMode(Boolean(memoryLow || batteryLow));
    };

    assess();
  }, []);

  const profile = useMemo(
    () => getMotionProfile(motionPreference, mode, browserReduceMotion, lowPowerMode),
    [motionPreference, mode, browserReduceMotion, lowPowerMode]
  );

  const isFocused = (id: string) => focusTarget === id;
  const isDimmed = (id: string) => Boolean(focusTarget && focusTarget !== id);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#132038_0%,#020617_46%,#02040b_100%)] text-white">
      <AmbientIntelligenceBackground reduced={profile.reduced} />
      <CognitiveFocusLayer focusTarget={focusTarget} />

      <div className="relative z-30 mx-auto flex min-h-screen max-w-[1680px] flex-col px-4 py-5 lg:px-6">
        <motion.header
          layout
          className="mb-5 flex flex-col gap-4"
          animate={{ y: 0, opacity: 1 }}
          initial={{ y: 12, opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.32em] text-slate-400">Executive Cognitive Intelligence Environment</div>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white xl:text-4xl">GeoPulse AI Command Center</h1>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="hidden rounded-full border border-white/10 bg-slate-900/60 px-4 py-2 text-xs uppercase tracking-[0.24em] text-slate-300 md:block">
                Motion · {motionPreference}
              </div>
              <CommandModeToggle mode={mode} onChange={setMode} />
            </div>
          </div>

          <CommandPresenceStrip
            riskScore={78}
            geopoliticalTension={71}
            opportunityMomentum={68}
            confidence={86}
            latencyMs={420}
            timeLabel={clock}
            reduced={profile.reduced}
          />
        </motion.header>

        <motion.main
          layout
          className="grid flex-1 grid-cols-1 gap-5 xl:grid-cols-12"
          style={{ perspective: 1600 }}
        >
          <div className="space-y-5 xl:col-span-7">
            <ExecutivePanel
              id="signals"
              title="Live Signal Stream"
              eyebrow="Temporal Intelligence"
              isFocused={isFocused("signals")}
              isDimmed={isDimmed("signals")}
              onFocus={setFocusTarget}
              className="min-h-[380px]"
            >
              <LiveSignalStream
                signals={demoSignals}
                reduced={profile.reduced}
                commandMultiplier={profile.multiplier}
              />
            </ExecutivePanel>

            <ExecutivePanel
              id="opportunities"
              title="Opportunity Momentum"
              eyebrow="Forward Opportunity Intelligence"
              isFocused={isFocused("opportunities")}
              isDimmed={isDimmed("opportunities")}
              onFocus={setFocusTarget}
            >
              <OpportunityMomentumPanel items={opportunityItems} reduced={profile.reduced} />
            </ExecutivePanel>
          </div>

          <div className="space-y-5 xl:col-span-5">
            <ExecutivePanel
              id="agents"
              title="Analyst + Advisor Presence"
              eyebrow="Cognitive Agents"
              isFocused={isFocused("agents")}
              isDimmed={isDimmed("agents")}
              onFocus={setFocusTarget}
            >
              <div className="space-y-4">
                <AgentPresencePanel
                  name="Analyst Agent"
                  role="Risk Pattern Recognition"
                  tone="analyst"
                  thinking={mode === "command"}
                  reduced={profile.reduced}
                  insight={{
                    title: "Pressure is consolidating around cost sensitivity rather than direct continuity failure.",
                    body: "The signal mix suggests executives should monitor second-order margin effects before committing to a full crisis posture.",
                  }}
                  actions={[
                    { title: "Re-rank top exposed suppliers by lead-time sensitivity", impact: "Operational resilience" },
                    { title: "Update executive watchlist thresholds for transport-cost triggers", impact: "Decision speed" },
                  ]}
                />

                <AgentPresencePanel
                  name="Advisor Agent"
                  role="Executive Action Framing"
                  tone="advisor"
                  thinking={true}
                  reduced={profile.reduced}
                  insight={{
                    title: "A narrow response now may preserve optionality without signalling overreaction.",
                    body: "GeoPulse recommends a staged decision structure: contain exposure, secure upside, then escalate only if the next cluster confirms direction.",
                  }}
                  actions={[
                    { title: "Prepare board-level one-page action brief", impact: "Executive alignment" },
                    { title: "Activate opportunity response lane for energy procurement", impact: "Margin upside" },
                  ]}
                />
              </div>
            </ExecutivePanel>

            <ExecutivePanel
              id="configuration"
              title="Motion Governance"
              eyebrow="Performance Guard"
              isFocused={isFocused("configuration")}
              isDimmed={isDimmed("configuration")}
              onFocus={setFocusTarget}
            >
              <div className="grid gap-4 md:grid-cols-3">
                {(["strategic", "reduced", "immersive"] as MotionPreference[]).map((option) => {
                  const active = motionPreference === option;
                  return (
                    <button
                      key={option}
                      onClick={() => setMotionPreference(option)}
                      className={`rounded-[20px] border px-4 py-4 text-left transition ${
                        active
                          ? "border-sky-300/25 bg-sky-400/8 text-white shadow-[0_0_30px_rgba(56,189,248,.08)]"
                          : "border-white/8 bg-white/[0.03] text-slate-300"
                      }`}
                    >
                      <div className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Preference</div>
                      <div className="mt-2 text-sm font-medium capitalize">{option}</div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 rounded-[20px] border border-white/8 bg-slate-950/45 p-4 text-sm text-slate-300">
                <div>Low power guard: <span className="font-medium text-white">{lowPowerMode ? "Active" : "Inactive"}</span></div>
                <div className="mt-2">Reduced motion effective: <span className="font-medium text-white">{profile.reduced ? "Yes" : "No"}</span></div>
                <div className="mt-2">Mode multiplier: <span className="font-medium text-white">{profile.multiplier.toFixed(2)}x</span></div>
              </div>
            </ExecutivePanel>
          </div>
        </motion.main>
      </div>
    </div>
  );
}