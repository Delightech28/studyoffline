/**
 * StudyOffline Service Worker
 *
 * Strategy:
 *  - App shell (pages, JS, CSS, fonts): Cache-first with network fallback
 *  - API routes (/api/*): Network-first, no caching (handled by IndexedDB instead)
 *  - Static assets (images, icons): Cache-first, long-lived
 *  - Navigation requests: Serve cached shell, let Next.js hydrate
 */

const CACHE_NAME = "studyoffline-v1";

// Assets to pre-cache on install (app shell)
const PRECACHE_URLS = [
  "/",
  "/ask",
  "/upload",
  "/history",
  "/manifest.json",
  "/pdf.worker.min.mjs",
];

// ── Install: pre-cache the app shell ─────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()) // Activate immediately
  );
});

// ── Activate: clean up old caches ─────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim()) // Take control of all open tabs
  );
});

// ── Fetch: routing strategy ───────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and cross-origin requests
  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  // API routes — network only, no caching (responses go to IndexedDB via the app)
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(request));
    return;
  }

  // Next.js internal routes — network only
  if (url.pathname.startsWith("/_next/")) {
    event.respondWith(networkFirstThenCache(request));
    return;
  }

  // Everything else — cache first, network fallback
  event.respondWith(cacheFirstThenNetwork(request));
});

// ── Strategies ────────────────────────────────────────────────────────────────

/**
 * Cache-first: serve from cache if available, otherwise fetch and cache.
 * Best for app shell pages and static assets.
 */
async function cacheFirstThenNetwork(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // If both cache and network fail, return the offline fallback page
    const fallback = await caches.match("/");
    return fallback || new Response("Offline — please visit the app once while online to enable offline access.", {
      status: 503,
      headers: { "Content-Type": "text/plain" },
    });
  }
}

/**
 * Network-first: try network, fall back to cache.
 * Best for Next.js JS chunks that update frequently.
 */
async function networkFirstThenCache(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response("", { status: 503 });
  }
}
