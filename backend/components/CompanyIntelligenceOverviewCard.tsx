import { Building2, BrainCircuit, BadgeCheck, ShieldAlert } from "lucide-react";
import { DashboardResponse } from "@/types";

export default function CompanyIntelligenceOverviewCard({
  data,
}: {
  data: DashboardResponse;
}) {
  const identity = data.company_profile.identity;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-2xl bg-white/10 p-3">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/50">
            Company Intelligence Overview
          </p>
          <h2 className="text-xl font-semibold text-white">
            {identity?.official_name || "No company enriched yet"}
          </h2>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={<BadgeCheck className="h-4 w-4" />}
          label="Identity verification"
          value={identity ? identity.verification_status : "pending"}
        />
        <Metric
          icon={<Building2 className="h-4 w-4" />}
          label="Sector inference"
          value={identity ? `${identity.sector} · ${identity.sub_sector}` : "Awaiting enrichment"}
        />
        <Metric
          icon={<ShieldAlert className="h-4 w-4" />}
          label="Dominant sensitivity"
          value={data.adaptive_exposure.dominant_risk_sensitivity.replaceAll("_", " ")}
        />
        <Metric
          icon={<BrainCircuit className="h-4 w-4" />}
          label="Behavioural focus"
          value={data.adaptive_exposure.behavioural_focus_signal}
        />
      </div>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="mb-2 flex items-center gap-2 text-white/70">
        {icon}
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-sm font-medium text-white">{value}</p>
    </div>
  );
}
