import { apiFetch } from "@/lib/api";
import { PrivacyPreviewResponse } from "../types/privacy";

export async function fetchPrivacyPreview(input: string): Promise<PrivacyPreviewResponse> {
  return apiFetch<PrivacyPreviewResponse>("/intel/privacy-preview", {
    method: "POST",
    body: JSON.stringify({ input }),
  });
}