import { useEffect, useState } from "react"

const API = "http://127.0.0.1:8000"

export default function EventsPage() {
  const [events, setEvents] = useState([])
  const [companies, setCompanies] = useState([])
  const [selectedCompanyId, setSelectedCompanyId] = useState("")
  const [result, setResult] = useState(null)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [loadingAnalysisId, setLoadingAnalysisId] = useState("")
  const [form, setForm] = useState({
    headline: "",
    body: "",
    source_name: "Manual",
    source_url: "",
    region: "",
    topics: ""
  })

  useEffect(() => {
    loadEvents()
    loadCompanies()
  }, [])

  async function loadEvents() {
    const res = await fetch(`${API}/events`)
    const data = await res.json()
    setEvents(data)
  }

  async function loadCompanies() {
    const res = await fetch(`${API}/companies`)
    const data = await res.json()
    setCompanies(data)
    if (data?.length && !selectedCompanyId) {
      setSelectedCompanyId(data[0].company_id)
    }
  }

  async function saveEvent() {
    const payload = {
      ...form,
      topics: form.topics.split(",").map(x => x.trim()).filter(Boolean)
    }

    const res = await fetch(`${API}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    const data = await res.json()
    setResult(data)
    setForm({
      headline: "",
      body: "",
      source_name: "Manual",
      source_url: "",
      region: "",
      topics: ""
    })
    loadEvents()
  }

  async function analyzeEvent(eventId) {
    setLoadingAnalysisId(eventId)
    try {
      const res = await fetch(`${API}/analyze/${eventId}`, { method: "POST" })
      const data = await res.json()
      setAnalysisResult(data)
    } finally {
      setLoadingAnalysisId("")
    }
  }

  async function analyzeForCompany(eventId) {
    if (!selectedCompanyId) {
      alert("Select a company first.")
      return
    }
    setLoadingAnalysisId(eventId)
    try {
      const res = await fetch(`${API}/analyze/${eventId}/company/${selectedCompanyId}`, { method: "POST" })
      const data = await res.json()
      setAnalysisResult(data)
    } finally {
      setLoadingAnalysisId("")
    }
  }

  return (
    <div style={styles.page}>
      <Nav />
      <div style={styles.layout}>
        <div style={styles.left}>
          <Panel title="Create Event" subtitle="Add a manual event or trusted-source signal">
            <Input label="Headline" value={form.headline} onChange={(v) => setForm({ ...form, headline: v })} />
            <TextArea label="Body" value={form.body} onChange={(v) => setForm({ ...form, body: v })} />
            <Input label="Source name" value={form.source_name} onChange={(v) => setForm({ ...form, source_name: v })} />
            <Input label="Source URL" value={form.source_url} onChange={(v) => setForm({ ...form, source_url: v })} />
            <Input label="Region" value={form.region} onChange={(v) => setForm({ ...form, region: v })} />
            <Input label="Topics (comma separated)" value={form.topics} onChange={(v) => setForm({ ...form, topics: v })} />

            <button style={styles.primaryButton} onClick={saveEvent}>Save Event</button>

            {result && (
              <pre style={styles.pre}>
{JSON.stringify(result, null, 2)}
              </pre>
            )}
          </Panel>
        </div>

        <div style={styles.right}>
          <Panel title="Analyze Events" subtitle="Run event or company-specific analysis from the UI">
            <label style={styles.label}>Company for personalized analysis</label>
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              style={styles.select}
            >
              <option value="">No company selected</option>
              {companies.map((company) => (
                <option key={company.company_id} value={company.company_id}>
                  {company.company_name}
                </option>
              ))}
            </select>

            <div style={styles.eventList}>
              {events.map((event) => (
                <div key={event.event_id} style={styles.eventCard}>
                  <div style={styles.eventMeta}>
                    {event.source_name || "Manual"} · {event.region || "Global"}
                  </div>
                  <div style={styles.eventTitle}>{event.headline}</div>
                  <div style={styles.eventBody}>{event.body}</div>
                  <div style={styles.buttonRow}>
                    <button
                      style={styles.primaryButton}
                      onClick={() => analyzeEvent(event.event_id)}
                      disabled={loadingAnalysisId === event.event_id}
                    >
                      {loadingAnalysisId === event.event_id ? "Analyzing..." : "Analyze"}
                    </button>
                    <button
                      style={styles.secondaryButton}
                      onClick={() => analyzeForCompany(event.event_id)}
                      disabled={loadingAnalysisId === event.event_id}
                    >
                      {loadingAnalysisId === event.event_id ? "Working..." : "Analyze for Company"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Analysis Output" subtitle="Most recent UI-triggered result">
            {analysisResult ? (
              <pre style={styles.pre}>
{JSON.stringify(analysisResult, null, 2)}
              </pre>
            ) : (
              <p style={styles.muted}>Run an analysis from one of the event cards.</p>
            )}
          </Panel>
        </div>
      </div>
    </div>
  )
}

function Nav() {
  return (
    <nav style={styles.nav}>
      <div style={styles.logo}>GeoPulse AI</div>
      <div style={styles.navLinks}>
        <a href="/" style={styles.link}>Dashboard</a>
        <a href="/events" style={styles.link}>Events</a>
        <a href="/company" style={styles.link}>Company</a>
        <a href="/sources" style={styles.link}>Sources</a>
      </div>
    </nav>
  )
}

function Panel({ title, subtitle, children }) {
  return (
    <div style={styles.panel}>
      <div style={{ marginBottom: 14 }}>
        <div style={styles.panelTitle}>{title}</div>
        <div style={styles.panelSubtitle}>{subtitle}</div>
      </div>
      {children}
    </div>
  )
}

function Input({ label, value, onChange }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={styles.label}>{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} style={styles.input} />
    </div>
  )
}

function TextArea({ label, value, onChange }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={styles.label}>{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} style={styles.textarea} />
    </div>
  )
}

const styles = {
  page: {
    fontFamily: "Inter, Arial, sans-serif",
    background: "linear-gradient(180deg, #f4f7fb 0%, #eef3f9 100%)",
    minHeight: "100vh",
    padding: 24,
    color: "#162033"
  },
  nav: {
    maxWidth: 1280,
    margin: "0 auto 24px auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 18px",
    background: "#fff",
    borderRadius: 16,
    boxShadow: "0 8px 24px rgba(12, 28, 61, 0.08)",
    flexWrap: "wrap",
    gap: 12
  },
  logo: { fontSize: 22, fontWeight: 800 },
  navLinks: { display: "flex", gap: 14, flexWrap: "wrap" },
  link: { color: "#1f3f77", textDecoration: "none", fontWeight: 600 },
  layout: {
    maxWidth: 1280,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "1fr 1.2fr",
    gap: 18
  },
  left: {},
  right: { display: "grid", gap: 18 },
  panel: {
    background: "#fff",
    borderRadius: 20,
    padding: 22,
    boxShadow: "0 10px 24px rgba(14, 31, 66, 0.08)"
  },
  panelTitle: { fontSize: 22, fontWeight: 800 },
  panelSubtitle: { fontSize: 13, color: "#6b7891", marginTop: 6 },
  label: { display: "block", marginBottom: 8, fontSize: 13, color: "#65748f" },
  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #d6dfed"
  },
  textarea: {
    width: "100%",
    minHeight: 120,
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #d6dfed"
  },
  select: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #d6dfed",
    marginBottom: 16
  },
  primaryButton: {
    background: "#184f98",
    color: "white",
    border: "none",
    borderRadius: 12,
    padding: "12px 16px",
    fontWeight: 700,
    cursor: "pointer"
  },
  secondaryButton: {
    background: "#ffffff",
    color: "#184f98",
    border: "1px solid #bfcfe8",
    borderRadius: 12,
    padding: "12px 16px",
    fontWeight: 700,
    cursor: "pointer"
  },
  eventList: {
    display: "grid",
    gap: 12
  },
  eventCard: {
    background: "#f8fbff",
    border: "1px solid #dfe8f5",
    borderRadius: 18,
    padding: 16
  },
  eventMeta: { fontSize: 12, color: "#5f6f89", marginBottom: 8 },
  eventTitle: { fontSize: 18, fontWeight: 800, marginBottom: 8 },
  eventBody: { color: "#435067", lineHeight: 1.5 },
  buttonRow: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 },
  pre: {
    marginTop: 16,
    background: "#f5f7fb",
    padding: 16,
    borderRadius: 12,
    overflowX: "auto",
    whiteSpace: "pre-wrap"
  },
  muted: { color: "#61708c" }
}