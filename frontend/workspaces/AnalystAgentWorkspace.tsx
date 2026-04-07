"use client";

import BaseAgentWorkspace from "../components/intelligence/BaseAgentWorkspace";
import type {
  ChainOutputs,
  CompanyProfile,
  WorkspaceMessage,
} from "../types/intelligence";

type AnalystAgentWorkspaceProps = {
  messages: WorkspaceMessage[];
  setMessages: React.Dispatch<React.SetStateAction<WorkspaceMessage[]>>;
  chainOutputs: ChainOutputs;
  setChainOutputs: React.Dispatch<React.SetStateAction<ChainOutputs>>;
  companyProfile?: CompanyProfile | null;
  companyId?: string;
};

export default function AnalystAgentWorkspace(
  props: AnalystAgentWorkspaceProps
) {
  return (
    <BaseAgentWorkspace
      {...props}
      title="Analyst Workspace"
      stage="analyse"
      stageLabel="Analyst Agent"
    />
  );
}