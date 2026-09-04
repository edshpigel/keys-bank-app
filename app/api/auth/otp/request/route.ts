import { NextResponse } from "next/server";

import { getUpstreamUrl } from "@/lib/auth-constants";
import { localeFromRequest, parseUpstreamError } from "@/lib/auth-server";

type Body = { email?: string };

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const email = body.email?.trim();
  if (!email) {
    return NextResponse.json({ error: "missing_email" }, { status: 400 });
  }

  const upstream = await fetch(getUpstreamUrl("/v1/auth/otp/request"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept-Language": localeFromRequest(request),
    },
    body: JSON.stringify({ email }),
  });

  if (!upstream.ok) {
    const err = await parseUpstreamError(upstream);
    return NextResponse.json(
      { error: err.code, message: err.message },
      { status: upstream.status },
    );
  }

  return NextResponse.json({ ok: true });
}
