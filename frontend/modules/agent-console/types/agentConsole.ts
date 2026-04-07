export type ActionType = "analyze" | "advise" | "plan" | "build_profile";

export type AnalysisOutput = {
  summary: string;
  key_risks: string[];
  opportunities: string[];
  drivers: string[];
  exposure_logic: string[];
  confidence: number;
};

export type AdviceOutput = {
  executive_advice: string;
  practical_actions: string[];
  prioritisation_guidance: string[];
  commercial_interpretation: string[];
  timing_guidance: string[];
  confidence: number;
};

export type PlanOutput = {
  objective: string;
  immediate: string[];
  short_term: string[];
  medium_term: string[];
  owners: string[];
  checkpoints: string[];
  confidence: number;
};

export type CompanyProfileOutput = {
  sector: string;
  business_type: string;
  strategic_priorities: string[];
  geographic_dependencies: string[];
  margin_sensitivities: string[];
  consumer_demand_exposure: string[];
  supply_chain_dependencies: string[];
  profile_summary: string;
  confidence: number;
};

export type DetectedEntity = {
  type: string;
  original: string;
  placeholder: string;
};

};