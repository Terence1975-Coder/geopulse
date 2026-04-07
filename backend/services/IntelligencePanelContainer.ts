"use client";

import { ReactNode } from "react";

interface Props {
  title: string;
  postureTone?: "risk" | "opportunity" | "neutral";
  expanded: boolean;
  onExpand: () => void;
  children: ReactNode;
  expandedContent?: ReactNode;
}

export default function IntelligencePanelContainer({
  title,
  postureTone = "neutral",
  expanded,
  onExpand,
  children,
  expandedContent,
}: Props) {
  const toneBorder =
    postureTone === "risk"
      ? "border-red-500/30"
      : postureTone === "opportunity"
      ? "border-emerald-500/30"
      : "border-slate-500/20";

  return (
    <div
      onClick={onExpand}
      className={`relative p-5 rounded-2xl border ${toneBorder}
      bg-slate-900/60 backdrop-blur transition-all duration-300
      hover:scale-[1.01] hover:bg-slate-900/80 cursor-pointer`}
    >
      <div className="text-sm text-slate-400 mb-3">{title}</div>

      {!expanded && <div>{children}</div>}

      {expanded && (
        <div className="animate-fadeIn">
          {expandedContent}
        </div>
      )}
    </div>
  );
}