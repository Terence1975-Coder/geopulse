"use client";

type SignalLike = {
  id?: string | number;
  headline?: string;
  summary?: string;
  source?: string;
  region?: string;
  cluster_tag?: string;
  kind?: string;
  confidence?: number;
  freshness_label?: string;
  updated_at?: string;
  detected_at?: string;
  timestamp?: string;
};

type Props = {
  title?: string;
  signals?: SignalLike[];
  emptyText?: string;
};

export default function SupportingSignalsPanel({
  title = "Supporting Signals",
  signals = [],
  emptyText = "No supporting signals available yet.",
}: Props) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
            Evidence
          </div>
          <h3 className="mt-2 text-xl font-semibold text-white">{title}</h3>
        </div>

        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
          {signals.length} signal{signals.length === 1 ? "" : "s"}
        </div>
      </div>

      {signals.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-white/10 bg-slate-950/30 p-4 text-sm text-slate-400">
          {emptyText}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {signals.map((signal, index) => (
            <article
              key={`${signal.id ?? signal.headline ?? "signal"}-${index}`}
              className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"
            >
              <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.16em] text-slate-400">
                <span>{signal.source ?? "Unknown source"}</span>
                {signal.region ? <span>• {signal.region}</span> : null}
                {signal.cluster_tag ? <span>• {signal.cluster_tag}</span> : null}
                {signal.kind ? <span>• {signal.kind}</span> : null}
              </div>

              <h4 className="mt-2 text-base font-semibold text-white">
                {signal.headline ?? "Untitled signal"}
              </h4>

              <p className="mt-2 text-sm leading-7 text-slate-300">
                {signal.summary ?? "No summary available for this signal yet."}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <MetaPill
                  label="Confidence"
                  value={
                    signal.confidence != null ? `${signal.confidence}%` : "Unknown"
                  }
                />
                <MetaPill
                  label="Freshness"
                  value={
                    signal.freshness_label ||
                    signal.updated_at ||
                    signal.detected_at ||
                    signal.timestamp ||
                    "Unknown"
                  }
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function MetaPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
      {label}: {value}
    </span>
  );
}