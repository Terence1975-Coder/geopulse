import { useEffect, useMemo, useState } from "react";

const API = "http://127.0.0.1:8000";

export default function Home() {
  const [dashboardBrief, setDashboardBrief] = useState(null);
  const [events, setEvents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loadingAnalysisId, setLoadingAnalysisId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function safeJson(res) {
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Request failed: ${res.status}`);
    }
    return res.json();
  }

  async function loadDashboard() {
    const res = await fetch(`${API}/dashboard/brief`);
    const data = await safeJson(res);
    setDashboardBrief(data);

    if (data?.latest_analysis) {
      setAnalysisResult(data.latest_analysis);
    } else {
      setAnalysisResult(null);
    }
  }

  async function loadEvents() {
    const res = await fetch(`${API}/events`);
    const data = await safeJson(res);
    setEvents(Array.isArray(data) ? data : []);
  }

  async function loadCompanies() {
    const res = await fetch(`${API}/companies`);
    const data = await safeJson(res);
    const companyList = Array.isArray(data) ? data : [];
    setCompanies(companyList);

    if (companyList.length && !selectedCompanyId) {
      setSelectedCompanyId(companyList[0].company_id);
    }
  }

  async function runAnalysis(eventId) {
    try {
      setLoadingAnalysisId(eventId);
      setError("");

      const res = await fetch(`${API}/analyze/${eventId}`, {
        method: "POST",
      });

      const data = await safeJson(res);
      setAnalysisResult(data);

      await loadDashboard();
    } catch (err) {
      setError(err.message || "Failed to analyze event");
    } finally {
      setLoadingAnalysisId("");
    }
  }

  async function loadAll() {
    try {
      setLoading(true);
      setError("");
      await Promise.all([loadDashboard(), loadEvents(), loadCompanies()]);
    } catch (err) {
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const latestEvent = useMemo(() => {
    if (!events.length) return null;
    return events[events.length - 1];
  }, [events]);

  const scores = analysisResult?.scores || {};

  const globalRiskIndex = useMemo(() => {
    const values = [
      scores.energy_risk ?? 0,
      scores.supply_chain_risk ?? 0,
      scores.inflation_risk ?? 0,
      scores.market_volatility_risk ?? 0,
    ];

    const total = values.reduce((sum, value) => sum + value, 0);
    return Math.round(total / values.length);
  }, [scores]);

  if (loading) {
    return (
      <div style={pageStyle}>
        <h1 style={headingStyle}>GeoPulse AI V6</h1>
        <p style={subtleText}>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={headerRow}>
        <div>
          <h1 style={headingStyle}>GeoPulse AI V6</h1>
          <p style={subtleText}>
            Live geopolitical event intelligence dashboard
          </p>
        </div>

        <button style={buttonStyle} onClick={loadAll}>
          Refresh Dashboard
        </button>
      </div>

      {error ? (
        <div style={errorBoxStyle}>
          <strong>Dashboard Error</strong>
          <p style={{ marginTop: 8 }}>{error}</p>
        </div>
      ) : null}

      <div style={topGridStyle}>
        <Card
          title="Energy Risk"
          value={scores.energy_risk ?? 0}
          subtitle="Exposure to energy disruption"
        />
        <Card
          title="Supply Chain Risk"
          value={scores.supply_chain_risk ?? 0}
          subtitle="Pressure on logistics and sourcing"
        />
        <Card
          title="Inflation Risk"
          value={scores.inflation_risk ?? 0}
          subtitle="Potential pricing pressure"
        />
        <Card
          title="Market Volatility"
          value={scores.market_volatility_risk ?? 0}
          subtitle="Financial instability sensitivity"
        />
        <Card
          title="Global Risk Index"
          value={globalRiskIndex}
          subtitle="Average of key GeoPulse risks"
        />
      </div>

      <div style={mainGridStyle}>
        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <h2 style={panelTitleStyle}>Live Events</h2>
            <span style={pillStyle}>{events.length} total</span>
          </div>

          {!events.length ? (
            <p style={subtleText}>No events available yet.</p>
          ) : (
            events
              .slice()
              .reverse()
              .map((event) => {
                const isLatest = latestEvent?.id === event.id;

                return (
                  <div
                    key={event.id}
                    style={{
                      ...eventCardStyle,
                      border: isLatest
                        ? "1px solid rgba(56, 189, 248, 0.55)"
                        : "1px solid #1e293b",
                      boxShadow: isLatest
                        ? "0 0 0 1px rgba(56, 189, 248, 0.15) inset"
                        : "none",
                    }}
                  >
                    <div style={eventTopRowStyle}>
                      <div>
                        <h3 style={eventTitleStyle}>
                          {event.headline || "Untitled event"}
                        </h3>
                        <p style={subtleText}>
                          {event.region || "Unknown region"}
                          {event.source ? ` • ${event.source}` : ""}
                        </p>
                      </div>

                      <div style={severityBadge(event.severity)}>
                        {event.severity || "Unknown"}
                      </div>
                    </div>

                    <p style={eventBodyStyle}>
                      {event.body || "No event body provided."}
                    </p>

                    <div style={eventActionRowStyle}>
                      <span style={smallCodePillStyle}>ID: {event.id}</span>

                      <button
                        style={buttonStyle}
                        onClick={() => runAnalysis(event.id)}
                        disabled={loadingAnalysisId === event.id}
                      >
                        {loadingAnalysisId === event.id
                          ? "Analyzing..."
                          : "Analyze Event"}
                      </button>
                    </div>
                  </div>
                );
              })
          )}
        </div>

        <div style={sideColumnStyle}>
          <div style={panelStyle}>
            <h2 style={panelTitleStyle}>Latest Analysis</h2>

            {!analysisResult ? (
              <p style={subtleText}>
                No analysis has been run yet. Click “Analyze Event” on an event.
              </p>
            ) : (
              <>
                <p style={labelStyle}>Headline</p>
                <p style={valueTextStyle}>
                  {analysisResult.headline || analysisResult.title || "—"}
                </p>

                <p style={labelStyle}>Executive Summary</p>
                <p style={bodyTextStyle}>
                  {analysisResult.executive_summary || "No summary available."}
                </p>

                <p style={labelStyle}>Confidence Score</p>
                <p style={scoreTextStyle}>
                  {analysisResult.confidence_score ?? 0}%
                </p>
              </>
            )}
          </div>

          <div style={panelStyle}>
            <div style={panelHeaderStyle}>
              <h2 style={panelTitleStyle}>Companies</h2>
              <span style={pillStyle}>{companies.length}</span>
            </div>

            {!companies.length ? (
              <p style={subtleText}>No companies available.</p>
            ) : (
              <>
                <select
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  style={selectStyle}
                >
                  {companies.map((company) => (
                    <option key={company.company_id} value={company.company_id}>
                      {company.name}
                    </option>
                  ))}
                </select>

                <div style={{ marginTop: 16 }}>
                  {companies
                    .filter((company) => company.company_id === selectedCompanyId)
                    .map((company) => (
                      <div key={company.company_id} style={companyCardStyle}>
                        <p style={valueTextStyle}>{company.name}</p>
                        <p style={subtleText}>Sector: {company.sector || "—"}</p>
                        <p style={subtleText}>Region: {company.region || "—"}</p>
                      </div>
                    ))}
                </div>
              </>
            )}
          </div>

          <div style={panelStyle}>
            <h2 style={panelTitleStyle}>Dashboard Summary</h2>
            <p style={bodyTextStyle}>
              {dashboardBrief?.summary ||
                "No dashboard summary available yet. Create and analyze an event."}
            </p>
            <div style={{ marginTop: 16 }}>
              <p style={subtleText}>
                Events: {dashboardBrief?.event_count ?? events.length}
              </p>
              <p style={subtleText}>
                Analyses: {dashboardBrief?.analysis_count ?? 0}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ title, value, subtitle }) {
  return (
    <div style={cardStyle}>
      <p style={cardTitleStyle}>{title}</p>
      <p style={cardValueStyle}>{value}</p>
      <p style={cardSubtitleStyle}>{subtitle}</p>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "#020617",
  color: "white",
  padding: "32px",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const headerRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  flexWrap: "wrap",
  marginBottom: "24px",
};

const headingStyle = {
  fontSize: "36px",
  fontWeight: 700,
  margin: 0,
};

const subtleText = {
  color: "#94a3b8",
  margin: "6px 0 0 0",
};

const topGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "16px",
  marginBottom: "24px",
};

const mainGridStyle = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr",
  gap: "24px",
};

const sideColumnStyle = {
  display: "grid",
  gap: "24px",
};

const panelStyle = {
  background: "#0f172a",
  border: "1px solid #1e293b",
  borderRadius: "18px",
  padding: "20px",
};

const panelHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  marginBottom: "16px",
};

const panelTitleStyle = {
  fontSize: "20px",
  margin: 0,
};

const pillStyle = {
  background: "#172554",
  color: "#bfdbfe",
  borderRadius: "999px",
  padding: "6px 10px",
  fontSize: "12px",
};

const cardStyle = {
  background: "#0f172a",
  border: "1px solid #1e293b",
  borderRadius: "18px",
  padding: "20px",
};

const cardTitleStyle = {
  color: "#94a3b8",
  fontSize: "14px",
  margin: 0,
};

const cardValueStyle = {
  fontSize: "34px",
  fontWeight: 700,
  margin: "10px 0 6px 0",
};

const cardSubtitleStyle = {
  color: "#94a3b8",
  fontSize: "13px",
  margin: 0,
};

const eventCardStyle = {
  background: "#111827",
  borderRadius: "16px",
  padding: "18px",
  marginBottom: "14px",
};

const eventTopRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "12px",
};

const eventTitleStyle = {
  margin: 0,
  fontSize: "18px",
};

const eventBodyStyle = {
  color: "#cbd5e1",
  marginTop: "12px",
  lineHeight: 1.6,
};

const eventActionRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  marginTop: "14px",
  flexWrap: "wrap",
};

const smallCodePillStyle = {
  background: "#1e293b",
  color: "#cbd5e1",
  borderRadius: "999px",
  padding: "6px 10px",
  fontSize: "12px",
  wordBreak: "break-all",
};

const buttonStyle = {
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "10px",
  padding: "10px 14px",
  cursor: "pointer",
};

const errorBoxStyle = {
  background: "rgba(127, 29, 29, 0.35)",
  border: "1px solid rgba(248, 113, 113, 0.4)",
  color: "#fecaca",
  borderRadius: "16px",
  padding: "16px",
  marginBottom: "20px",
};

const labelStyle = {
  color: "#94a3b8",
  fontSize: "13px",
  marginTop: "16px",
  marginBottom: "6px",
};

const valueTextStyle = {
  fontSize: "16px",
  margin: 0,
};

const bodyTextStyle = {
  color: "#cbd5e1",
  lineHeight: 1.7,
  margin: 0,
};

const scoreTextStyle = {
  fontSize: "28px",
  fontWeight: 700,
  color: "#60a5fa",
  margin: 0,
};

const selectStyle = {
  width: "100%",
  background: "#111827",
  color: "white",
  border: "1px solid #334155",
  borderRadius: "10px",
  padding: "10px 12px",
};

const companyCardStyle = {
  background: "#111827",
  border: "1px solid #1e293b",
  borderRadius: "14px",
  padding: "14px",
};

function severityBadge(severity) {
  const value = (severity || "").toLowerCase();

  let background = "#1e293b";
  let color = "#cbd5e1";
  let border = "1px solid #334155";

  if (value === "high") {
    background = "rgba(127, 29, 29, 0.28)";
    color = "#fecaca";
    border = "1px solid rgba(248, 113, 113, 0.35)";
  } else if (value === "medium") {
    background = "rgba(120, 53, 15, 0.28)";
    color = "#fde68a";
    border = "1px solid rgba(251, 191, 36, 0.35)";
  } else if (value === "low") {
    background = "rgba(20, 83, 45, 0.28)";
    color = "#bbf7d0";
    border = "1px solid rgba(74, 222, 128, 0.35)";
  }

  return {
    background,
    color,
    border,
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "12px",
    textTransform: "capitalize",
    whiteSpace: "nowrap",
  };
}
