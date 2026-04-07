"use client";

import BaseAgentWorkspace from "@/components/intelligence/BaseAgentWorkspace";
import type {
  ChainOutputs,
  CompanyProfile,
  WorkspaceMessage,
} from "@/types/intelligence";

type ProfileWorkspaceProps = {
  messages: WorkspaceMessage[];
  setMessages: React.Dispatch<React.SetStateAction<WorkspaceMessage[]>>;
  chainOutputs: ChainOutputs;
  setChainOutputs: React.Dispatch<React.SetStateAction<ChainOutputs>>;
  companyProfile?: CompanyProfile | null;
  companyId?: string;
};

export default function ProfileWorkspace(props: ProfileWorkspaceProps) {
  return (
    <BaseAgentWorkspace
      {...props}
      title="Company Profile Workspace"
      stage="profile"
      stageLabel="Profile Agent"
    />
  );
}