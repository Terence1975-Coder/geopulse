"use client";

import { X } from "lucide-react";

type SignalItem = {
  id: string;
  headline: string;
  summary: string;
  source: string;
  source_type?: string;
  confidence_score?: number;
  signal_strength?: number;
  lifecycle?: string;
  relative_time?: string;
  region?: string;
  cluster_tag?: string;
};

type Props = {
  open: boolean;
  title?: string;
  signals: SignalItem[];
  onClose: () => void;
};

export default function SignalTraceModal({
  open,
  title = "Supporting Signals",
  signals,
  onClose,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-5xl items-center justify-center p-4">
        <div className="max-h-[85vh] w-full overflow-hidden rounded-[28px] border border-white/10 bg-slate-950 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-cyan-300/80">
                Traceability
              </div>
              <h3 className="mt-2 text-2xl font-semibold text-white">{title}</h3>
            </div>

            <button
              onClick={onClose}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
            >
              <span className="flex items-center gap-2">
                <X size={16} />
                Close
              </span>
            </button>
          </div>

          <div className="max-h-[70vh] space-y-4 overflow-y-auto p-6">
            {signals.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-5 text-sm text-slate-400">
                No supporting signals were linked to this view yet.
              </div>
            ) : (
              signals.map((signal) => (
                <article
                  key={signal.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
                >
                  <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                    <span>{signal.source}</span>
                    <span>•</span>
                    <span>{signal.relative_time ?? "Unknown time"}</span>
                    {signal.lifecycle ? (
                      <>
                        <span>•</span>
                        <span>{signal.lifecycle}</span>
                      </>
                    ) : null}
                    {signal.cluster_tag ? (
                      <>
                        <span>•</span>
                        <span>{signal.cluster_tag}</span>
                      </>
                    ) : null}
                  </div>

                  <h4 className="mt-3 text-lg font-semibold text-white">
                    {signal.headline}
                  </h4>

                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    {signal.summary}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                      Confidence {Math.round((signal.confidence_score ?? 0) * 100)}%
                    </span>
                    <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">
                      Strength {Math.round((signal.signal_strength ?? 0) * 100)}%
                    </span>
                    {signal.region ? (
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                        {signal.region}
                      </span>
                    ) : null}
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}