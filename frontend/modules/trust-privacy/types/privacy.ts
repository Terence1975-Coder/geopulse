export type DetectedEntity = {
  type: string;
  original: string;
  placeholder: string;
};

export type PrivacyPreviewResponse = {
  raw_input: string;
  anonymized_input: string;
  detected_entities: DetectedEntity[];
  privacy_risk_level: "low" | "medium" | "high";
};