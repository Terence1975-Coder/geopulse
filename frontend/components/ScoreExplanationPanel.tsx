"use client";

type Props = {
  title: string;
  score?: number;
  posture?: string;
  confidence?: number;
  horizon?: string;
  urgency?: string;
  drivers?: string[];
  notes?: string[];
  tone?: "risk" | "opportunity";
};

export default function ScoreExplanationPanel({
  title,
  score,
  posture,
  confidence,
  horizon,
  urgency,
  drivers = [],
  notes = [],
  tone = "risk",
}: Props) {
  const toneClasses =
    tone === "opportunity"
      ? "border-emerald-400/20 bg-emerald-500/10"
      : "border-amber-400/20 bg-amber-500/10";

  return (
    <section className={`rounded-2xl border p-5 ${toneClasses}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-slate-300">
            Why this score
          </div>
          <h3 className="mt-2 text-xl font-semibold text-white">{title}</h3>
          <p className="mt-2 text-sm leading-7 text-slate-300">
            GeoPulse should explain the score using posture, timing, confidence,
            and the strongest visible drivers rather than generic summary text.
          </p>
        </div>

        <div className="grid min-w-[220px] grid-cols-2 gap-2">
          <MetricChip label="Score" value={score != null ? String(score) : "—"} />
          <MetricChip label="Posture" value={posture || "—"} />
          <MetricChip
            label="Confidence"
            value={confidence != null ? `${confidence}%` : "—"}
          />
          <MetricChip label="Horizon" value={horizon || urgency || "—"} />
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <ListCard
          title="Primary Drivers"
          items={drivers.length ? drivers : ["No drivers surfaced yet."]}
        />
        <ListCard
          title="Interpretation Notes"
          items={
            notes.length
              ? notes
              : [
                  "Confidence should be visible.",
                  "Time horizon should be visible.",
                  "Signal-backed reasoning should be shown here.",
                ]
          }
        />
      </div>
    </section>
  );
}

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/50 px-3 py-3">
      <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-white">{value}</div>
    </div>
  );
}

function ListCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
      <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
        {title}
      </div>
      <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-300">
        {items.map((item, index) => (
          <li key={`${title}-${index}`}>• {item}</li>
        ))}
      </ul>
    </div>
  );
}