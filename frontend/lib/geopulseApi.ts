const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

import type {
  DashboardSummary,
  OpportunityItem,
  SignalItem,
} from "../types/geopulse";

type SignalsResponse = {
  signals?: SignalItem[];
};

type OpportunitiesResponse = {
  opportunities?: OpportunityItem[];
};

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Backend error: ${errorText}`);
  }

  return (await response.json()) as T;
}

export async function fetchLiveSignals(query?: string): Promise<SignalItem[]> {
  const qs = new URLSearchParams();
  if (query?.trim()) qs.set("query", query.trim());
  qs.set("limit", "12");

  const data = await fetchJson<SignalsResponse>(
    `/intel/signals?${qs.toString()}`
  );

  return Array.isArray(data?.signals) ? data.signals : [];
}

export async function fetchLiveOpportunities(
  query?: string
): Promise<OpportunityItem[]> {
  const qs = new URLSearchParams();
  if (query?.trim()) qs.set("query", query.trim());
  qs.set("limit", "6");

  const data = await fetchJson<OpportunitiesResponse>(
    `/intel/opportunities?${qs.toString()}`
  );

  return Array.isArray(data?.opportunities) ? data.opportunities : [];
}

export async function fetchDashboardSummary(
  query?: string
): Promise<DashboardSummary> {
  const qs = new URLSearchParams();
  if (query?.trim()) qs.set("query", query.trim());
  qs.set("limit", "12");

  return await fetchJson<DashboardSummary>(
    `/intel/dashboard/summary?${qs.toString()}`
  );
}