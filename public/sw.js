const CACHE_NAME = "spore-cybernetics-v2";
const APP_SHELL = ["/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await Promise.allSettled(APP_SHELL.map((asset) => cache.add(asset)));
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("spore-cybernetics-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/admin") ||
    url.pathname.startsWith("/portal") ||
    url.pathname.startsWith("/payment") ||
    url.pathname.startsWith("/login") ||
    url.pathname.startsWith("/register")
  ) return;

  const isNavigation = request.mode === "navigate";
  const isStaticAsset =
    url.pathname.startsWith("/_next/static/") ||
    /\.(?:css|js|svg|png|jpg|jpeg|webp|woff2?)$/i.test(url.pathname);
  if (!isNavigation && !isStaticAsset) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const response = await fetch(request);
        if (response.ok && response.type === "basic") {
          await cache.put(request, response.clone());
        }
        return response;
      } catch {
        const cached = await cache.match(request);
        if (cached) return cached;
        if (isNavigation) {
          const home = await cache.match("/");
          if (home) return home;
        }
        return Response.error();
      }
    })()
  );
});
