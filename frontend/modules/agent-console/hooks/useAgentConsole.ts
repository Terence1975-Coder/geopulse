"use client";

import { useMemo, useState } from "react";
import { engageAgent } from "../services/agentConsoleApi";
import { fetchPrivacyPreview } from "@/modules/trust-privacy/services/privacyApi";
import { ActionType, AgentChainState } from "../types/agentConsole";

function createSessionId() {
  return `session-${Math.random().toString(36).slice(2, 10)}`;
}

export function useAgentConsole() {
  const [input, setInput] = useState("");
  const [chainState, setChainState] = useState<AgentChainState>({
    session_id: createSessionId(),
    raw_input: "",
    completed_steps: [],
  });
  const [isRunning, setIsRunning] = useState(false);
  const [activeAction, setActiveAction] = useState<ActionType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  const runAction = async (action: ActionType) => {
    if (!input.trim()) return;
    setIsRunning(true);
    setActiveAction(action);
    setError(null);

    try {
      const response = await engageAgent({
        session_id: chainState.session_id,
        action,
        input,
        use_previous_chain: true,
        existing_chain_state: {
          ...chainState,
          raw_input: input,
        },
      });
      setChainState(response.updated_chain_state);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsRunning(false);
      setActiveAction(null);
    }
  };

  const openPrivacyPreview = async () => {
    if (!input.trim()) return;
    try {
      const preview = await fetchPrivacyPreview(input);
      setChainState((prev) => ({
        ...prev,
        raw_input: input,
        privacy_preview: preview,
        anonymized_input: preview.anonymized_input,
        privacy_risk_level: preview.privacy_risk_level,
      }));
      setPrivacyOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to preview privacy flow");
    }
  };

  const resetSession = () => {
    setInput("");
    setChainState({
      session_id: createSessionId(),
      raw_input: "",
      completed_steps: [],
    });
    setError(null);
}