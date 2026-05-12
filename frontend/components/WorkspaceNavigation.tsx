"use client";

import { useMemo, useState } from "react";
import NextImage from "next/image";
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

type Props = {
  active: WorkspaceKey;
  onChange: (next: WorkspaceKey) => void;
};

type NavItem = {
  key: WorkspaceKey;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
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
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      className={[
	    "w-full border px-3 py-3 text-left transition-all duration-200",
	    "rounded-lg",
	    "shadow-[0_10px_18px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.05),inset_0_-1px_0_rgba(0,0,0,0.35)]",
	    active
		  ? "border-geopulse-borderStrong bg-[linear-gradient(180deg,#334155_0%,#1e293b_45%,#172033_100%)] text-white translate-y-[1px] shadow-[0_6px_12px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.06),inset_0_-1px_0_rgba(0,0,0,0.45)]"
		  : "border-geopulse-borderStrong bg-[linear-gradient(180deg,#1f2937_0%,#172033_45%,#0f172a_100%)] text-white hover:border-geopulse-borderStrong hover:bg-[linear-gradient(180deg,#273449_0%,#1e293b_45%,#111827_100%)] hover:-translate-y-[1px]",
	  ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div
          className={[
		    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border transition",
		    "rounded-md shadow-[inset_0_1px_0_rgba(255,255,255,0.05),inset_0_-1px_0_rgba(0,0,0,0.35)]",
		    active
			  ? "border-geopulse-borderStrong bg-[linear-gradient(180deg,#334155_0%,#1e293b_100%)] text-white"
			  : "border-geopulse-borderStrong bg-[linear-gradient(180deg,#1e293b_0%,#111827_100%)] text-white/90",
		  ].join(" ")}
        >
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="truncate text-sm font-semibold text-white">
			  {item.label}
			</div>

            <ArrowRight
              className={[
                "h-4 w-4 shrink-0 transition",
                active
                  ? "translate-x-0 text-geopulse-textSoft"
                  : "text-geopulse-textMuted",
              ].join(" ")}
            />
          </div>

          <div
            className={[
			  "overflow-hidden text-xs leading-5 text-slate-300 transition-all duration-200",
			  hovered || active ? "mt-2 max-h-20 opacity-100" : "max-h-0 opacity-0",
			].join(" ")}
          >
            {item.description}
          </div>
        </div>
      </div>
    </button>
  );
}

export default function WorkspaceNavigation({ active, onChange }: Props) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const primaryItems = useMemo<NavItem[]>(
    () => [
      {
        key: "agent-chain",
        label: "Agent Chain",
        description:
          "Primary executive workflow. Analyse, advise, plan, and move into execution.",
        icon: Workflow,
      },
      {
        key: "planner",
        label: "Planner",
        description:
          "Execution destination for chain outputs, milestones, and next actions.",
        icon: Sparkles,
      },
      {
        key: "executive",
        label: "Dashboard",
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
        label: "Company Intel",
        description:
          "Calibrate GeoPulse to company profile, priorities, and sensitivities.",
        icon: Building2,
      },
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
        description: "Standalone recommendation workspace for advanced users.",
        icon: Wrench,
      },
    ],
    []
  );

  return (
    <aside className="h-fit border-r border-geopulse-border bg-geopulse-surface p-3">
      <div className="overflow-hidden rounded-lg border border-geopulse-border bg-geopulse-surfaceAlt">
        <div className="relative h-[132px] w-full">
          <NextImage
            src="/geopulse-logo.png"
            alt="GeoPulse"
            fill
            priority
            className="object-contain scale-[1.12]"
          />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2">
        {primaryItems.map((item) => (
          <NavButton
            key={item.key}
            item={item}
            active={active === item.key}
            onClick={() => onChange(item.key)}
          />
        ))}
      </div>

      <section className="mt-3 rounded-lg border border-geopulse-border bg-geopulse-surfaceAlt p-2">
        <button
          type="button"
          onClick={() => setAdvancedOpen((prev) => !prev)}
          className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-geopulse-surfaceActive"
        >
          <div>
            <div className="text-sm font-semibold text-geopulse-text">
              Advanced Tools
            </div>
            <div className="mt-1 text-xs leading-5 text-geopulse-textMuted">
              Optional standalone workspaces.
            </div>
          </div>

          {advancedOpen ? (
            <ChevronDown className="h-4 w-4 text-geopulse-textMuted" />
          ) : (
            <ChevronRight className="h-4 w-4 text-geopulse-textMuted" />
          )}
        </button>

        {advancedOpen ? (
          <div className="mt-2 grid grid-cols-1 gap-2">
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
    </aside>
  );
}