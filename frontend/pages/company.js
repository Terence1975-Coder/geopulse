import { useEffect, useState } from "react"

const API = "http://127.0.0.1:8000"

export default function CompanyPage() {
  const [companies, setCompanies] = useState([])
  const [result, setResult] = useState(null)
  const [form, setForm] = useState({
    company_name: "",
    industry: "Automotive",
    primary_country: "UK",
    key_supplier_regions: "Middle East, Europe",
    fuel_energy_sensitivity: "medium",
    supply_chain_complexity: "medium",
    import_dependency: "medium",
    export_dependency: "medium",
    customer_type: "mixed",
    margin_sensitivity: "medium",
    priority_concerns: "cost volatility"
  })

  useEffect(() => {
    loadCompanies()
  }, [])

  async function loadCompanies() {
    const res = await fetch(`${API}/companies`)
    const data = await res.json()
    setCompanies(data)
  }

  async function saveCompany() {
    const payload = {
      ...form,
      key_supplier_regions: form.key_supplier_regions.split(",").map(x => x.trim()).filter(Boolean),
      priority_concerns: form.priority_concerns.split(",").map(x => x.trim()).filter(Boolean)
    }

    const res = await fetch(`${API}/companies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    const data = await res.json()
    setResult(data)
    loadCompanies()
  }

  return (
    <div style={styles.page}>
      <Nav />

      <div style={styles.layout}>
        <div style={styles.panel}>
          <div style={styles.title}>Company Profiles</div>
          <div style={styles.subtitle}>Create and manage company context for personalized intelligence.</div>

          <Input label="Company name" value={form.company_name} onChange={(v) => setForm({ ...form, company_name: v })} />
          <Input label="Industry" value={form.industry} onChange={(v) => setForm({ ...form, industry: v })} />
          <Input label="Primary country" value={form.primary_country} onChange={(v) => setForm({ ...form, primary_country: v })} />
          <Input label="Key supplier regions" value={form.key_supplier_regions} onChange={(v) => setForm({ ...form, key_supplier_regions: v })} />
          <Input label="Priority concerns" value={form.priority_concerns} onChange={(v) => setForm({ ...form, priority_concerns: v })} />

          <div style={styles.grid2}>
            <Select label="Fuel sensitivity" value={form.fuel_energy_sensitivity} onChange={(v) => setForm({ ...form, fuel_energy_sensitivity: v })} />
            <Select label="Supply chain complexity" value={form.supply_chain_complexity} onChange={(v) => setForm({ ...form, supply_chain_complexity: v })} />
            <Select label="Import dependency" value={form.import_dependency} onChange={(v) => setForm({ ...form, import_dependency: v })} />
            <Select label="Export dependency" value={form.export_dependency} onChange={(v) => setForm({ ...form, export_dependency: v })} />
            <Select label="Customer type" value={form.customer_type} onChange={(v) => setForm({ ...form, customer_type: v })} options={["B2B", "B2C", "mixed"]} />
            <Select label="Margin sensitivity" value={form.margin_sensitivity} onChange={(v) => setForm({ ...form, margin_sensitivity: v })} />
          </div>

          <button style={styles.primaryButton} onClick={saveCompany}>Save Company</button>

          {result && (
            <pre style={styles.pre}>
{JSON.stringify(result, null, 2)}
            </pre>
          )}
        </div>

        <div style={styles.panel}>
          <div style={styles.title}>Saved Companies</div>
          <div style={styles.subtitle}>Profiles available for personalized GeoPulse analysis.</div>

          <div style={styles.list}>
            {companies.map((company) => (
              <div key={company.company_id} style={styles.companyCard}>
                <div style={styles.companyName}>{company.company_name}</div>
                <div style={styles.companyMeta}>
                  {company.industry} · {company.primary_country} · margin {company.margin_sensitivity}
                </div>
              </div>
            ))}
          </div>
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

function Input({ label, value, onChange }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={styles.label}>{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} style={styles.input} />
    </div>
  )
}

function Select({ label, value, onChange, options }) {
  const opts = options || ["low", "medium", "high"]
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={styles.label}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={styles.input}>
        {opts.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
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
    gridTemplateColumns: "1.1fr 0.9fr",
    gap: 18
  },
  panel: {
    background: "#fff",
    borderRadius: 20,
    padding: 22,
    boxShadow: "0 10px 24px rgba(14, 31, 66, 0.08)"
  },
  title: { fontSize: 24, fontWeight: 800 },
  subtitle: { fontSize: 13, color: "#6b7891", marginTop: 6, marginBottom: 18 },
  label: { display: "block", marginBottom: 8, fontSize: 13, color: "#65748f" },
  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #d6dfed"
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 12
  },
  primaryButton: {
    marginTop: 8,
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
  list: {
    display: "grid",
    gap: 12
  },
  companyCard: {
    padding: 16,
    borderRadius: 16,
    background: "#f8fbff",
    border: "1px solid #dfe8f5"
  },
  companyName: { fontSize: 18, fontWeight: 800 },
  companyMeta: { marginTop: 8, color: "#60708a" }
}