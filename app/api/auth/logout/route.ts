import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  ROLE_COOKIE,
  getUpstreamUrl,
} from "@/lib/auth-constants";

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

async function revokeRefreshToken() {
  const jar = await cookies();
  const refresh = jar.get(REFRESH_COOKIE)?.value;
  if (!refresh) return;
  await fetch(getUpstreamUrl("/v1/auth/logout"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refresh }),
  }).catch(() => undefined);
}

export async function POST() {
  await revokeRefreshToken();
  const response = NextResponse.json({ ok: true });
  clearAuthCookies(response);
  return response;
}

/** Full-page logout: clear cookies then land on /login/. */
export async function GET(request: Request) {
  await revokeRefreshToken();
  const loginUrl = new URL("/login/", request.url);
  const response = NextResponse.redirect(loginUrl);
  clearAuthCookies(response);
  return response;
}
