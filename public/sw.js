/**
 * StudyOffline Service Worker
 *
 * Strategy:
 *  - On install: cache the main page shells
 *  - On fetch: cache ALL /_next/static/ chunks as they are requested (network-first, then cache)
 *  - API routes (/api/*): network only — IndexedDB handles AI response caching
 *  - Everything else: cache-first with network fallback
 */

const CACHE_NAME = "studyoffline-v2";

// Core app shell to pre-cache on install
const PRECACHE_URLS = [
  "/",
  "/ask",
  "/upload",
  "/history",
  "/manifest.json",
  "/pdf.worker.min.mjs",
];

// ── Install ───────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        // Pre-cache shell pages — ignore failures on individual items
        return Promise.allSettled(
          PRECACHE_URLS.map((url) =>
            cache.add(url).catch((e) => console.warn("[SW] Failed to precache:", url, e))
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

// ── Activate: clean old caches ────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests from our own origin
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // API routes — always network, never cache
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(request));
    return;
  }

  // Next.js static chunks — cache aggressively as they load
  // These have content hashes in filenames so they're safe to cache forever
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirstThenNetwork(request));
    return;
  }

  // Next.js data/image routes — network first, cache as fallback
  if (url.pathname.startsWith("/_next/")) {
    event.respondWith(networkFirstThenCache(request));
    return;
  }

  // All other requests (pages, icons, pdf worker) — cache first
  event.respondWith(cacheFirstThenNetwork(request));
});

// ── Cache-first strategy ──────────────────────────────────────────────────────
async function cacheFirstThenNetwork(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok && response.status < 400) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Offline fallback — serve the cached home page for navigation requests
    if (request.mode === "navigate") {
      const fallback = await caches.match("/");
      if (fallback) return fallback;
    }
    return new Response(
      JSON.stringify({ error: "You are offline and this resource is not cached yet." }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }
}

// ── Network-first strategy ────────────────────────────────────────────────────
async function networkFirstThenCache(request) {
  try {
    const response = await fetch(request);
    if (response.ok && response.status < 400) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response("", { status: 503 });
  }
}
