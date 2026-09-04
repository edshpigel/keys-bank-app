import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  ACCESS_COOKIE,
  ACCESS_MAX_AGE,
  REFRESH_COOKIE,
  REFRESH_MAX_AGE,
  ROLE_COOKIE,
  getUpstreamUrl,
} from "@/lib/auth-constants";

type RouteContext = { params: Promise<{ path: string[] }> };

async function ensureAccessToken(): Promise<string | null> {
  const jar = await cookies();
  const access = jar.get(ACCESS_COOKIE)?.value;
  if (access) return access;

  const refresh = jar.get(REFRESH_COOKIE)?.value;
  if (!refresh) return null;

  const upstream = await fetch(getUpstreamUrl("/v1/auth/refresh"), {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept-Language": "fr" },
    body: JSON.stringify({ refresh_token: refresh }),
  });
  if (!upstream.ok) return null;
  const data = (await upstream.json()) as {
    access_token?: string;
    refresh_token?: string;
    role?: string;
  };
  if (!data.access_token || !data.refresh_token) return null;

  const secure = process.env.NODE_ENV === "production";
  jar.set(ACCESS_COOKIE, data.access_token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_MAX_AGE,
  });
  jar.set(REFRESH_COOKIE, data.refresh_token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_MAX_AGE,
  });
  if (data.role) {
    jar.set(ROLE_COOKIE, data.role, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: REFRESH_MAX_AGE,
    });
  }
  return data.access_token;
}

async function proxy(request: Request, context: RouteContext) {
  const { path } = await context.params;
  const token = await ensureAccessToken();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const target = `${getUpstreamUrl(`/v1/operator/${path.join("/")}`)}${url.search}`;

  const headers = new Headers();
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Accept-Language", request.headers.get("Accept-Language") || "fr");
  const contentType = request.headers.get("Content-Type");
  if (contentType) headers.set("Content-Type", contentType);
  const idempotency = request.headers.get("Idempotency-Key");
  if (idempotency) headers.set("Idempotency-Key", idempotency);

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  const upstream = await fetch(target, init);
  const body = await upstream.arrayBuffer();
  return new NextResponse(body, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") || "application/json",
    },
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
