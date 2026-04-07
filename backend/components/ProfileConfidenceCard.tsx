import { DashboardResponse } from "@/types";

export default function ProfileConfidenceCard({
  data,
}: {
  data: DashboardResponse;
}) {
  const confidence = data.confidence;
  return (
    <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/5 p-6">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/70">
            Company Intelligence Confidence
          </p>
          <h3 className="text-3xl font-semibold text-white">{confidence.score}%</h3>
        </div>
        <div className="text-right text-sm text-white/70">
          Profile completeness
          <div className="font-semibold text-white">
            {confidence.profile_completeness_percent}%
          </div>
        </div>
      </div>

      <div className="mb-4 h-3 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-emerald-400"
          style={{ width: `${confidence.profile_completeness_percent}%` }}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        {Object.entries(confidence.breakdown).map(([key, value]) => (
          <div key={key} className="rounded-2xl bg-black/20 p-3">
            <div className="text-xs uppercase tracking-wide text-white/50">
              {key.replaceAll("_", " ")}
            </div>
            <div className="text-lg font-semibold text-white">{value}%</div>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {confidence.suggestions.map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80"
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
