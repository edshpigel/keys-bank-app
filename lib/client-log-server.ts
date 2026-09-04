import type { ClientLogKind } from "@/lib/client-log";

const ALLOWED_KINDS = new Set<ClientLogKind>([
  "error",
  "unhandledrejection",
  "react-boundary",
]);

const MAX_MESSAGE = 2_000;
const MAX_STACK = 8_000;
const MAX_URL = 500;
const MAX_UA = 300;

function clip(value: unknown, max: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max)}…`;
}

export type ParsedClientLog = {
  kind: ClientLogKind;
  message: string;
  stack?: string;
  componentStack?: string;
  digest?: string;
  url?: string;
  userAgent?: string;
  ts?: string;
};

export function parseClientLogBody(body: unknown): ParsedClientLog | null {
  if (!body || typeof body !== "object") return null;
  const raw = body as Record<string, unknown>;

  const kind = raw.kind;
  if (typeof kind !== "string" || !ALLOWED_KINDS.has(kind as ClientLogKind)) {
    return null;
  }

  const message = clip(raw.message, MAX_MESSAGE);
  if (!message) return null;

  return {
    kind: kind as ClientLogKind,
    message,
    stack: clip(raw.stack, MAX_STACK),
    componentStack: clip(raw.componentStack, MAX_STACK),
    digest: clip(raw.digest, 120),
    url: clip(raw.url, MAX_URL),
    userAgent: clip(raw.userAgent, MAX_UA),
    ts: clip(raw.ts, 40),
  };
}

/** Structured line for Promtail/Loki (`|= "client_error"`). */
export function logClientError(
  entry: ParsedClientLog,
  meta?: { clientIp?: string | null },
): void {
  console.error(
    JSON.stringify({
      level: "error",
      source: "client_error",
      service: "app",
      kind: entry.kind,
      message: entry.message,
      stack: entry.stack,
      componentStack: entry.componentStack,
      digest: entry.digest,
      url: entry.url,
      userAgent: entry.userAgent,
      clientIp: meta?.clientIp ?? undefined,
      ts: entry.ts ?? new Date().toISOString(),
    }),
  );
}
