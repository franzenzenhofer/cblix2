const CACHE_NAME = 'colorblocks-cache-v1';
const OFFLINE_URL = 'index.html';

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll([
      './',
      './index.html',
      './s.css',
      './preview.png',
      './favicon.ico',
      './manifest.json'
    ]);
  })());
});

self.addEventListener('fetch', (event) => {
  event.respondWith((async () => {
    try {
      // Online first: Try network
      const networkResponse = await fetch(event.request);
      // If successful, update cache
      const cache = await caches.open(CACHE_NAME);
      cache.put(event.request, networkResponse.clone());
      return networkResponse;
    } catch (error) {
      // Offline fallback: try cache
      const cachedResponse = await caches.match(event.request);
      if (cachedResponse) {
        return cachedResponse;
      }
      // If offline and it's a navigation request, return offline page
      if (event.request.mode === 'navigate') {
        return caches.match(OFFLINE_URL);
      }
      return new Response('Offline content not available');
    }
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cacheKeys = await caches.keys();
    await Promise.all(
      cacheKeys.map(key => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      })
    );
  })());
});
