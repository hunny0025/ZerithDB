const APP_SHELL_CACHE = "zerithdb-app-shell-v2";
const RUNTIME_CACHE = "zerithdb-runtime-v2";
const RUNTIME_CACHE_LIMIT = 40;

const REQUIRED_APP_SHELL_URLS = [
  "/",
  "/offline.html",
];

const OPTIONAL_APP_SHELL_URLS = [
  "/docs",
  "/playground",
  "/blog",
  "/logo.svg",
  "/favicon.ico",
  "/manifest.webmanifest",
];

const CACHED_NAVIGATION_PATHS = new Set(["/", "/docs", "/playground", "/blog"]);

const STATIC_ASSET_PATTERN = /^\/(?:_next\/static|.*\.(?:css|js|mjs|png|jpg|jpeg|svg|webp|ico|woff2?))$/i;

const FALLBACK_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>ZerithDB Offline</title>
  </head>
  <body>
    <main>
      <h1>You're offline</h1>
      <p>ZerithDB could not load this page. Reconnect and try again.</p>
    </main>
  </body>
</html>`;

async function cacheAppShell() {
  const cache = await caches.open(APP_SHELL_CACHE);

  await cache.addAll(
    REQUIRED_APP_SHELL_URLS.map((url) => new Request(url, { cache: "reload" })),
  );

  await Promise.allSettled(
    OPTIONAL_APP_SHELL_URLS.map((url) => cache.add(new Request(url, { cache: "reload" }))),
  );
}

async function deleteOldCaches() {
  const cacheNames = await caches.keys();
  const expectedCaches = new Set([APP_SHELL_CACHE, RUNTIME_CACHE]);

  await Promise.all(
    cacheNames
      .filter((cacheName) => !expectedCaches.has(cacheName))
      .map((cacheName) => caches.delete(cacheName)),
  );
}

function canHandleRequest(request) {
  const url = new URL(request.url);

  return (
    request.method === "GET" &&
    (url.protocol === "http:" || url.protocol === "https:") &&
    url.origin === self.location.origin &&
    !url.pathname.startsWith("/api/")
  );
}

function isCacheableNavigation(request, response) {
  const url = new URL(request.url);
  const cacheControl = response.headers.get("cache-control") || "";

  return (
    response.ok &&
    CACHED_NAVIGATION_PATHS.has(url.pathname) &&
    !url.search &&
    !cacheControl.toLowerCase().includes("no-store")
  );
}

async function trimRuntimeCache(cache) {
  const requests = await cache.keys();
  const overflow = requests.length - RUNTIME_CACHE_LIMIT;

  if (overflow <= 0) {
    return;
  }

  await Promise.all(requests.slice(0, overflow).map((request) => cache.delete(request)));
}

async function putRuntimeResponse(cache, request, response) {
  await cache.put(request, response.clone());
  await trimRuntimeCache(cache);
}

function fallbackResponse() {
  return new Response(FALLBACK_HTML, {
    status: 503,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);

  try {
    const response = await fetch(request);

    if (isCacheableNavigation(request, response)) {
      await putRuntimeResponse(cache, request, response);
    }

    return response;
  } catch {
    return (
      (await cache.match(request)) ||
      (await caches.match("/offline.html")) ||
      (await caches.match("/")) ||
      fallbackResponse()
    );
  }
}

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  const response = await fetch(request);

  if (response.ok) {
    const cache = await caches.open(RUNTIME_CACHE);
    await putRuntimeResponse(cache, request, response);
  }

  return response;
}

self.addEventListener("install", (event) => {
  event.waitUntil(cacheAppShell());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(deleteOldCaches());
});

self.addEventListener("fetch", (event) => {
  if (!canHandleRequest(event.request)) {
    return;
  }

  const url = new URL(event.request.url);

  if (event.request.mode === "navigate") {
    event.respondWith(networkFirst(event.request));
    return;
  }

  if (STATIC_ASSET_PATTERN.test(url.pathname)) {
    event.respondWith(cacheFirst(event.request));
  }
});
