const CACHE_NAME = 'antam-ai-v2';
const ASSETS = [
  './',
  './index.html',
  './mat-than.html',
  './khien.html',
  './tro-ly.html',
  './manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});