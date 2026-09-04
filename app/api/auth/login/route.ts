import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  ROLE_COOKIE,
  getUpstreamUrl,
} from "@/lib/auth-constants";
import {
  authSuccessJson,
  isStaffRole,
  localeFromRequest,
  parseUpstreamError,
  staffRoleForbiddenResponse,
} from "@/lib/auth-server";

type LoginBody = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  let body: LoginBody;
  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const email = body.email?.trim();
  const password = body.password;
  if (!email || !password) {
    return NextResponse.json({ error: "missing_credentials" }, { status: 400 });
  }

  const upstream = await fetch(getUpstreamUrl("/v1/auth/login"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept-Language": localeFromRequest(request),
    },
    body: JSON.stringify({ email, password }),
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

  if (!isStaffRole(data.role)) {
    return staffRoleForbiddenResponse();
  }

  try {
    return authSuccessJson(data, email);
  } catch {
    return NextResponse.json({ error: "invalid_token_response" }, { status: 502 });
  }
}

export async function GET() {
  const jar = await cookies();
  return NextResponse.json({
    authenticated: Boolean(jar.get(ACCESS_COOKIE)?.value || jar.get(REFRESH_COOKIE)?.value),
    role: jar.get(ROLE_COOKIE)?.value ?? null,
  });
}
