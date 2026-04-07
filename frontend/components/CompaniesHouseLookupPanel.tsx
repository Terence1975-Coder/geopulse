"use client";

import { useMemo, useState } from "react";
import { CompanyProfile } from "../types/geopulse";

interface Props {
  onPopulate: (data: Partial<CompanyProfile>) => void;
}

const mockResults = [
  {
    company_name: "GeoPulse Intelligence Ltd",
    registration_number: "15443321",
    company_status: "Active",
    incorporation_date: "2024-01-18",
    sic_context: "62012 / 70229 / 62090",
  },
  {
    company_name: "GeoPulse Advisory Ltd",
    registration_number: "15111298",
    company_status: "Active",
    incorporation_date: "2023-08-07",
    sic_context: "70229 / 82990",
  },
];

export default function CompaniesHouseLookupPanel({ onPopulate }: Props) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return mockResults.filter((r) =>
      r.company_name.toLowerCase().includes(query.toLowerCase())
    );
  }, [query]);

  const selected = selectedIndex !== null ? results[selectedIndex] : null;

  return (
    <div className="rounded-3xl border border-cyan-400/20 bg-cyan-500/10 p-5">
      <div className="text-lg font-semibold text-white">Companies House Lookup</div>
      <p className="mt-1 text-sm text-slate-300">
        Live-compatible scaffold for external company enrichment and profile population.
      </p>

      <div className="mt-4 flex flex-col gap-3 md:flex-row">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(null);
          }}
          placeholder="Search company name..."
          className="flex-1 rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
        />
        <button className="rounded-2xl border border-cyan-400/20 bg-cyan-500/15 px-5 py-3 text-sm text-cyan-200">
          Search
        </button>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
          <div className="mb-3 text-sm font-medium text-slate-200">Results Preview</div>
          <div className="space-y-2">
            {results.length === 0 ? (
              <div className="text-sm text-slate-500">No results yet</div>
            ) : (
              results.map((item, idx) => (
                <button
                  key={item.registration_number}
                  onClick={() => setSelectedIndex(idx)}
                  className={[
                    "w-full rounded-2xl border px-4 py-3 text-left transition",
                    selectedIndex === idx
                      ? "border-cyan-400/20 bg-cyan-500/10"
                      : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]",
                  ].join(" ")}
                >
                  <div className="text-sm font-medium text-white">{item.company_name}</div>
                  <div className="mt-1 text-xs text-slate-400">
                    #{item.registration_number} · {item.company_status}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
          <div className="mb-3 text-sm font-medium text-slate-200">Selected Company Details</div>

          {!selected ? (
            <div className="text-sm text-slate-500">Select a result to preview details</div>
          ) : (
            <div className="space-y-3">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Company Name
                </div>
                <div className="mt-1 text-sm text-white">{selected.company_name}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Registration Number
                </div>
                <div className="mt-1 text-sm text-white">{selected.registration_number}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Status
                </div>
                <div className="mt-1 text-sm text-white">{selected.company_status}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Incorporation Date
                </div>
                <div className="mt-1 text-sm text-white">{selected.incorporation_date}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  SIC / Industry Context
                </div>
                <div className="mt-1 text-sm text-white">{selected.sic_context}</div>
              </div>

              <button
                onClick={() => onPopulate(selected)}
                className="mt-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/15 px-4 py-3 text-sm text-emerald-200"
              >
                Populate profile
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}