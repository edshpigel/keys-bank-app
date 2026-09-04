import { getBffBase } from "@/lib/config";

export type ClientLogKind =
  | "error"
  | "unhandledrejection"
  | "react-boundary";

export type ClientLogPayload = {
  kind: ClientLogKind;
  message: string;
  stack?: string;
  componentStack?: string;
  digest?: string;
  url?: string;
};

const DEDUP_MS = 5_000;
const MAX_MESSAGE = 2_000;
const MAX_STACK = 8_000;

const recent = new Map<string, number>();

function truncate(value: string | undefined, max: number): string | undefined {
  if (!value) return undefined;
  return value.length <= max ? value : `${value.slice(0, max)}…`;
}

function fingerprint(payload: ClientLogPayload): string {
  return [
    payload.kind,
    payload.message,
    payload.stack?.slice(0, 120) ?? "",
    payload.digest ?? "",
  ].join("|");
}

function clientLogUrl(): string {
  const base = getBffBase().replace(/\/$/, "");
  return `${base}/client-log/`;
}

/** Fire-and-forget report to BFF → Docker stderr → Loki. */
export function reportClientError(payload: ClientLogPayload): void {
  if (typeof window === "undefined") return;

  const message = truncate(payload.message, MAX_MESSAGE);
  if (!message) return;

  const normalized: ClientLogPayload = {
    ...payload,
    message,
    stack: truncate(payload.stack, MAX_STACK),
    componentStack: truncate(payload.componentStack, MAX_STACK),
    url: payload.url ?? window.location.href,
  };

  const key = fingerprint(normalized);
  const now = Date.now();
  const last = recent.get(key);
  if (last != null && now - last < DEDUP_MS) return;
  recent.set(key, now);

  const body = JSON.stringify({
    ...normalized,
    userAgent: navigator.userAgent,
    ts: new Date().toISOString(),
  });

  const url = clientLogUrl();
  if (navigator.sendBeacon?.(url, new Blob([body], { type: "application/json" }))) {
    return;
  }

  void fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
    credentials: "same-origin",
  }).catch(() => undefined);
}
