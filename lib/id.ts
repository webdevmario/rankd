/**
 * RFC 4122 v4 UUID that works outside secure contexts.
 *
 * `crypto.randomUUID` only exists on HTTPS or localhost, so it's undefined when
 * the app is opened over the plain-HTTP tailnet URL. `crypto.getRandomValues`
 * is available everywhere, so build the UUID from that and only fall back to
 * `Math.random` in environments with no Web Crypto at all.
 */
export function createId(): string {
  const webCrypto = typeof crypto !== "undefined" ? crypto : undefined;
  if (typeof webCrypto?.randomUUID === "function") return webCrypto.randomUUID();

  const bytes = new Uint8Array(16);
  if (typeof webCrypto?.getRandomValues === "function") {
    webCrypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC 4122 variant

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function now(): string {
  return new Date().toISOString();
}
