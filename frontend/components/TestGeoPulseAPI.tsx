"use client";

import { useState } from "react";

export default function TestGeoPulseAPI() {
  const [result, setResult] = useState("");

  async function runTest() {
    try {
      const res = await fetch("http://127.0.0.1:8000/intel/agent/engage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: "Oil prices rising rapidly in Middle East, what should we do?",
          stage: "advise",
        }),
      });

      const data = await res.json();

      console.log("GeoPulse API:", data);

      setResult(data?.outputs?.advise || "No advise output");
    } catch (err) {
      console.error(err);
      setResult("API failed");
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <button onClick={runTest}>Test GeoPulse API</button>
      <pre style={{ whiteSpace: "pre-wrap", marginTop: 10 }}>
        {result}
      </pre>
    </div>
  );
}