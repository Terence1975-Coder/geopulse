import { ReactNode } from "react";

type BadgeTone = "neutral" | "risk" | "opportunity" | "info" | "success";
type BadgeVariant = "soft" | "outline";

const toneMap: Record<BadgeTone, { soft: string; outline: string }> = {
  neutral: {
    soft: "border-slate-300/80 bg-slate-100 text-slate-700",
    outline: "border-slate-400/70 text-slate-300",
  },
  risk: {
    soft: "border-red-200 bg-red-50 text-red-700",
    outline: "border-red-400/60 text-red-100",
  },
  opportunity: {
    soft: "border-emerald-200 bg-emerald-50 text-emerald-700",
    outline: "border-emerald-400/60 text-emerald-100",
  },
  info: {
    soft: "border-cyan-200 bg-cyan-50 text-cyan-700",
    outline: "border-cyan-400/60 text-cyan-100",
  },
  success: {
    soft: "border-emerald-200 bg-emerald-50 text-emerald-700",
    outline: "border-emerald-400/60 text-emerald-100",
  },
};

type Props = {
  tone?: BadgeTone;
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
};

export default function Badge({
  tone = "neutral",
  variant = "soft",
  children,
  className = "",
}: Props) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold leading-tight",
        toneMap[tone][variant],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
