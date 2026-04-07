"use client";

import { CompanyProfile, ScenarioResponse } from "../types";
import { useState } from "react";

type Props = {
  profile: CompanyProfile;
  onSimulate: (payload: {
    title: string;
    scenario_type: string;
    severity: number;
    region: string;
    narrative_input?: string;
  }) => Promise<void>;
  result: ScenarioResponse | null;
};

export default function ScenarioPanel({ onSimulate, result }: Props) {
  const [title, setTitle] = useState("Oil shock and shipping escalation");
  const [scenarioType, setScenarioType] = useState("oil_price_surge");
  const [severity, setSeverity] = useState(70);
  const [region, setRegion] = useState("Global");
  const [narrativeInput, setNarrativeInput] = useState("");

  const safeScenarioTitle =
    (result as any)?.scenario_title ??
    (result as any)?.scenario_name ??
    "Scenario simulation";

  const safeProjectedRisk =
    (result as any)?.projected_dashboard_risk ??
    (result as any)?.impact_level ??
    0;

  const safeProjectedPosture =
    (result as any)?.projected_posture ?? "Monitoring";

  const safeNarrative =
    (result as any)?.narrative_explanation ??
    (result as any)?.summary ??
    "";

  const safeCategoryDeltas = Array.isArray((result as any)?.category_deltas)
    ? (result as any).category_deltas
    : [];

  const safeExecutiveActions = Array.isArray(
    (result as any)?.recommended_executive_actions
  )
    ? (result as any).recommended_executive_actions
    : Array.isArray((result as any)?.recommendations)
    ? (result as any).recommendations
    : [];

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Scenario Simulation Engine</h2>
      </div>

      <div className="stack">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Scenario title"
        />

        <select
          value={scenarioType}
          onChange={(e) => setScenarioType(e.target.value)}
        >
          <option value="conflict">Hypothetical worsening conflict</option>
          <option value="oil_price_surge">Oil price surge</option>
          <option value="port_shutdown">Port shutdown</option>
          <option value="currency_shock">Currency shock</option>
          <option value="regulatory_change">Regulatory change</option>
        </select>

        <input
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          placeholder="Region"
        />

        <label>
          Severity: {severity}
          <input
            type="range"
            min={20}
            max={100}
            value={severity}
            onChange={(e) => setSeverity(Number(e.target.value))}
          />
        </label>

        <textarea
          value={narrativeInput}
          onChange={(e) => setNarrativeInput(e.target.value)}
          rows={3}
          placeholder="Optional scenario notes"
        />

        <button
          className="primary-btn"
          onClick={() =>
            onSimulate({
              title,
              scenario_type: scenarioType,
              severity,
              region,
              narrative_input: narrativeInput,
            })
          }
        >
          Run Scenario Simulation
        </button>

        {result && (
          <>
            <div className="subpanel">
              <h3>{safeScenarioTitle}</h3>
              <p className="panel-copy">
                Projected risk: {safeProjectedRisk}/100 • {safeProjectedPosture}
              </p>
              <p className="muted">{safeNarrative}</p>
            </div>

            <div className="subpanel">
              <h4>Category deltas</h4>
              <div className="stack">
                {safeCategoryDeltas.length === 0 ? (
                  <p className="muted">
                    No category delta breakdown available yet.
                  </p>
                ) : (
                  safeCategoryDeltas.map((item: any) => (
                    <div key={item.name} className="metric-row">
                      <div>
                        <strong>{item.name}</strong>
                        <p className="muted">{item.explanation ?? ""}</p>
                      </div>
                      <span className="metric-pill">
                        {item.score ?? 0} (
                        {(item.delta ?? 0) >= 0 ? "+" : ""}
                        {item.delta ?? 0})
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="subpanel">
              <h4>Executive actions</h4>
              <ul className="clean-list">
                {safeExecutiveActions.length === 0 ? (
                  <li>No executive actions available yet.</li>
                ) : (
                  safeExecutiveActions.map((item: string) => (
                    <li key={item}>{item}</li>
                  ))
                )}
              </ul>
            </div>
          </>
        )}
      </div>
    </section>
  );
}