export type ResourceItem = {
  id: string;
  title: string;
  url?: string;
  source_type: "url" | "pdf" | "note" | "api" | "article";
  trust_score: number;
  bias_rating: "low" | "medium" | "high";
  region?: string;
  sector?: string;
  tags: string[];
  enabled: boolean;
};

export type ResourceBankListResponse = {
  items: ResourceItem[];
  total: number;
};