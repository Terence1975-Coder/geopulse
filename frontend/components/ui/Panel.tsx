"use client";

import { ReactNode } from "react";

type PanelVariant = "base" | "soft" | "active" | "ghost";
type PanelPadding = "none" | "sm" | "md" | "lg" | "xl";

export const panelVariants: Record<PanelVariant, string> = {
  base:
    "rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-[0_18px_48px_rgba(15,23,42,0.10)]",
  soft:
    "rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm",
  active:
    "rounded-xl border border-cyan-200 bg-cyan-50 text-slate-900 shadow-sm",
  ghost: "rounded-xl border border-slate-200 bg-slate-50 text-slate-900",
};

const paddingMap: Record<PanelPadding, string> = {
  none: "p-0",
  sm: "p-3",
  md: "p-5",
  lg: "p-6",
  xl: "p-8",
};

type Props = {
  variant?: PanelVariant;
  padding?: PanelPadding;
  className?: string;
  children: ReactNode;
};

export default function Panel({
  variant = "base",
  padding = "md",
  className = "",
  children,
}: Props) {
  return (
    <div className={[panelVariants[variant], paddingMap[padding], className].join(" ")}>
      {children}
    </div>
  );
}
