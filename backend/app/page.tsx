 "use client";

import { useEffect, useMemo, useState } from "react";
import AdaptiveProfilePanel from "@/components/AdaptiveProfilePanel";
import CompanyIntelligenceOverviewCard from "@/components/CompanyIntelligenceOverviewCard";
import CopilotConsole from "@/components/CopilotConsole";
import ProfileConfidenceCard from "@/components/ProfileConfidenceCard";
import {
  enrichCompany,
  getCompanyIntelligenceDashboard,
  updateExposure,
  updateIntelligenceMemory,
} from "@/lib/api";
import { DashboardResponse, RiskKey } from "@/types";

const defaultExposure: Record<RiskKey, number> = {
  energy: 0.5,
  supply_chain: 0.5,
  inflation: 0.5,
  consumer_demand: 0.5,
  market_volatility: 0.5,
};

export default function HomePage() {
  const [companyName, setCompanyName] = useState("GeoPulse AI");
  const [companyNumber, setCompanyNumber] = useState("");
  const [scenario, setScenario] = useState("oil_shock");
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [exposure, setExposure] = useState<Record<RiskKey, number>>(defaultExposure);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadDashboard(selectedScenario = scenario) {
    setLoading(true);
    setError("");
    try {
      const data = await getCompanyIntelligenceDashboard(selectedScenario);
      setDashboard(data);
      setExposure(data.company_profile.user_exposure_inputs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function handleEnrich() {
    setLoading(true);
    setError("");
    try {
      await enrichCompany({
        company_name: companyName || undefined,
        company_number: companyNumber || undefined,
      });
      await updateIntelligenceMemory({
        executive_question_theme: "company identity enrichment",
        mitigation_bias_delta: 0.05,
      });
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to enrich company");
      setLoading(false);
    }
  }

  async function handleExposureSave(next: Record<RiskKey, number>) {
    setExposure(next);
    await updateExposure(next);
    await updateIntelligenceMemory({
      discussed_risk_category: (Object.entries(next).sort((a, b) => b[1] - a[1])[0][0]) as RiskKey,
      executive_question_theme: "exposure tuning",
    });
    await loadDashboard();
  }

  async function handleScenarioChange(nextScenario: string) {
    setScenario(nextScenario);
    await updateIntelligenceMemory({
      simulated_scenario_type: nextScenario,
      executive_question_theme: "scenario simulation",
      severity_assumption: 0.7,
    });
    await loadDashboard(nextScenario);
  }

  const weightedScores = useMemo(
    () => dashboard?.scenario.weighted_risk_scores || {},
    [dashboard]
  );

  return (
    <main className="min-h-screen bg-[#07111f] px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-white/10 bg-gradient-to-r from-white/10 to-white/5 p-6">
          <p className="text-xs uppercase tracking-[0.25em] text-white/50">
            GeoPulse AI · V6 Phase 10.1
          </p>
          <h1 className="mt-2 text-4xl font-semibold">
            Company Intelligence Enrichment Engine
          </h1>
          <p className="mt-3 max-w-4xl text-white/70">
            GeoPulse now adapts geopolitical scoring to the company’s identity,
            operating exposure, and behavioural decision patterns.
          </p>
        </header>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-white/50">
              Identity Layer
            </p>
            <h2 className="mb-5 text-xl font-semibold">Company identity enrichment</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Company name"
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none"
              />
              <input
                value={companyNumber}
                onChange={(e) => setCompanyNumber(e.target.value)}
                placeholder="Company number"
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none"
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={handleEnrich}
                className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900"
              >
                Enrich company profile
              </button>

              <select
                value={scenario}
                onChange={(e) => handleScenarioChange(e.target.value)}
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
              >
                <option value="oil_shock">Oil shock</option>
                <option value="trade_disruption">Trade disruption</option>
                <option value="regulatory_shift">Regulatory shift</option>
                <option value="cyber_incident">Cyber incident</option>
                <option value="demand_contraction">Demand contraction</option>
              </select>
            </div>
            {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
          </div>

          {dashboard ? <ProfileConfidenceCard data={dashboard} /> : null}
        </section>

        {dashboard ? <CompanyIntelligenceOverviewCard data={dashboard} /> : null}

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <AdaptiveProfilePanel values={exposure} onChange={handleExposureSave} />
          {dashboard ? <CopilotConsole data={dashboard} /> : null}
        </section>

        {dashboard ? (
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="mb-4 text-xs uppercase tracking-[0.2em] text-white/50">
              Exposure-weighted geopolitical risk intelligence
            </p>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {Object.entries(weightedScores).map(([key, value]) => (
                <div key={key} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-xs uppercase tracking-wide text-white/50">
                    {key.replaceAll("_", " ")}
                  </div>
                  <div className="mt-2 text-3xl font-semibold">{value}</div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {loading ? <p className="text-white/60">Refreshing intelligence...</p> : null}
      </div>
    </main>
  );
}
