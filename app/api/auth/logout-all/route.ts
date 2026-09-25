import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  ROLE_COOKIE,
  getUpstreamUrl,
} from "@/lib/auth-constants";
import { localeFromRequest, parseUpstreamError } from "@/lib/auth-server";

function clearAuthCookies(response: NextResponse) {
  const secure = process.env.NODE_ENV === "production";
  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE, ROLE_COOKIE]) {
    response.cookies.set(name, "", {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }
}

/** Revoke every refresh session for the current user, then clear cookies. */
export async function POST(request: Request) {
  const jar = await cookies();
  const access = jar.get(ACCESS_COOKIE)?.value;
  if (!access) {
    const response = NextResponse.json({ ok: true, cleared: 0 });
    clearAuthCookies(response);
    return response;
  }

  const upstream = await fetch(getUpstreamUrl("/v1/auth/logout-all"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access}`,
      "Accept-Language": localeFromRequest(request),
    },
  });

  if (!upstream.ok) {
    const err = await parseUpstreamError(upstream);
    return NextResponse.json(
      { error: err.code, message: err.message },
      { status: upstream.status },
    );
  }

  const data = (await upstream.json().catch(() => ({}))) as {
    ok?: boolean;
    cleared?: number;
  };
  const response = NextResponse.json({
    ok: true,
    cleared: data.cleared ?? 0,
  });
  clearAuthCookies(response);
  return response;
}
