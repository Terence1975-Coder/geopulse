"use client";

import { AlertTriangle, ArrowUpRight, Radio, RefreshCcw, ScanSearch } from "lucide-react";
import { SignalItem } from "@/lib/api";

function severityClass(severity: number) {
  if (severity >= 75) return "sev-high";
  if (severity >= 50) return "sev-mid";
  return "sev-low";
}

function credibilityLabel(score: number) {
  if (score >= 0.85) return "High";
  if (score >= 0.6) return "Medium";
  return "Low";
}

export default function SignalMonitor({
  signals,
  onPromote,
  onAnalyze,
  onIngest,
  busySignalId,
  ingesting
}: {
  signals: SignalItem[];
  onPromote: (id: string) => void;
  onAnalyze: (id: string) => void;
  onIngest: () => void;
  busySignalId?: string | null;
  ingesting?: boolean;
}) {
  return (
    <div className="panel">
      <div className="section-header">
        <div className="section-title">
          <Radio size={18} />
          <span>Live Signal Monitor</span>
        </div>
        <button className="action-button" onClick={onIngest} disabled={ingesting}>
          <RefreshCcw size={16} />
          <span>{ingesting ? "Ingesting..." : "Ingest Signals"}</span>
        </button>
      </div>

      <div className="signal-feed">
        {signals.length === 0 ? (
          <div className="empty-state">No signals yet. Use ingest to start the live feed.</div>
        ) : (
          signals.map((signal) => (
            <div key={signal.id} className="signal-card">
              <div className="signal-top">
                <div className={`severity-pill ${severityClass(signal.severity_hint)}`}>
                  <AlertTriangle size={14} />
                  <span>{signal.severity_hint}</span>
                </div>
                <div className="signal-region">{signal.region}</div>
                <div className="signal-source">{signal.source_name}</div>
                <div className="signal-credibility">
                  Credibility: {credibilityLabel(signal.credibility_score)}
                </div>
              </div>

              <div className="signal-headline">{signal.headline}</div>
              <div className="signal-content">{signal.short_content}</div>

              <div className="tag-row">
                {signal.sector_tags.map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="signal-actions">
                <button
                  className="secondary-button"
                  onClick={() => onAnalyze(signal.id)}
                  disabled={busySignalId === signal.id}
                >
                  <ScanSearch size={14} />
                  <span>{busySignalId === signal.id ? "Analyzing..." : "Quick Analyze"}</span>
                </button>

                <button
                  className="primary-button"
                  onClick={() => onPromote(signal.id)}
                  disabled={!!signal.promoted_to_event_id || busySignalId === signal.id}
                >
                  <ArrowUpRight size={14} />
                  <span>{signal.promoted_to_event_id ? "Promoted" : "Promote to Event"}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
