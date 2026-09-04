import { NextResponse } from "next/server";

import {
  ACCESS_COOKIE,
  ACCESS_MAX_AGE,
  REFRESH_COOKIE,
  REFRESH_MAX_AGE,
  ROLE_COOKIE,
  STAFF_ROLES,
} from "@/lib/auth-constants";

type TokenPayload = {
  access_token?: string;
  refresh_token?: string;
  role?: string;
  email?: string;
};

export function isStaffRole(role?: string | null): boolean {
  return Boolean(role && STAFF_ROLES.has(role));
}

export function staffRoleForbiddenResponse() {
  return NextResponse.json(
    {
      error: "forbidden_role",
      message: "Доступ только для операторов и администраторов",
    },
    { status: 403 },
  );
}

export function setAuthCookies(response: NextResponse, data: TokenPayload) {
  if (!data.access_token || !data.refresh_token) {
    throw new Error("missing_tokens");
  }
  const secure = process.env.NODE_ENV === "production";
  response.cookies.set(ACCESS_COOKIE, data.access_token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_MAX_AGE,
  });
  response.cookies.set(REFRESH_COOKIE, data.refresh_token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_MAX_AGE,
  });
  if (data.role) {
    response.cookies.set(ROLE_COOKIE, data.role, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: REFRESH_MAX_AGE,
    });
  }
}

export function authSuccessJson(data: TokenPayload, email?: string) {
  const response = NextResponse.json({
    ok: true,
    role: data.role,
    email: email?.toLowerCase() ?? data.email ?? null,
  });
  setAuthCookies(response, data);
  return response;
}

export async function parseUpstreamError(upstream: Response) {
  const data = (await upstream.json().catch(() => ({}))) as {
    error?: { code?: string; message?: string } | string;
    message?: string;
  };
  const nested = data.error;
  if (typeof nested === "string") {
    return { code: nested, message: data.message || nested };
  }
  if (nested && typeof nested === "object") {
    return {
      code: nested.code || "request_failed",
      message: nested.message || data.message || "Request failed",
    };
  }
  return { code: "request_failed", message: data.message || "Request failed" };
}

export function localeFromRequest(request: Request): string {
  return request.headers.get("Accept-Language")?.split(",")[0]?.trim() || "fr";
}
