import { NextResponse } from "next/server";

import { getUpstreamUrl } from "@/lib/auth-constants";
import {
  authSuccessJson,
  localeFromRequest,
  parseUpstreamError,
} from "@/lib/auth-server";

type Body = {
  telegram_user_id?: string;
  email?: string;
  code?: string;
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const telegram_user_id = body.telegram_user_id?.trim();
  const email = body.email?.trim();
  const code = body.code?.trim();
  if (!telegram_user_id || !email || !code) {
    return NextResponse.json({ error: "missing_credentials" }, { status: 400 });
  }

  const upstream = await fetch(getUpstreamUrl("/v1/operator/telegram/bind"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept-Language": localeFromRequest(request),
    },
    body: JSON.stringify({ telegram_user_id, email, code }),
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

  try {
    return authSuccessJson(data, email);
  } catch {
    return NextResponse.json({ error: "invalid_token_response" }, { status: 502 });
  }
}
