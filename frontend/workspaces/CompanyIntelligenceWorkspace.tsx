"use client";

import { useMemo, useState } from "react";
import type { CompanyProfile } from "../types/intelligence";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

type MutableProfile = Partial<CompanyProfile> & Record<string, any>;

type CompanyIntelligenceWorkspaceProps = {
  profile: MutableProfile;
  onUpdate: (next: MutableProfile) => void;
};

type CompaniesHouseSearchResult = {
  title: string;
  company_number: string;
  description?: string;
  company_status?: string;
  address_snippet?: string;
};

type InputFieldProps = {
  label: string;
  value: string | number | undefined | null;
  onChange: (value: string) => void;
  placeholder?: string;
};

type SliderFieldProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
};

type LocalCoverage = {
  real_connectors_attempted?: number;
  real_connectors_successful?: number;
  real_articles_reviewed?: number;
  returned_signals?: number;
  actionable_signals?: number;
  reference_signals?: number;
  watchlist_signals?: number;
  coverage_basis?: string;
  credibility_summary?: string;
};

type LocalConnectorResult = {
  connector_id?: string;
  source_name?: string;
  source_type?: string;
  status?: string;
  signals_returned?: number;
  actionable_signals?: number;
  reference_signals?: number;
  watchlist_signals?: number;
};

type LocalSourceCoverageResponse = {
  coverage?: LocalCoverage;
  connectors?: LocalConnectorResult[];
  count?: number;
  message?: string;
};

