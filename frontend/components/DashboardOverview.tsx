"use client";

import { Activity, ArrowDown, ArrowRight, ArrowUp, Radar, ShieldAlert, Zap } from "lucide-react";
import { Dashboard } from "@/lib/api";

function momentumIcon(direction: string) {
  if (direction === "↑") return <ArrowUp size={18} />;
  if (direction === "↓") return <ArrowDown size={18} />;
  return <ArrowRight size={18} />;
}

function scoreClass(score: number) {
  if (score >= 75) return "risk-high";
  if (score >= 50) return "risk-mid";
  return "risk-low";
}

export default function DashboardOverview({ dashboard }: { dashboard: Dashboard | null }) {
  if (!dashboard) {
    return <div className="panel">Loading dashboard intelligence...</div>;
  }

  return (
    <div className="dashboard-grid">
      <div className="panel hero-panel">
        <div className="panel-topline">GeoPulse Intelligence Terminal</div>
        <div className="hero-row">
          <div>
            <div className="hero-label">Overall Risk Score</div>
            <div className={`hero-score ${scoreClass(dashboard.overall_risk_score)}`}>
              {dashboard.overall_risk_score}
            </div>
          </div>
          <div className="hero-metrics">
            <div className="metric-chip">
              {momentumIcon(dashboard.momentum_direction)}
              <span>Momentum {dashboard.momentum_direction}</span>
            </div>
            <div className="metric-chip">
              <Zap size={16} />
              <span>Acceleration {dashboard.risk_acceleration}</span>
            </div>
            <div className="metric-chip">
              <Radar size={16} />
              <span>{dashboard.pressure_status}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="panel stat-panel">
        <div className="stat-title">Fastest Rising Risk</div>
        <div className="stat-value">{dashboard.fastest_rising_risk_category}</div>
      </div>

      <div className="panel stat-panel">
        <div className="stat-title">Fresh Signal Pressure</div>
        <div className="stat-value">{dashboard.fresh_signal_pressure_index}</div>
      </div>

      <div className="panel stat-panel">
        <div className="stat-title">Last 24h Signal Intensity</div>
        <div className="stat-value">{dashboard.last_24h_signal_intensity}</div>
      </div>

      <div className="panel stat-panel">
        <div className="stat-title">Stored Signals / Events</div>
        <div className="stat-value">
          {dashboard.signal_count} / {dashboard.event_count}
        </div>
      </div>

      <div className="panel wide-panel">
        <div className="section-title">
          <ShieldAlert size={18} />
          <span>Risk Categories</span>
        </div>
        <div className="category-grid">
          {dashboard.category_scores.map((item) => (
            <div key={item.name} className="category-card">
              <div className="category-title">{item.name}</div>
              <div className={`category-score ${scoreClass(item.score)}`}>{item.score}</div>
              <div className="category-bar">
                <div className="category-fill" style={{ width: `${item.score}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel wide-panel">
        <div className="section-title">
          <Activity size={18} />
          <span>Momentum Intelligence</span>
        </div>
        <p className="muted">
          GeoPulse now weights severity, source credibility, and recency together. Fresh high-credibility
          signals move the dashboard faster, while older signals decay out of dominance.
        </p>
      </div>
    </div>
  );
}
