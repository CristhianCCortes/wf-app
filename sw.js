self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Por ahora: cache básico de archivos de la app (no de los JSON aún)
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Solo cacheamos recursos del propio wf-app
  if (url.origin === location.origin) {
    event.respondWith((async () => {
      const cache = await caches.open("wf-app-cache-v2");
      const cached = await cache.match(event.request);
      if (cached) return cached;
      const fresh = await fetch(event.request);
      cache.put(event.request, fresh.clone());
      return fresh;
    })());
  }
});
