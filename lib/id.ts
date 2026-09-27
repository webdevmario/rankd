/**
 * Collision-resistant id. `crypto.randomUUID` is only exposed in secure
 * contexts, so fall back when the dev server is opened over a LAN IP.
 */
export function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function now(): string {
  return new Date().toISOString();
}
