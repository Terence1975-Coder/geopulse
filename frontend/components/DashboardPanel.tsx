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
        "rounded-2xl border p-6 shadow-[0_14px_32px_rgba(15,23,42,0.12)] bg-white",
        shellMap[accent],
      ].join(" ")}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-2xl font-semibold text-slate-950">
            {title}
          </div>
          {subtitle ? (
            <div className="mt-1 text-sm text-slate-600">
              {subtitle}
            </div>
          ) : null}
        </div>

        {onExpand ? (
          <button
            onClick={onExpand}
            className="shrink-0 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-[1px] hover:border-cyan-300 hover:bg-cyan-50"
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
