import { NextResponse, type NextRequest } from "next/server";

import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth-constants";
import { getPublicOrigin } from "@/lib/config";

const PUBLIC_PREFIXES = [
  "/login",
  "/api/auth/",
  "/api/client-log",
  "/site.webmanifest",
  "/manifest.webmanifest",
  "/sw.js",
  "/offline.html",
];

function redirectTo(request: NextRequest, pathname: string, search?: string) {
  const url = new URL(pathname, getPublicOrigin(request));
  if (search) url.search = search.startsWith("?") ? search : `?${search}`;
  return NextResponse.redirect(url);
}

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Local debugging only — never enabled in production builds.
  if (
    process.env.NODE_ENV === "development" &&
    request.nextUrl.searchParams.get("kb_dev") === "1"
  ) {
    return NextResponse.next();
  }

  const isPublic = PUBLIC_PREFIXES.some(
    (p) => path === p || path.startsWith(p),
  );

  const hasSession =
    Boolean(request.cookies.get(ACCESS_COOKIE)?.value) ||
    Boolean(request.cookies.get(REFRESH_COOKIE)?.value);

  if (!isPublic && !hasSession) {
    if (path.startsWith("/api/backend/")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const next = encodeURIComponent(path);
    return redirectTo(request, "/login/", `next=${next}`);
  }

  if ((path === "/login" || path === "/login/") && hasSession) {
    return redirectTo(request, "/points/");
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|offline.html|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|html)$).*)",
  ],
};
