"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  Building2,
  ChevronDown,
  ChevronRight,
  Cog,
  Radar,
  ShieldCheck,
  Sparkles,
  Workflow,
  Wrench,
} from "lucide-react";
import type { WorkspaceKey } from "../types/geopulse";
import GeoPulseLogo from "./GeoPulseLogo";

type Props = {
  active: WorkspaceKey;
  onChange: (next: WorkspaceKey) => void;
};

type NavItem = {
  key: WorkspaceKey;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "hero" | "neutral" | "execution" | "company";
};

function NavButton({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;

  const toneClasses =
    item.tone === "hero"
      ? active
        ? "border-cyan-400/30 bg-cyan-500/14 shadow-[0_18px_44px_rgba(8,145,178,0.18)]"
        : "border-cyan-400/15 bg-cyan-500/[0.07] hover:bg-cyan-500/[0.11]"
      : item.tone === "execution"
      ? active
        ? "border-emerald-400/30 bg-emerald-500/14 shadow-[0_18px_44px_rgba(16,185,129,0.18)]"
        : "border-emerald-400/15 bg-emerald-500/[0.06] hover:bg-emerald-500/[0.10]"
      : item.tone === "company"
      ? active
        ? "border-indigo-400/30 bg-indigo-500/14 shadow-[0_18px_44px_rgba(99,102,241,0.18)]"
        : "border-indigo-400/15 bg-indigo-500/[0.06] hover:bg-indigo-500/[0.10]"
      : active
      ? "border-white/20 bg-white/[0.10]"
      : "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]";

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group w-full rounded-[24px] border p-4 text-left transition duration-200",
        toneClasses,
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div
          className={[
            "mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border",
            active
              ? "border-white/15 bg-white/10 text-white"
              : "border-white/10 bg-black/20 text-slate-300",
          ].join(" ")}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-white">{item.label}</div>
            <ArrowRight
              className={[
                "h-4 w-4 shrink-0 transition",
                active
                  ? "translate-x-0 text-white"
                  : "text-slate-500 group-hover:translate-x-0.5 group-hover:text-slate-300",
              ].join(" ")}
            />
          </div>

          <p className="mt-1.5 text-xs leading-6 text-slate-400">
            {item.description}
          </p>
        </div>
      </div>
    </button>
  );
}

export default function WorkspaceNavigation({ active, onChange }: Props) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const heroItems = useMemo<NavItem[]>(
    () => [
      {
        key: "agent-chain",
        label: "Agent Chain",
        description:
          "Primary executive workflow. Analyse, advise, plan, and move into execution.",
        icon: Workflow,
        tone: "hero",
      },
      {
        key: "planner",
        label: "Planner",
        description:
          "Execution destination for chain outputs, milestones, and next actions.",
        icon: Sparkles,
        tone: "execution",
      },
    ],
    []
  );

  const intelligenceItems = useMemo<NavItem[]>(
    () => [
      {
        key: "executive",
        label: "Executive Dashboard",
        description: "Top-level risk, opportunity, and executive overview.",
        icon: Activity,
      },
      {
        key: "signals",
        label: "Live Signals",
        description:
          "Monitor active signals, trace sources, and inspect current momentum.",
        icon: Radar,
      },
      {
        key: "opportunities",
        label: "Opportunities",
        description: "Review upside windows and commercial opportunity themes.",
        icon: Sparkles,
      },
      {
        key: "company",
        label: "Company Intelligence",
        description:
          "Calibrate GeoPulse to the company profile, priorities, and sensitivities.",
        icon: Building2,
        tone: "company",
      },
    ],
    []
  );

  const governanceItems = useMemo<NavItem[]>(
    () => [
      {
        key: "profile-agent",
        label: "Profile Agent",
        description:
          "Dedicated company-calibration assistant and profile-focused workspace.",
        icon: Building2,
      },
      {
        key: "governance",
        label: "Governance",
        description: "Privacy, masking, and governance controls.",
        icon: ShieldCheck,
      },
      {
        key: "configuration",
        label: "Configuration",
        description:
          "Tune signal weighting, posture preferences, and workspace settings.",
        icon: Cog,
      },
    ],
    []
  );

  const advancedItems = useMemo<NavItem[]>(
    () => [
      {
        key: "analyst",
        label: "Analyst",
        description: "Standalone deep analysis workspace for advanced users.",
        icon: Activity,
      },
      {
        key: "advisor",
        label: "Advisor",
        description:
          "Standalone recommendation workspace for advanced users.",
        icon: Wrench,
      },
    ],
    []
  );

  return (
    <aside className="h-fit rounded-[32px] border border-white/10 bg-slate-950/72 p-4 shadow-[0_28px_90px_rgba(0,0,0,0.36)] backdrop-blur-xl">
      <div className="rounded-[28px] border border-cyan-400/15 bg-gradient-to-br from-cyan-500/[0.10] via-slate-950 to-slate-950 p-5">
        <div className="mb-6">
          <GeoPulseLogo size="lg" showWordmark={false} />
        </div>

        <div className="text-[11px] uppercase tracking-[0.32em] text-cyan-300/80">
          GeoPulse AI
        </div>
        <div className="mt-3 text-2xl font-semibold text-white">
          Executive Navigation
        </div>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          Agent Chain is now the primary operating flow. Move from signal to
          decision to execution with one connected executive workflow.
        </p>
      </div>

      <div className="mt-5 space-y-5">
        <section>
          <div className="mb-3 px-1 text-[11px] uppercase tracking-[0.22em] text-slate-500">
            Hero Workflow
          </div>
          <div className="space-y-3">
            {heroItems.map((item) => (
              <NavButton
                key={item.key}
                item={item}
                active={active === item.key}
                onClick={() => onChange(item.key)}
              />
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3 px-1 text-[11px] uppercase tracking-[0.22em] text-slate-500">
            Intelligence Surfaces
          </div>
          <div className="space-y-3">
            {intelligenceItems.map((item) => (
              <NavButton
                key={item.key}
                item={item}
                active={active === item.key}
                onClick={() => onChange(item.key)}
              />
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3 px-1 text-[11px] uppercase tracking-[0.22em] text-slate-500">
            Governance & Setup
          </div>
          <div className="space-y-3">
            {governanceItems.map((item) => (
              <NavButton
                key={item.key}
                item={item}
                active={active === item.key}
                onClick={() => onChange(item.key)}
              />
            ))}
          </div>
        </section>

        <section className="rounded-[24px] border border-white/10 bg-white/[0.03] p-3">
          <button
            type="button"
            onClick={() => setAdvancedOpen((prev) => !prev)}
            className="flex w-full items-center justify-between gap-3 rounded-2xl px-2 py-2 text-left transition hover:bg-white/[0.04]"
          >
            <div>
              <div className="text-sm font-semibold text-white">
                Advanced Tools
              </div>
              <div className="mt-1 text-xs leading-6 text-slate-400">
                Standalone Analyst and Advisor remain available, but are no
                longer front-and-centre.
              </div>
            </div>

            {advancedOpen ? (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-slate-400" />
            )}
          </button>

          {advancedOpen ? (
            <div className="mt-3 space-y-3">
              {advancedItems.map((item) => (
                <NavButton
                  key={item.key}
                  item={item}
                  active={active === item.key}
                  onClick={() => onChange(item.key)}
                />
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </aside>
  );
}