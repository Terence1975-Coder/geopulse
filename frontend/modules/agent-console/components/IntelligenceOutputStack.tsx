"use client";

import { AgentChainState } from "../types/agentConsole";
import { OutputCard } from "./OutputCard";

function renderList(items?: string[]) {
  if (!items || items.length === 0) return null;
  return (
    <ul className="list-disc space-y-1 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function IntelligenceOutputStack({ chainState }: { chainState: AgentChainState }) {
  return (
    <div className="space-y-4">
      {chainState.analysis && (
        <OutputCard title="Analysis Result">
          <p>{chainState.analysis.summary}</p>
          <div>
            <div className="mb-1 font-medium">Key Risks</div>
            {renderList(chainState.analysis.key_risks)}
          </div>
          <div>
            <div className="mb-1 font-medium">Opportunities</div>
            {renderList(chainState.analysis.opportunities)}
          </div>
        </OutputCard>
      )}

      {chainState.advice && (
        <OutputCard title="Advisory Result">
          <p>{chainState.advice.execu