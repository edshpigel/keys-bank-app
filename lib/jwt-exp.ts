/** Decode JWT payload without verifying signature (TTL check only). */
export function jwtExpSeconds(token: string): number | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const json =
      typeof atob === "function"
        ? atob(padded)
        : Buffer.from(padded, "base64").toString("utf8");
    const payload = JSON.parse(json) as { exp?: unknown };
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

/** True if access JWT is missing exp or expires within `skewSeconds`. */
export function isAccessExpired(token: string, skewSeconds = 30): boolean {
  const exp = jwtExpSeconds(token);
  if (exp == null) return true;
  return exp <= Math.floor(Date.now() / 1000) + skewSeconds;
}
