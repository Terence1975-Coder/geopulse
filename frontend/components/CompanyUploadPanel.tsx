"use client";

import { useMemo, useState } from "react";
import { uploadCompanyEvidence } from "../lib/companyApi";

type UploadCompanyEvidenceResponse = {
  document_id?: string;
  document_name?: string;
  document_type?: string;
  parsed_text?: string;
  extracted_insights?: {
    products_services?: string[];
    strategic_priorities?: string[];
    regions?: string[];
    customer_segments?: string[];
    operating_dependencies?: string[];
    risk_clues?: string[];
    opportunity_clues?: string[];
    financial_signals?: string[];
    important_notes?: string[];
  };
};

export default function CompanyUploadPanel() {
  const [text, setText] = useState("");
  const [documentName, setDocumentName] = useState("manual-input.txt");
  const [documentType, setDocumentType] = useState("text");
  const [loading, setLoading] = useState(false);
  const [result, setResult] =
    useState<UploadCompanyEvidenceResponse | null>(null);
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => text.trim().length > 0, [text]);

  async function handleProcess() {
    if (!canSubmit || loading) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = (await uploadCompanyEvidence({
        text: text.trim(),
        name: documentName.trim() || "manual-input.txt",
        type: documentType.trim() || "text",
      })) as UploadCompanyEvidenceResponse;

      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "GeoPulse could not process this company evidence."
      );
    } finally {
      setLoading(false);
    }
  }

  function renderInsightList(title: string, items?: string[]) {
    if (!items || items.length === 0) return null;

    return (
      <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
        <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
          {title}
        </div>
        <ul className="mt-3 space-y-2 text-sm text-slate-200">
          {items.map((item, index) => (
            <li key={`${title}-${index}`} className="leading-6">
              • {item}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-cyan-300/80">
            Evidence Uploads
          </div>
          <h3 className="mt-2 text-2xl font-semibold text-white">
            Company Evidence Intake
          </h3>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
            Paste company notes, brochure copy, strategy summaries, internal
            writeups, website text, or light financial context. GeoPulse will
            send it to the backend evidence endpoint and show extracted signals.
          </p>
        </div>

        <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-xs text-cyan-100">
          Accepted now: pasted text via backend upload route
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="block">
          <div className="mb-2 text-sm text-slate-300">Document Name</div>
          <input
            value={documentName}
            onChange={(e) => setDocumentName(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white outline-none"
          />
        </label>

        <label className="block">
          <div className="mb-2 text-sm text-slate-300">Document Type</div>
          <input
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white outline-none"
          />
        </label>
      </div>

      <label className="mt-4 block">
        <div className="mb-2 text-sm text-slate-300">Evidence Text</div>
        <textarea
          rows={8}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste company overview, services, regions, dependencies, strategy notes, risk notes, or opportunity notes..."
          className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-4 text-sm leading-7 text-white outline-none placeholder:text-white/30"
        />
      </label>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleProcess}
          disabled={!canSubmit || loading}
          className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-5 py-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Processing..." : "Process Evidence"}
        </button>

        <button
          type="button"
          onClick={() => {
            setText("");
            setResult(null);
            setError("");
          }}
          className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
        >
          Clear
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-5">
            <div className="text-xs uppercase tracking-[0.18em] text-emerald-200/80">
              Parsed Result
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                  Document
                </div>
                <div className="mt-2 text-sm text-white">
                  {result.document_name ?? "Unknown"}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                  Type
                </div>
                <div className="mt-2 text-sm text-white">
                  {result.document_type ?? "Unknown"}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                  Document ID
                </div>
                <div className="mt-2 break-all text-sm text-white">
                  {result.document_id ?? "Not returned"}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {renderInsightList(
              "Products / Services",
              result.extracted_insights?.products_services
            )}
            {renderInsightList(
              "Strategic Priorities",
              result.extracted_insights?.strategic_priorities
            )}
            {renderInsightList("Regions", result.extracted_insights?.regions)}
            {renderInsightList(
              "Customer Segments",
              result.extracted_insights?.customer_segments
            )}
            {renderInsightList(
              "Operating Dependencies",
              result.extracted_insights?.operating_dependencies
            )}
            {renderInsightList(
              "Risk Clues",
              result.extracted_insights?.risk_clues
            )}
            {renderInsightList(
              "Opportunity Clues",
              result.extracted_insights?.opportunity_clues
            )}
            {renderInsightList(
              "Financial Signals",
              result.extracted_insights?.financial_signals
            )}
          </div>

          {result.extracted_insights?.important_notes?.length ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                Important Notes
              </div>
              <div className="mt-3 space-y-2 text-sm leading-7 text-slate-200">
                {result.extracted_insights.important_notes.map(
                  (note, index) => (
                    <div key={`note-${index}`}>• {note}</div>
                  )
                )}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}