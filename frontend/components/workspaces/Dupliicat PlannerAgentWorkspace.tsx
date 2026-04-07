"use client";

import BaseAgentWorkspace from "../intelligence/BaseAgentWorkspace";
import type {
  ChainOutputs,
  CompanyProfile,
  WorkspaceMessage,
} from "@/types/intelligence";

type PlannerAgentWorkspaceProps = {
  messages: WorkspaceMessage[];
  setMessages: React.Dispatch<React.SetStateAction<WorkspaceMessage[]>>;
  chainOutputs: ChainOutputs;
  setChainOutputs: React.Dispatch<React.SetStateAction<ChainOutputs>>;
  companyProfile?: CompanyProfile | null;
  companyId?: string;
};

export default function PlannerAgentWorkspace(
  props: PlannerAgentWorkspaceProps
) {
  return (
    <BaseAgentWorkspace
      {...props}
      title="Planner Workspace"
      stage="plan"
      stageLabel="Planner Agent"
    />
  );
}