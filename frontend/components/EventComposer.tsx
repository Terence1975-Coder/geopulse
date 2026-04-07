"use client";

import { useState } from "react";

type Props = {
  onCreate: (payload: {
    headline: string;
    body: string;
    region: string;
    source: string;
    credibility: number;
  }) => Promise<void>;
};

export default function EventComposer({ onCreate }: Props) {
  const [headline, setHeadline] = useState("");
  const [body, setBody] = useState("");
  const [region, setRegion] = useState("Global");
  const [source, setSource] = useState("Manual");
  const [credibility, setCredibility] = useState(0.8);
  const [submitting, setSubmitting] = useState(false);

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Create Event</h2>
      </div>

      <div className="stack">
        <input
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="Headline"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Body"
          rows={5}
        />
        <div className="form-grid">
          <input
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder="Region"
          />
          <input
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="Source"
          />
        </div>

        <label>
          Credibility: {credibility.toFixed(2)}
          <input
            type="range"
            min={0.4}
            max={1}
            step={0.01}
            value={credibility}
            onChange={(e) => setCredibility(Number(e.target.value))}
          />
        </label>

        <button
          className="primary-btn"
          disabled={submitting}
          onClick={async () => {
            if (!headline.trim() || !body.trim()) return;

            try {
              setSubmitting(true);
              await onCreate({ headline, body, region, source, credibility });
              setHeadline("");
              setBody("");
            } catch (error) {
              console.error("Event creation failed:", error);
              alert("Event creation failed. Check browser console and backend terminal.");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {submitting ? "Creating..." : "Create Event"}
        </button>
      </div>
    </section>
  );
}