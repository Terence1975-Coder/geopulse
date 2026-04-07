"use client";

import { useEffect, useMemo, useState } from "react";
import WorkspaceMessageRenderer from "./WorkspaceMessageRenderer";
import { engageAgent } from "../../lib/engageAgent";
import type {
  AgentStage,
  ChainOutputs,
  CompanyProfile,
  EngageAgentResponse,
  StructuredAgentOutput,
  WorkspaceMessage,
} from "../../types/intelligence";

type BaseAgentWorkspaceProps = {
  title: string;
  stage: AgentStage;
  stageLabel: string;
  messages?: WorkspaceMessage[];
  setMessages?: React.Dispatch<React.SetStateAction<WorkspaceMessage[]>>;
  chainOutputs: ChainOutputs;
  setChainOutputs: React.Dispatch<React.SetStateAction<ChainOutputs>>;
  companyProfile?: CompanyProfile | null;
  companyId?: string;
  initialInput?: string;
};

function buildAssistantContent(
  data: EngageAgentResponse,
  stage: AgentStage
): StructuredAgentOutput | Record<string, unknown> | string {
  if (data.output) {
    return data.output;
  }

  if (data.outputs && data.outputs[stage]) {
    return data.outputs[stage] as StructuredAgentOutput;
  }

  if (data.chain_outputs && data.chain_outputs[stage]) {
    return data.chain_outputs[stage] as StructuredAgentOutput;
  }

  return "No structured response returned from backend.";
}

function buildUpdatedChainOutputs(
  data: EngageAgentResponse,
  previous: ChainOutputs,
  stage: AgentStage
): ChainOutputs {
  if (data.chain_outputs) {
    return data.chain_outputs;
  }

  const stageOutput =
    (data.output as StructuredAgentOutput | null | undefined) ??
    (data.outputs?.[stage] as StructuredAgentOutput | null | undefined) ??
    null;

  if (!stageOutput) {
    return previous;
  }

  return {
    ...previous,
    [stage]: stageOutput,
  };
}

export default function BaseAgentWorkspace({
  title,
  stage,
  stageLabel,
  messages = [],
  setMessages,
  chainOutputs,
  setChainOutputs,
  companyProfile,
  companyId,
  initialInput = "",
}: BaseAgentWorkspaceProps) {
  const [input, setInput] = useState(initialInput);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof initialInput === "string" && initialInput.trim()) {
      setInput(initialInput);
    }
  }, [initialInput]);

  const safeMessages = Array.isArray(messages) ? messages : [];

  const placeholder = useMemo(
    () => `Send a ${stageLabel.toLowerCase()} request...`,
    [stageLabel]
  );

  async function handleSend() {
    const text = input.trim();
    if (!text || loading || !setMessages) return;

    const userMessage: WorkspaceMessage = {
      id: crypto.randomUUID(),
      role: "user",
      timestamp: new Date().toISOString(),
      tone: "neutral",
      content: text,
    };

    setMessages((prev) => [...(Array.isArray(prev) ? prev : []), userMessage]);
    setInput("");
    setLoading(true);

    try {
      const data = await engageAgent({
        input: text,
        stage,
        companyProfile,
        chainOutputs,
        messages: [...safeMessages, userMessage],
        companyId,
      });

      const assistantMessage: WorkspaceMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        timestamp: new Date().toISOString(),
        tone: "executive",
        content: buildAssistantContent(data, stage),
      };

      setMessages((prev) => [
        ...(Array.isArray(prev) ? prev : []),
        assistantMessage,
      ]);

      setChainOutputs((prev) => buildUpdatedChainOutputs(data, prev, stage));
    } catch (error) {
      const assistantError: WorkspaceMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        timestamp: new Date().toISOString(),
        tone: "warning",
        content:
          error instanceof Error
            ? `GeoPulse could not complete this request: ${error.message}`
            : "GeoPulse could not complete this request.",
      };

      setMessages((prev) => [
        ...(Array.isArray(prev) ? prev : []),
        assistantError,
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ): void {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  return (
    <div className="flex h-full flex-col rounded-3xl border border-white/10 bg-slate-950/70">
      <div className="border-b border-white/10 px-6 py-5">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
          {stageLabel}
        </div>
        <h2 className="mt-2 text-2xl font-semibold text-white">{title}</h2>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-6">
        {safeMessages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-white/60">
            No intelligence yet. Start by asking GeoPulse to analyse, advise, or
            deepen this stage.
          </div>
        ) : (
          safeMessages.map((message) => (
            <WorkspaceMessageRenderer
              key={message.id}
              message={message}
              stageLabel={stageLabel}
            />
          ))
        )}
      </div>

      <div className="border-t border-white/10 p-4">
        <div className="flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={loading || !setMessages}
            className="min-h-[88px] flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            onClick={() => void handleSend()}
            disabled={loading || !input.trim() || !setMessages}
            className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Thinking..." : "Engage Agent"}
          </button>
        </div>
      </div>
    </div>
  );
}