"use client";

import { X, ChevronRight } from "lucide-react";

interface Props {
  open: boolean;
  title: string;
  breadcrumb?: string[];
  onClose: () => void;
  children: React.ReactNode;
}

export default function FocusModePanelShell({
  open,
  title,
  breadcrumb = [],
  onClose,
  children,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/82 backdrop-blur-md">
      <div className="absolute inset-0 p-3 md:p-4 lg:p-5">
        <div className="mx-auto flex h-full max-w-[1660px] flex-col overflow-hidden rounded-xl border border-white/10 bg-slate-950/95 shadow-[0_22px_72px_rgba(0,0,0,0.42)]">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-400">
                {breadcrumb.map((item, idx) => (
                  <div key={`${item}-${idx}`} className="flex items-center gap-2">
                    <span>{item}</span>
                    {idx < breadcrumb.length - 1 ? <ChevronRight size={14} /> : null}
                  </div>
                ))}
              </div>
              <h2 className="mt-1.5 text-[1.6rem] font-semibold text-white">
                {title}
              </h2>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-slate-200 transition hover:bg-white/10"
            >
              <span className="flex items-center gap-2">
                <X size={16} />
                Close
              </span>
            </button>
          </div>

          <div className="flex-1 overflow-auto p-4">{children}</div>
        </div>
      </div>
    </div>
  );
}