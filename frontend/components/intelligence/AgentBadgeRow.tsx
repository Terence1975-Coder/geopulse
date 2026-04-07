type AgentBadgeRowProps = {
  confidence: number;
  timeHorizon: "short" | "medium" | "long";
  basedOnStages?: string[];
};

function confidenceLabel(confidence: number) {
  return `Confidence: ${Math.round(confidence * 100)}%`;
}

function horizonLabel(value: "short" | "medium" | "long") {
  if (value === "short") return "Horizon: 0–30 days";
  if (value === "medium") return "Horizon: 30–90 days";
  return "Horizon: 90+ days";
}

export default function AgentBadgeRow({
  confidence,
  timeHorizon,
  basedOnStages = [],
}: AgentBadgeRowProps) {
  return (
    <div className="flex flex-wrap gap-2 pt-2">
      <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">
        {confidenceLabel(confidence)}
      </span>

      <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
        {horizonLabel(timeHorizon)}
      </span>

      {basedOnStages.map((stage) => (
        <span
          key={stage}
          className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70"
        >
          Builds on: {stage}
        </span>
      ))}
    </div>
  );
}