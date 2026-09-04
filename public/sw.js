/* KeysBank operator PWA — cache the app shell so a slow/offline network
   does not show a blank white screen. Live API data is never cached. */

const PRECACHE = "kb-precache-v1";
const RUNTIME = "kb-runtime-v1";
const NAV_TIMEOUT_MS = 3500;

const PRECACHE_URLS = [
  "/offline.html",
  "/logo.png",
  "/icon.svg",
  "/favicon.ico",
  "/favicon.svg",
  "/favicon-96x96.png",
  "/apple-touch-icon.png",
  "/web-app-manifest-192x192.png",
  "/web-app-manifest-512x512.png",
  "/keys-bank-pwa.png",
  "/site.webmanifest",
  "/manifest.webmanifest",
  "/flags/fr.svg",
  "/flags/en.svg",
  "/flags/ru.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PRECACHE).then((cache) =>
      Promise.all(
        PRECACHE_URLS.map((url) => cache.add(url).catch(() => undefined)),
      ),
    ),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== PRECACHE && key !== RUNTIME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname === "/sw.js") return;

  if (isNavigationRequest(request)) {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (isRscRequest(request, url)) return;

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
  }
});

function isNavigationRequest(request) {
  return request.mode === "navigate" || request.destination === "document";
}

function isRscRequest(request, url) {
  return (
    url.searchParams.has("_rsc") ||
    request.headers.get("RSC") === "1" ||
    request.headers.get("Next-Router-State-Tree") != null
  );
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    /\.(?:js|css|png|jpe?g|gif|svg|webp|ico|woff2?|webmanifest)$/i.test(
      url.pathname,
    )
  );
}

function navigationCacheKey(request) {
  const url = new URL(request.url);
  return new Request(url.origin + url.pathname, { method: "GET" });
}

async function networkFirstNavigation(request) {
  const cache = await caches.open(RUNTIME);
  const key = navigationCacheKey(request);

  try {
    const response = await fetchWithTimeout(request, NAV_TIMEOUT_MS);
    if (response.ok) {
      cache.put(key, response.clone());
    }
    if (response.ok || response.type === "opaqueredirect") {
      return response;
    }
    return (await cachedNavigation(cache, key)) || response;
  } catch {
    const fallback = await cachedNavigation(cache, key);
    if (fallback) return fallback;
    return inlineOfflineResponse();
  }
}

async function cachedNavigation(cache, key) {
  return (
    (await cache.match(key)) ||
    (await caches.match("/offline.html")) ||
    (await cache.match("/offline.html"))
  );
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return Response.error();
  }
}

function inlineOfflineResponse() {
  return new Response(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#1a1a1a"><title>KeysBank</title><style>html,body{margin:0;background:#1a1a1a;color:#b69955;font-family:system-ui,sans-serif;height:100%;display:flex;align-items:center;justify-content:center}</style></head><body><p>KeysBank</p></body></html>`,
    {
      status: 503,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    },
  );
}

function fetchWithTimeout(request, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(request, { signal: controller.signal }).finally(() =>
    clearTimeout(timer),
  );
}