function splitCsv(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function arrayOrEmpty(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : [];
}

function stringOrEmpty(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function numberOrZero(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

function InputField({ label, value, onChange, placeholder }: InputFieldProps) {
  return (
    <label className="block">
      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </div>
      <input
        value={String(value ?? "")}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-[0_8px_18px_rgba(15,23,42,0.04)] outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
      />
    </label>
  );
}

function SliderField({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
}: SliderFieldProps) {
  return (
    <div className="rounded-md border border-slate-300 bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          {label}
        </div>
        <div className="rounded-lg border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-sm font-semibold text-cyan-800">
          {value}
        </div>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-cyan-600"
      />
    </div>
  );
}

function buildIntelProfile(profile: MutableProfile): MutableProfile {
  const markets =
    typeof profile.exposure_regions === "string"
      ? splitCsv(profile.exposure_regions)
      : arrayOrEmpty(profile.markets);

  const companyId = stringOrEmpty(profile.company_id);

  return {
    ...profile,
    company_id: companyId || "geopulse-demo",
    company_name: stringOrEmpty(profile.company_name),
    registration_number: stringOrEmpty(
      profile.registration_number || profile.company_number,
    ),
    sector: stringOrEmpty(profile.sector),
    sub_sector: stringOrEmpty(profile.sub_sector),
    markets,
    strategic_priorities: arrayOrEmpty(profile.strategic_priorities),
    operating_model: stringOrEmpty(profile.operating_model),
    cost_sensitivities: arrayOrEmpty(profile.cost_sensitivities),
    growth_objectives: arrayOrEmpty(profile.growth_objectives),
    risk_tolerance: stringOrEmpty(profile.risk_tolerance || "balanced"),
    recommendation_style: stringOrEmpty(
      profile.recommendation_style || "balanced",
    ),
    notes: stringOrEmpty(profile.notes),
    registered_address_line_1: stringOrEmpty(profile.registered_address_line_1),
    registered_address_line_2: stringOrEmpty(profile.registered_address_line_2),
    registered_town_city: stringOrEmpty(profile.registered_town_city),
    registered_county: stringOrEmpty(profile.registered_county),
    registered_postcode: stringOrEmpty(profile.registered_postcode),
    registered_country: stringOrEmpty(profile.registered_country),
    trading_address_line_1: stringOrEmpty(profile.trading_address_line_1),
    trading_address_line_2: stringOrEmpty(profile.trading_address_line_2),
    trading_town_city: stringOrEmpty(profile.trading_town_city),
    trading_county: stringOrEmpty(profile.trading_county),
    trading_postcode: stringOrEmpty(profile.trading_postcode),
    trading_country: stringOrEmpty(profile.trading_country),
    primary_locality: stringOrEmpty(profile.primary_locality),
    local_authority: stringOrEmpty(profile.local_authority),
    region: stringOrEmpty(profile.region),
    nearby_towns: arrayOrEmpty(profile.nearby_towns),
    local_news_keywords: arrayOrEmpty(profile.local_news_keywords),
    regional_monitoring_enabled:
      profile.regional_monitoring_enabled === undefined
        ? true
        : Boolean(profile.regional_monitoring_enabled),
    energy_dependency: numberOrZero(
      profile.energy_dependency ?? profile.energy_dependency_level,
    ),
    import_export_exposure: numberOrZero(
      profile.import_export_exposure ?? profile.import_export_exposure_level,
    ),
    consumer_sensitivity: numberOrZero(
      profile.consumer_sensitivity ?? profile.consumer_sensitivity_level,
    ),
    financial_leverage_sensitivity: numberOrZero(
      profile.financial_leverage_sensitivity ??
        profile.financial_leverage_sensitivity_level,
    ),
  };
}

function SourceCoveragePanel({
  coverage,
  connectors,
  loading,
  status,
  onRefresh,
}: {
  coverage: LocalCoverage | null;
  connectors: LocalConnectorResult[];
  loading: boolean;
  status: string;
  onRefresh: () => void;
}) {
  const metric = (value: unknown) =>
    Number.isFinite(Number(value)) ? String(Number(value)) : "0";

  const successful = connectors.filter((item) => item.status === "ok");
  const failed = connectors.filter((item) => item.status !== "ok");

  return (
    <section className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700">
            Source Coverage
          </div>
          <h3 className="mt-2 text-2xl font-semibold text-slate-950">
            Intelligence breadth and source credibility
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Shows how many real local, council, procurement, and regional source
            connectors GeoPulse checked before surfacing company-relevant
            signals.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="rounded-md border border-cyan-300 bg-cyan-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(8,145,178,0.20)] transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Checking..." : "Refresh Coverage"}
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-md border border-slate-300 bg-slate-50 p-4">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Connectors Tried
          </div>
          <div className="mt-2 text-3xl font-semibold text-slate-950">
            {metric(coverage?.real_connectors_attempted)}
          </div>
        </div>

        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
            Successful
          </div>
          <div className="mt-2 text-3xl font-semibold text-emerald-950">
            {metric(coverage?.real_connectors_successful)}
          </div>
        </div>

        <div className="rounded-md border border-cyan-200 bg-cyan-50 p-4">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-700">
            Articles / Links
          </div>
          <div className="mt-2 text-3xl font-semibold text-cyan-950">
            {metric(coverage?.real_articles_reviewed)}
          </div>
        </div>

        <div className="rounded-md border border-indigo-200 bg-indigo-50 p-4">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-700">
            Signals Surfaced
          </div>
          <div className="mt-2 text-3xl font-semibold text-indigo-950">
            {metric(coverage?.returned_signals)}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-emerald-200 bg-white p-4">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Actionable
          </div>
          <div className="mt-2 text-2xl font-semibold text-emerald-700">
            {metric(coverage?.actionable_signals)}
          </div>
        </div>

        <div className="rounded-md border border-amber-200 bg-white p-4">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Watchlist
          </div>
          <div className="mt-2 text-2xl font-semibold text-amber-700">
            {metric(coverage?.watchlist_signals)}
          </div>
        </div>

        <div className="rounded-md border border-slate-300 bg-white p-4">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Reference
          </div>
          <div className="mt-2 text-2xl font-semibold text-slate-700">
            {metric(coverage?.reference_signals)}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-md border border-slate-300 bg-slate-50 p-4">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Credibility Summary
        </div>
        <p className="mt-2 text-sm leading-7 text-slate-700">
          {coverage?.credibility_summary ||
            status ||
            "Run source coverage to see how many real local sources GeoPulse reviewed."}
        </p>
      </div>

      {connectors.length > 0 ? (
        <div className="mt-5">
          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Connector Results
          </div>

          <div className="space-y-2">
            {connectors.slice(0, 8).map((connector, index) => (
              <div
                key={`${connector.connector_id ?? "connector"}-${index}`}
                className="flex flex-col gap-2 rounded-md border border-slate-300 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-950">
                    {connector.source_name ||
                      connector.connector_id ||
                      "Unnamed connector"}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {connector.source_type || "local_source"}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${
                      connector.status === "ok"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-red-200 bg-red-50 text-red-700"
                    }`}
                  >
                    {connector.status || "unknown"}
                  </span>

                  <span className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                    {metric(connector.signals_returned)} signals
                  </span>
                </div>
              </div>
            ))}
          </div>

          {failed.length > 0 ? (
            <p className="mt-3 text-xs leading-6 text-amber-700">
              {failed.length} connector(s) did not return readable content. This
              is expected during early connector expansion and should be
              tracked, not hidden.
            </p>
          ) : null}

          {successful.length > 0 ? (
            <p className="mt-3 text-xs leading-6 text-emerald-700">
              {successful.length} connector(s) returned readable local source
              content.
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export default function CompanyIntelligenceWorkspace({
  profile,
  onUpdate,
}: CompanyIntelligenceWorkspaceProps) {
  const [saveStatus, setSaveStatus] = useState<string>("Not saved yet.");
  const [companySearch, setCompanySearch] = useState(
    String(profile.company_name ?? ""),
  );
  const [searchResults, setSearchResults] = useState<
    CompaniesHouseSearchResult[]
  >([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sourceCoverage, setSourceCoverage] = useState<LocalCoverage | null>(
    null,
  );
  const [sourceConnectors, setSourceConnectors] = useState<
    LocalConnectorResult[]
  >([]);
  const [sourceCoverageStatus, setSourceCoverageStatus] = useState(
    "Coverage not checked yet.",
  );
  const [loadingSourceCoverage, setLoadingSourceCoverage] = useState(false);

  const setField = (key: string, value: any) => {
    onUpdate({
      ...profile,
      [key]: value,
    });
  };

  const completeness = useMemo(() => {
    const checks = [
      profile.company_name,
      profile.company_id || profile.registration_number,
      profile.sector,
      arrayOrEmpty(profile.markets).length > 0 ||
        stringOrEmpty(profile.exposure_regions),
      arrayOrEmpty(profile.strategic_priorities).length > 0,
      arrayOrEmpty(profile.growth_objectives).length > 0,
      profile.risk_tolerance,
      profile.recommendation_style,
      profile.registered_town_city || profile.primary_locality,
      profile.registered_county || profile.region,
      profile.registered_postcode,
      profile.local_authority,
    ];

    return Math.round(
      (checks.filter(Boolean).length / Math.max(1, checks.length)) * 100,
    );
  }, [profile]);

  const handleSaveCalibration = async () => {
    try {
      setSaving(true);
      setSaveStatus("Saving calibration to GeoPulse backend...");

      const intelProfile = buildIntelProfile(profile);
      const fallbackCompanyId = "d6117c23-dac8-41bd-9e10-9ebc9741d671";

      const candidateCompanyId =
        profile.company_id || intelProfile.company_id || profile.supabase_company_id;

      const companyId = isUuid(candidateCompanyId)
        ? candidateCompanyId
        : fallbackCompanyId;

      const response = await fetch(`${API_BASE}/company/profile/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          company_id: companyId,
          calibration: { ...intelProfile, company_id: companyId },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Save request failed.");
      }

      await response.json();

      onUpdate({
        ...profile,
        ...intelProfile,
        company_id: companyId,
      });

      setSaveStatus("Calibration saved to backend workspace settings.");
    } catch (error) {
      console.error(error);
      setSaveStatus(
        error instanceof Error
          ? `Save failed: ${error.message}`
          : "Save failed.",
      );
    } finally {
      setSaving(false);
    }
  };

  const resolveCompanyIdForCoverage = () => {
    return String(
      profile.registration_number ||
        profile.company_number ||
        profile.company_id ||
        "",
    ).trim();
  };

  const handleRefreshSourceCoverage = async () => {
    const companyId = resolveCompanyIdForCoverage();

    if (!companyId) {
      setSourceCoverageStatus(
        "Add and save a company registration number before checking source coverage.",
      );
      return;
    }

    try {
      setLoadingSourceCoverage(true);
      setSourceCoverageStatus("Checking real local source connectors...");

      const response = await fetch(
        `${API_BASE}/intel/signals/local-real?company_id=${encodeURIComponent(
          companyId,
        )}`,
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Source coverage request failed.");
      }

      const data: LocalSourceCoverageResponse = await response.json();

      setSourceCoverage(data.coverage ?? null);
      setSourceConnectors(
        Array.isArray(data.connectors) ? data.connectors : [],
      );
      setSourceCoverageStatus(
        data.coverage?.credibility_summary ||
          data.message ||
          "Source coverage loaded.",
      );
    } catch (error) {
      console.error(error);
      setSourceCoverage(null);
      setSourceConnectors([]);
      setSourceCoverageStatus(
        error instanceof Error
          ? `Source coverage failed: ${error.message}`
          : "Source coverage failed.",
      );
    } finally {
      setLoadingSourceCoverage(false);
    }
  };

  const handleCompanySearch = async () => {
    const query = companySearch.trim();
    if (!query) {
      setSearchResults([]);
      return;
    }

    try {
      setLoadingSearch(true);
      setSaveStatus("Searching Companies House...");

      const response = await fetch(
        `${API_BASE}/company/companies/search?q=${encodeURIComponent(query)}`,
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Company search failed.");
      }

      const data = await response.json();
      const results = Array.isArray(data.results) ? data.results : [];

      setSearchResults(results);
      setSaveStatus(
        results.length > 0
          ? "Companies House results loaded."
          : "No Companies House matches found.",
      );
    } catch (error) {
      console.error(error);
      setSearchResults([]);
      setSaveStatus(
        error instanceof Error
          ? `Search failed: ${error.message}`
          : "Search failed.",
      );
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleSelectCompany = async (item: CompaniesHouseSearchResult) => {
    try {
      setSaveStatus("Loading Companies House profile...");

      const response = await fetch(
        `${API_BASE}/company/companies/${encodeURIComponent(
          item.company_number,
        )}`,
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Company prefill failed.");
      }

      const data = await response.json();

      const nextProfile: MutableProfile = {
        ...profile,
        company_name: data.company_name || item.title,
        company_id: item.company_number,
        company_number: item.company_number,
        registration_number: item.company_number,
        company_status: data.company_status || item.company_status,
        incorporation_date: data.incorporation_date,
        sector: profile.sector || "Professional Services",
        sic_context: Array.isArray(data.sic_codes)
          ? data.sic_codes.join(", ")
          : profile.sic_context,
        registered_address_line_1:
          data?.registered_office_address?.address_line_1 ||
          profile.registered_address_line_1,
        registered_address_line_2:
          data?.registered_office_address?.address_line_2 ||
          profile.registered_address_line_2,
        registered_town_city:
          data?.registered_office_address?.locality ||
          profile.registered_town_city,
        registered_county:
          data?.registered_office_address?.region || profile.registered_county,
        registered_postcode:
          data?.registered_office_address?.postal_code ||
          profile.registered_postcode,
        registered_country:
          data?.registered_office_address?.country ||
          profile.registered_country ||
          "United Kingdom",
      };

      onUpdate(nextProfile);
      setCompanySearch(nextProfile.company_name || "");
      setSearchResults([]);
      setSaveStatus("Companies House profile loaded. Review then save.");
    } catch (error) {
      console.error(error);
      setSaveStatus(
        error instanceof Error
          ? `Prefill failed: ${error.message}`
          : "Prefill failed.",
      );
    }
  };

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br from-slate-950 via-[#020617] to-slate-900 shadow-[0_0_60px_rgba(0,0,0,0.45)]">
        <div className="px-6 py-7 md:px-8 md:py-8 xl:px-10">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="text-[11px] font-medium uppercase tracking-[0.38em] text-cyan-300">
                Company Intelligence
              </div>

              <h2 className="mt-4 text-4xl font-semibold leading-tight text-white md:text-5xl">
                Profile calibration and local context
              </h2>

              <p className="mt-4 max-w-4xl text-base leading-8 text-slate-400">
                Calibrate GeoPulse with verified company details, strategic
                priorities, operating sensitivities, and local/regional
                intelligence context.
              </p>
            </div>

            <div className="shrink-0 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-7 py-5 text-right shadow-[0_18px_40px_rgba(6,182,212,0.14)]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-200">
                Completeness
              </div>

              <div className="mt-2 text-4xl font-semibold leading-none text-white">
                {completeness}%
              </div>

              <div className="mt-2 text-xs text-cyan-100/80">
                Profile readiness
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="space-y-5">
          <div className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
            <div className="text-lg font-semibold text-slate-950">
              Companies House Lookup
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Search Companies House, pull verified company details, then save
              the reviewed calibration profile into GeoPulse memory.
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <input
                value={companySearch}
                onChange={(event) => setCompanySearch(event.target.value)}
                placeholder="Search company name..."
                className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              />
              <button
                type="button"
                onClick={() => void handleCompanySearch()}
                disabled={loadingSearch}
                className="rounded-md border border-cyan-300 bg-cyan-50 px-5 py-3 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingSearch ? "Searching..." : "Search"}
              </button>
            </div>

            <div className="mt-5 rounded-md border border-slate-300 bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Results Preview
              </div>

              {searchResults.length === 0 ? (
                <div className="mt-3 text-sm text-slate-500">
                  No results loaded yet.
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  {searchResults.slice(0, 6).map((item) => (
                    <button
                      key={item.company_number}
                      type="button"
                      onClick={() => void handleSelectCompany(item)}
                      className="w-full rounded-md border border-slate-300 bg-white p-3 text-left transition hover:border-cyan-300 hover:bg-cyan-50"
                    >
                      <div className="font-semibold text-slate-950">
                        {item.title}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {item.company_number}
                        {item.company_status ? ` · ${item.company_status}` : ""}
                      </div>
                      {item.address_snippet ? (
                        <div className="mt-1 text-xs text-slate-500">
                          {item.address_snippet}
                        </div>
                      ) : null}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-5 rounded-md border border-slate-300 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Saved Profile Status
              </div>
              <div className="mt-2 text-sm font-medium text-slate-800">
                {saveStatus}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
            <div className="text-lg font-semibold text-slate-950">
              Intelligence Use Notice
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Company context calibrates risk interpretation, opportunity
              scoring, local signal relevance, agent recommendations, and
              decision-memory quality.
            </p>
          </div>
          <SourceCoveragePanel
            coverage={sourceCoverage}
            connectors={sourceConnectors}
            loading={loadingSourceCoverage}
            status={sourceCoverageStatus}
            onRefresh={() => void handleRefreshSourceCoverage()}
          />
        </section>

        <section className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">
                Company Knowledge Editor
              </div>
              <h3 className="mt-2 text-2xl font-semibold text-slate-950">
                Save calibration profile
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Edit the company profile and address fields, then save to the V9
                intelligence memory store.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void handleSaveCalibration()}
              disabled={saving}
              className="rounded-md border border-cyan-300 bg-cyan-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Calibration"}
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <InputField
              label="Company Name"
              value={profile.company_name}
              onChange={(value) => {
                setField("company_name", value);
                setCompanySearch(value);
              }}
            />

            <InputField
              label="Registration Number"
              value={profile.registration_number || profile.company_id}
              onChange={(value) => {
                setField("registration_number", value);
                setField("company_id", value);
              }}
            />

            <InputField
              label="Company Status"
              value={profile.company_status}
              onChange={(value) => setField("company_status", value)}
            />

            <InputField
              label="Incorporation Date"
              value={profile.incorporation_date}
              onChange={(value) => setField("incorporation_date", value)}
            />

            <InputField
              label="Sector"
              value={profile.sector}
              onChange={(value) => setField("sector", value)}
            />

            <InputField
              label="Sub-Sector"
              value={profile.sub_sector}
              onChange={(value) => setField("sub_sector", value)}
            />

            <InputField
              label="Markets / Exposure Regions"
              value={
                typeof profile.exposure_regions === "string"
                  ? profile.exposure_regions
                  : arrayOrEmpty(profile.markets).join(", ")
              }
              onChange={(value) => {
                setField("exposure_regions", value);
                setField("markets", splitCsv(value));
              }}
              placeholder="UK, Europe"
            />

            <InputField
              label="Strategic Priorities"
              value={arrayOrEmpty(profile.strategic_priorities).join(", ")}
              onChange={(value) =>
                setField("strategic_priorities", splitCsv(value))
              }
              placeholder="Protect margin, Grow revenue"
            />

            <InputField
              label="Growth Objectives"
              value={arrayOrEmpty(profile.growth_objectives).join(", ")}
              onChange={(value) =>
                setField("growth_objectives", splitCsv(value))
              }
            />

            <InputField
              label="Cost Sensitivities"
              value={arrayOrEmpty(profile.cost_sensitivities).join(", ")}
              onChange={(value) =>
                setField("cost_sensitivities", splitCsv(value))
              }
            />

            <InputField
              label="Risk Tolerance"
              value={profile.risk_tolerance || "balanced"}
              onChange={(value) => setField("risk_tolerance", value)}
            />

            <InputField
              label="Recommendation Style"
              value={profile.recommendation_style || "balanced"}
              onChange={(value) => setField("recommendation_style", value)}
            />

            <div className="md:col-span-2">
              <InputField
                label="Operating Model"
                value={profile.operating_model}
                onChange={(value) => setField("operating_model", value)}
                placeholder="B2B advisory and strategic intelligence services"
              />
            </div>

            <div className="md:col-span-2 border-t border-slate-300 pt-5">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
                Local / Regional Intelligence Context
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                These fields allow GeoPulse to monitor local authority, regional
                business, infrastructure, planning, procurement, and grant
                signals relevant to this company.
              </p>
            </div>

            <InputField
              label="Registered Address Line 1"
              value={profile.registered_address_line_1}
              onChange={(value) => setField("registered_address_line_1", value)}
            />

            <InputField
              label="Registered Address Line 2"
              value={profile.registered_address_line_2}
              onChange={(value) => setField("registered_address_line_2", value)}
            />

            <InputField
              label="Registered Town / City"
              value={profile.registered_town_city}
              onChange={(value) => {
                setField("registered_town_city", value);
                setField("primary_locality", value);
              }}
            />

            <InputField
              label="Registered County"
              value={profile.registered_county}
              onChange={(value) => {
                setField("registered_county", value);
                setField("region", value);
              }}
            />

            <InputField
              label="Registered Postcode"
              value={profile.registered_postcode}
              onChange={(value) => setField("registered_postcode", value)}
            />

            <InputField
              label="Registered Country"
              value={profile.registered_country || "United Kingdom"}
              onChange={(value) => setField("registered_country", value)}
            />

            <InputField
              label="Local Authority"
              value={profile.local_authority}
              onChange={(value) => setField("local_authority", value)}
              placeholder="Hart District Council"
            />

            <InputField
              label="Nearby Towns"
              value={arrayOrEmpty(profile.nearby_towns).join(", ")}
              onChange={(value) => setField("nearby_towns", splitCsv(value))}
              placeholder="Aldershot, Farnborough, Basingstoke"
            />

            <div className="md:col-span-2">
              <label className="block">
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Notes
                </div>
                <textarea
                  value={profile.notes ?? ""}
                  onChange={(event) => setField("notes", event.target.value)}
                  rows={4}
                  className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-[0_8px_18px_rgba(15,23,42,0.04)] outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                />
              </label>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <SliderField
              label="Energy Dependency"
              value={Number(profile.energy_dependency ?? 38)}
              onChange={(value) => setField("energy_dependency", value)}
            />

            <SliderField
              label="Import / Export Exposure"
              value={Number(profile.import_export_exposure ?? 42)}
              onChange={(value) => setField("import_export_exposure", value)}
            />

            <SliderField
              label="Consumer Sensitivity"
              value={Number(profile.consumer_sensitivity ?? 51)}
              onChange={(value) => setField("consumer_sensitivity", value)}
            />

            <SliderField
              label="Financial Leverage Sensitivity"
              value={Number(profile.financial_leverage_sensitivity ?? 34)}
              onChange={(value) =>
                setField("financial_leverage_sensitivity", value)
              }
            />
          </div>
        </section>
      </div>
    </div>
  );
}
