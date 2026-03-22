const CACHE_NAME = "poker-night-v1";
const STATIC_ASSETS = [
  "/",
  "/offline.html",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

// Install: cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
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
      .then(() => self.clients.claim())
  );
});

// Fetch strategy:
// - API routes and Supabase → network-first, no cache
// - Static assets (icons, fonts) → cache-first
// - HTML pages → stale-while-revalidate
// - Offline fallback for navigation requests
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and non-http(s)
  if (request.method !== "GET") return;
  if (!url.protocol.startsWith("http")) return;

  // API routes and Supabase → network only (no caching)
  if (
    url.pathname.startsWith("/api/") ||
    url.hostname.includes("supabase.co")
  ) {
    event.respondWith(
      fetch(request).catch(() => new Response("", { status: 503 }))
    );
    return;
  }

  // Static assets (icons, _next/static) → cache-first
  if (
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/_next/static/")
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
      )
    );
    return;
  }

  // Navigation requests → network-first with offline fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches
          .match(request)
          .then((cached) => cached || caches.match("/offline.html"))
      )
    );
    return;
  }

  // Default → network-first
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
