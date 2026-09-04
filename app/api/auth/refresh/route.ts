import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { REFRESH_COOKIE, getUpstreamUrl } from "@/lib/auth-constants";
import { localeFromRequest, parseUpstreamError, setAuthCookies } from "@/lib/auth-server";

export async function POST(request: Request) {
  const jar = await cookies();
  const refresh = jar.get(REFRESH_COOKIE)?.value;
  if (!refresh) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const upstream = await fetch(getUpstreamUrl("/v1/auth/refresh"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept-Language": localeFromRequest(request),
    },
    body: JSON.stringify({ refresh_token: refresh }),
  });

  if (!upstream.ok) {
    const err = await parseUpstreamError(upstream);
    return NextResponse.json(
      { error: err.code, message: err.message },
      { status: upstream.status },
    );
  }

  const data = (await upstream.json()) as {
    access_token?: string;
    refresh_token?: string;
    role?: string;
  };

  if (!data.access_token || !data.refresh_token) {
    return NextResponse.json({ error: "invalid_token_response" }, { status: 502 });
  }

  const response = NextResponse.json({ ok: true });
  setAuthCookies(response, data);
  return response;
}
