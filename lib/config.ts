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
