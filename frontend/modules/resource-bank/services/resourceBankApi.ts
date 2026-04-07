import { apiFetch } from "@/lib/api";
import { ResourceBankListResponse, ResourceItem } from "../types/resourceBank";

export async function listResourceBank(): Promise<ResourceBankListResponse> {
  return apiFetch<ResourceBankListResponse>("/intel/resource-bank");
}

export async function bulkUpsertResourceBank(items: ResourceItem[]): Promise<ResourceBankListResponse> {
  return apiFetch<ResourceBankListResponse>("/intel/resource-bank/bulk-upsert", {
    method: "POST",
    body: JSON.stringify({ items }),
  });
}