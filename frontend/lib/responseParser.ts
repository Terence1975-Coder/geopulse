import type {
  AgentStage,
  ChainOutputs,
  EngageAgentResponse,
} from "../types/intelligence";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toArrayOfStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

export function extractAgentData(data: EngageAgentResponse | null | undefined): unknown {
  return (
    data?.multi_path_output ??
    data?.chain_outputs ??
    data?.outputs ??
    data?.output ??
    {}
  );
}

export function extractStageOutput(
  data: EngageAgentResponse | null | undefined,
  stage?: AgentStage
): unknown {
  if (!data) return {};

  if (stage && data.chain_outputs && isRecord(data.chain_outputs)) {
    const fromChain = data.chain_outputs[stage];
    if (fromChain !== undefined) return fromChain;
  }

  if (stage && data.outputs && isRecord(data.outputs)) {
    const fromOutputs = data.outputs[stage];
    if (fromOutputs !== undefined) return fromOutputs;
  }

  if (data.output !== undefined && data.output !== null) {
    return data.output;
  }

  return extractAgentData(data);
}

export function mergeChainOutputs(
  current: ChainOutputs,
  incoming: EngageAgentResponse | null | undefined,
  stage?: AgentStage
): ChainOutputs {
  const next: ChainOutputs = { ...current };

  if (incoming?.chain_outputs && isRecord(incoming.chain_outputs)) {
    return {
      ...next,
      ...incoming.chain_outputs,
    };
  }

  if (
    stage &&
    stage !== "full_chain" &&
    stage !== "multi_path"
  ) {
    const stageOutput = extractStageOutput(incoming, stage);
    if (stageOutput && typeof stageOutput === "object") {
      next[stage] = stageOutput;
    }
  }

  return next;
}

export function extractPlanShape(value: unknown): {
  objective?: string;
  phases: Array<{ phase: string; owner?: string; actions: string[] }>;
} {
  if (!isRecord(value)) {
    return { objective: undefined, phases: [] };
  }

  const directPhases = Array.isArray(value.phases)
    ? value.phases
        .filter(isRecord)
        .map((phase) => ({
          phase: typeof phase.phase === "string" ? phase.phase : "Phase",
          owner: typeof phase.owner === "string" ? phase.owner : undefined,
          actions: toArrayOfStrings(phase.actions),
        }))
    : [];

  if (directPhases.length > 0) {
    return {
      objective:
        typeof value.objective === "string"
          ? value.objective
          : typeof value.plan === "string"
          ? value.plan
          : undefined,
      phases: directPhases,
    };
  }

  const fallbackPhases = [
    {
      phase: "Immediate",
      actions: toArrayOfStrings(value.immediate),
    },
    {
      phase: "Short-term",
      actions: toArrayOfStrings(value.short_term),
    },
    {
      phase: "Medium-term",
      actions: toArrayOfStrings(value.medium_term),
    },
  ].filter((item) => item.actions.length > 0);

  return {
    objective:
      typeof value.objective === "string"
        ? value.objective
        : typeof value.plan === "string"
        ? value.plan
        : undefined,
    phases: fallbackPhases,
  };
}

export function extractAgentText(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (!isRecord(value)) {
    return "No structured response returned from backend.";
  }

  const preferred = [
    value.summary,
    value.headline,
    value.key_insight,
    value.response,
    value.message,
    value.content,
    value.analysis,
    value.advice,
    value.plan,
    value.objective,
  ];

  for (const field of preferred) {
    if (typeof field === "string" && field.trim()) {
      return field.trim();
    }
  }

  const planShape = extractPlanShape(value);
  if (planShape.objective || planShape.phases.length > 0) {
    const lines: string[] = [];

    if (planShape.objective) {
      lines.push(`Objective: ${planShape.objective}`);
    }

    for (const phase of planShape.phases) {
      lines.push(`${phase.phase}: ${phase.actions.join("; ")}`);
    }

    if (lines.length > 0) {
      return lines.join("\n");
    }
  }

  return JSON.stringify(value, null, 2);
}