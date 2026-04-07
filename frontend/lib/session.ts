export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "server-session";

  const existing = window.localStorage.getItem("geopulse_session_id");
  if (existing) return existing;

  const newId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `session-${Date.now()}`;

  window.localStorage.setItem("geopulse_session_id", newId);
  return newId;
}