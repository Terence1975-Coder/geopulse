"use client";

import BaseAgentWorkspace from "../components/intelligence/BaseAgentWorkspace";
import type {
  ChainOutputs,
  CompanyProfile,
  WorkspaceMessage,
} from "../types/intelligence";

type AdvisorAgentWorkspaceProps = {
  messages: WorkspaceMessage[];
  setMessages: React.Dispatch<React.SetStateAction<WorkspaceMessage[]>>;
  chainOutputs: ChainOutputs;
  setChainOutputs: React.Dispatch<React.SetStateAction<ChainOutputs>>;
  companyProfile?: CompanyProfile | null;
  companyId?: string;
};

export default function AdvisorAgentWorkspace(
  props: AdvisorAgentWorkspaceProps
) {
  return (
    <BaseAgentWorkspace
      {...props}
      title="Advisor Workspace"
      stage="advise"
      stageLabel="Advisor Agent"
    />
  );
}