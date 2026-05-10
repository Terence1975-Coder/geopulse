"use client";

import { Expand } from "lucide-react";

interface Props {
  title: string;
  subtitle?: string;
  accent?:
    | "risk"
    | "opportunity"
    | "governance"
    | "company"
    | "neutral"
    | "advisor";
  onExpand?: () => void;
  children: React.ReactNode;
}

const shellMap = {
  risk: "border-red-200 bg-red-50/90",
  opportunity: "border-emerald-200 bg-emerald-50/90",
  governance: "border-indigo-200 bg-indigo-50/90",
  company: "border-cyan-200 bg-cyan-50/90",
  neutral: "border-slate-300 bg-white",
  advisor: "border-amber-200 bg-amber-50/90",
};

export default function DashboardPanel({
  title,
  subtitle,
  accent = "neutral",
  onExpand,
  children,
}: Props) {
  const isLight = true;

  return (
    <section
      className={[
        "rounded-[2rem] border p-6 shadow-[0_18px_36px_rgba(0,0,0,0.14)]",
        shellMap[accent],
      ].join(" ")}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className={isLight ? "text-2xl font-semibold text-slate-950" : "text-2xl font-semibold text-white"}>
            {title}
          </div>
          {subtitle ? (
            <div className={isLight ? "mt-1 text-sm text-slate-600" : "mt-1 text-sm text-slate-300"}>
              {subtitle}
            </div>
          ) : null}
        </div>

        {onExpand ? (
          <button
            onClick={onExpand}
            className="shrink-0 rounded-2xl border border-slate-600 bg-[linear-gradient(180deg,#1f2937_0%,#172033_45%,#0f172a_100%)] px-4 py-2.5 text-sm font-medium text-white shadow-[0_8px_14px_rgba(0,0,0,0.26),inset_0_1px_0_rgba(255,255,255,0.05),inset_0_-1px_0_rgba(0,0,0,0.35)] transition hover:-translate-y-[1px] hover:bg-[linear-gradient(180deg,#273449_0%,#1e293b_45%,#111827_100%)]"
          >
            <span className="flex items-center gap-2">
              <Expand size={14} />
              Expand
            </span>
          </button>
        ) : null}
      </div>

      <div>{children}</div>
    </section>
  );
}