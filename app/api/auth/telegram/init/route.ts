import { NextResponse } from "next/server";

import { getUpstreamUrl } from "@/lib/auth-constants";
import {
  authSuccessJson,
  localeFromRequest,
  parseUpstreamError,
} from "@/lib/auth-server";

type Body = { init_data?: string };

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const init_data = body.init_data?.trim();
  if (!init_data) {
    return NextResponse.json({ error: "missing_init_data" }, { status: 400 });
  }

  const upstream = await fetch(getUpstreamUrl("/v1/operator/telegram/init"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept-Language": localeFromRequest(request),
    },
    body: JSON.stringify({ init_data }),
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
    needs_bind?: boolean;
    telegram_user_id?: string;
    message?: string;
  };

  if (data.needs_bind) {
    return NextResponse.json({
      needs_bind: true,
      telegram_user_id: data.telegram_user_id,
      message: data.message,
    });
  }

  try {
    return authSuccessJson(data);
  } catch {
    return NextResponse.json({ error: "invalid_token_response" }, { status: 502 });
  }
}
