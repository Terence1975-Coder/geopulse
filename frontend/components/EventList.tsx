"use client";

import { EventItem } from "../types";

type Props = {
  events: EventItem[] | null | undefined;
  onAnalyze?: (eventId: string) => void;
};

export default function EventList({ events, onAnalyze }: Props) {
  const safeEvents = Array.isArray(events) ? events : [];

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Event Intelligence</h2>
      </div>

      {safeEvents.length === 0 ? (
        <p className="muted">No events yet.</p>
      ) : (
        safeEvents.map((event) => (
          <div key={event.id} className="event-card">
            <div className="panel-header">
              <div>
                <h3>{event.headline ?? "Untitled event"}</h3>
                <p className="muted">
                  {event.region ?? "Unknown region"} · {event.severity ?? "Unrated"}
                </p>
              </div>

              {onAnalyze && (
                <button
                  className="secondary-btn"
                  onClick={() => onAnalyze(event.id)}
                >
                  Analyze
                </button>
              )}
            </div>

            {event.body && <p>{event.body}</p>}

            {"analysis" in event && event.analysis ? (
              <div className="subpanel">
                <p>{String(event.analysis)}</p>
              </div>
            ) : null}
          </div>
        ))
      )}
    </section>
  );
}