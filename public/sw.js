const PREFIX = 'writers-workshop:';
const CACHE = PREFIX + 'offline-v2';
const FILES = ['/offline.html', '/offline.css', '/offline.js', '/draft-storage.js', '/app-icons/icon-192.png', '/app-icons/icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) if (name.startsWith(PREFIX) && name !== CACHE) await caches.delete(name);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || event.request.method !== 'GET' || url.pathname.startsWith('/api/')) return;
  if (FILES.includes(url.pathname)) {
    event.respondWith(caches.open(CACHE).then(async cache => await cache.match(url.pathname) || fetch(event.request)));
  } else if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(async () => (await caches.open(CACHE)).match('/offline.html')));
  }
});
