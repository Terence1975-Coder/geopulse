const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

export type EngageAgentResponse = Record<string, any>;

export type CompanyEvidenceUploadPayload = {
  text: string;
  name?: string;
  type?: string;
};

export async function getLatestCompanyProfile() {
  const res = await fetch(`${API_BASE}/company/profile/latest`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return (await res.json()).profile;
}

export async function saveCompanyProfile(profile: any) {
  const res = await fetch(`${API_BASE}/company/profile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return (await res.json()).profile;
}

export async function uploadCompanyEvidence(
  payload: CompanyEvidenceUploadPayload
) {
  const res = await fetch(`${API_BASE}/company/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}