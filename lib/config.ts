/** Upstream FastAPI base (no trailing slash). */
export function getUpstreamApiBase(): string {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
    "http://localhost:8000"
  );
}

/** Same-origin BFF prefix for browser requests. */
export function getBffBase(): string {
  const raw = process.env.NEXT_PUBLIC_BFF_BASE_URL?.trim() || "/api";
  return raw.replace(/\/$/, "") || "/api";
}

export function getUpstreamUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getUpstreamApiBase()}${normalized}`;
}

export function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3020"
  );
}

/**
 * Public origin for redirects. Containers listen on HOSTNAME=0.0.0.0, so
 * `new URL(..., request.url)` can produce Location: http://0.0.0.0/… —
 * prefer forwarded host, then fall back to NEXT_PUBLIC_APP_URL.
 */
export function getPublicOrigin(request: Request): string {
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const hostHeader = request.headers.get("host")?.split(",")[0]?.trim();
  const host = forwardedHost || hostHeader || "";
  const bad =
    !host ||
    host.startsWith("0.0.0.0") ||
    host.startsWith("127.0.0.1") ||
    host.startsWith("[::]");
  if (!bad) {
    const proto =
      request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
      (process.env.NODE_ENV === "production" ? "https" : "http");
    return `${proto}://${host}`;
  }
  return getAppUrl();
}
