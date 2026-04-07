import { useEffect, useState } from "react"

const API = "http://127.0.0.1:8000"

export default function SourcesPage() {
  const [sources, setSources] = useState([])
  const [pasteText, setPasteText] = useState("")
  const [csvText, setCsvText] = useState("")
  const [result, setResult] = useState(null)

  useEffect(() => {
    loadSources()
  }, [])

  async function loadSources() {
    const res = await fetch(`${API}/sources`)
    const data = await res.json()
    setSources(data)
  }

  async function pasteSources() {
    const res = await fetch(`${API}/sources/paste`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lines: pasteText })
    })
    const data = await res.json()
    setResult(data)
    loadSources()
  }

  async function uploadCsvText() {
    const res = await fetch(`${API}/sources/upload-csv-text`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv_text: csvText })
    })
    const data = await res.json()
    setResult(data)
    loadSources()
  }

  return (
    <div style={styles.page}>
      <Nav />

      <div style={styles.layout}>
        <div style={styles.leftCol}>
          <Panel title="Paste source list" subtitle="Quick import for trusted domains and institutions">
            <p style={styles.muted}>Accepted formats per line:</p>
            <pre style={styles.example}>
Source Name,domain.com,source_type,country,region,topic1|topic2
gov.uk
Reuters,reuters.com,news,Global,Global,geopolitics|markets|energy
            </pre>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              style={styles.textarea}
            />
            <button style={styles.primaryButton} onClick={pasteSources}>Import Pasted Sources</button>
          </Panel>

          <Panel title="Paste CSV text" subtitle="Bulk import trusted source metadata">
            <pre style={styles.example}>
source_name,base_url,source_type,country,region,topics,trust_score,priority_weight,active,notes
UK Government,gov.uk,government,UK,Europe,policy|law|regulation,0.98,1.0,true,Primary UK source
Reuters,reuters.com,news,Global,Global,geopolitics|markets|energy,0.92,0.9,true,Global wire
            </pre>
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              style={styles.textareaLarge}
            />
            <button style={styles.primaryButton} onClick={uploadCsvText}>Import CSV Text</button>

            {result && (
              <pre style={styles.pre}>
{JSON.stringify(result, null, 2)}
              </pre>
            )}
          </Panel>
        </div>

        <div style={styles.rightCol}>
          <Panel title="Trusted Sources Registry" subtitle="Current active sources available to GeoPulse">
            <div style={styles.sourceGrid}>
              {sources.map((source) => (
                <div key={source.source_id} style={styles.sourceCard}>
                  <div style={styles.sourceName}>{source.source_name}</div>
                  <div style={styles.sourceMeta}>{source.base_url}</div>
                  <div style={styles.sourceMeta}>{source.source_type} · {source.region}</div>
                  <div style={styles.badgeRow}>
                    <span style={styles.badge}>trust {source.trust_score}</span>
                    <span style={styles.badge}>priority {source.priority_weight}</span>
                  </div>
                </div>
              ))}
            </div>
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
        <div style={styles.title}>{title}</div>
        <div style={styles.subtitle}>{subtitle}</div>
      </div>
      {children}
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
    gridTemplateColumns: "1fr 1fr",
    gap: 18
  },
  leftCol: { display: "grid", gap: 18 },
  rightCol: {},
  panel: {
    background: "#fff",
    borderRadius: 20,
    padding: 22,
    boxShadow: "0 10px 24px rgba(14, 31, 66, 0.08)"
  },
  title: { fontSize: 22, fontWeight: 800 },
  subtitle: { fontSize: 13, color: "#6b7891", marginTop: 6 },
  muted: { color: "#60708a" },
  example: {
    background: "#f5f7fb",
    padding: 14,
    borderRadius: 12,
    whiteSpace: "pre-wrap",
    overflowX: "auto"
  },
  textarea: {
    width: "100%",
    minHeight: 160,
    padding: 14,
    borderRadius: 12,
    border: "1px solid #d6dfed",
    marginTop: 12
  },
  textareaLarge: {
    width: "100%",
    minHeight: 220,
    padding: 14,
    borderRadius: 12,
    border: "1px solid #d6dfed",
    marginTop: 12
  },
  primaryButton: {
    marginTop: 12,
    background: "#184f98",
    color: "white",
    border: "none",
    borderRadius: 12,
    padding: "12px 16px",
    fontWeight: 700,
    cursor: "pointer"
  },
  pre: {
    marginTop: 16,
    background: "#f5f7fb",
    padding: 16,
    borderRadius: 12,
    overflowX: "auto",
    whiteSpace: "pre-wrap"
  },
  sourceGrid: {
    display: "grid",
    gap: 12
  },
  sourceCard: {
    background: "#f8fbff",
    border: "1px solid #dfe8f5",
    borderRadius: 18,
    padding: 16
  },
  sourceName: { fontSize: 18, fontWeight: 800 },
  sourceMeta: { marginTop: 6, color: "#60708a" },
  badgeRow: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 },
  badge: {
    padding: "6px 10px",
    borderRadius: 999,
    background: "#eaf2ff",
    color: "#244c8e",
    fontSize: 12,
    fontWeight: 700
  }
}