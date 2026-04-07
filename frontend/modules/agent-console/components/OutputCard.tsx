"use client";

import { ReactNode } from "react";

export function OutputCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
      <div className="mb-3 text-sm font-semibold text-white">{title}</div>
      <div className="space-y-3 text-sm text-slate-200">{children}</div>
    </div>
  );
}