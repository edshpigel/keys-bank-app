import { NextResponse } from "next/server";

import { logClientError, parseClientLogBody } from "@/lib/client-log-server";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const entry = parseClientLogBody(body);
  if (!entry) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip");

  logClientError(entry, { clientIp });

  return NextResponse.json({ ok: true });
}
