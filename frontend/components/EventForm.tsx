"use client";

import { useState } from "react";
import { PlusCircle } from "lucide-react";

export default function EventForm({
  onSubmit
}: {
  onSubmit: (payload: {
    headline: string;
    body: string;
    region: string;
    sector_tags: string[];
    severity: number;
    source_name: string;
    credibility_score: number;
  }) => Promise<void>;
}) {
  const [headline, setHeadline] = useState("");
  const [body, setBody] = useState("");
  const [region, setRegion] = useState("Global");
  const [tags, setTags] = useState("general");
  const [severity, setSeverity] = useState(60);
  const [sourceName, setSourceName] = useState("Manual Entry");
  const [credibility, setCredibility] = useState(0.7);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        headline,
        body,
        region,
        sector_tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        severity,
        source_name: sourceName,
        credibility_score: credibility
      });
      setHeadline("");
      setBody("");
      setTags("general");
      setSeverity(60);
      setSourceName("Manual Entry");
      setCredibility(0.7);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="panel">
      <div className="section-title">
        <PlusCircle size={18} />
        <span>Create Manual Event</span>
      </div>

      <form className="form-grid" onSubmit={handleSubmit}>
        <input
          className="input"
          placeholder="Headline"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          required
        />
        <input
          className="input"
          placeholder="Region"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
        />
        <textarea
          className="textarea"
          placeholder="Event details"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
        />
        <input
          className="input"
          placeholder="Tags, comma separated"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
        <input
          className="input"
          placeholder="Source name"
          value={sourceName}
          onChange={(e) => setSourceName(e.target.value)}
        />

        <div className="slider-group">
          <label>Severity: {severity}</label>
          <input
            type="range"
            min="0"
            max="100"
            value={severity}
            onChange={(e) => setSeverity(Number(e.target.value))}
          />
        </div>

        <div className="slider-group">
          <label>Credibility: {credibility.toFixed(2)}</label>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.01"
            value={credibility}
            onChange={(e) => setCredibility(Number(e.target.value))}
          />
        </div>

        <button className="primary-button" type="submit" disabled={submitting}>
          {submitting ? "Creating..." : "Create Event"}
        </button>
      </form>
    </div>
  );
}
