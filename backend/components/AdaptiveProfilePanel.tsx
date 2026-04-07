import { RiskKey } from "@/types";

const labels: Record<RiskKey, string> = {
  energy: "Energy sensitivity",
  supply_chain: "Supply chain sensitivity",
  inflation: "Inflation sensitivity",
  consumer_demand: "Consumer demand sensitivity",
  market_volatility: "Market volatility sensitivity",
};

export default function AdaptiveProfilePanel({
  values,
  onChange,
}: {
  values: Record<RiskKey, number>;
  onChange: (payload: Record<RiskKey, number>) => void;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-white/50">
        Operating Exposure Layer
      </p>
      <h3 className="mb-5 text-xl font-semibold text-white">
        Adaptive company exposure inputs
      </h3>

      <div className="space-y-5">
        {(Object.keys(values) as RiskKey[]).map((key) => (
          <div key={key}>
            <div className="mb-2 flex items-center justify-between text-sm text-white/80">
              <span>{labels[key]}</span>
              <span>{Math.round(values[key] * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(values[key] * 100)}
              onChange={(e) =>
                onChange({
                  ...values,
                  [key]: Number(e.target.value) / 100,
                })
              }
              className="w-full"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
