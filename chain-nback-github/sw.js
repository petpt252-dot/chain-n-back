// Offline cache: the game works without internet once it has been opened.
// Bump VERSION whenever any file changes so phones pick up the new files.
const VERSION = 'chain-nback-v30';
const FILES = [
  './', 'index.html', 'chain.js?v=26', 'style.css?v=14', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'art/crypt.jpg',
  'vendor/fonts/cormorant-garamond-latin-500-normal.woff2', 'vendor/fonts/cormorant-garamond-latin-600-normal.woff2', 'vendor/fonts/cormorant-garamond-latin-700-normal.woff2',
  'vendor/fonts/source-sans-3-latin-400-normal.woff2', 'vendor/fonts/source-sans-3-latin-600-normal.woff2', 'vendor/fonts/source-sans-3-latin-700-normal.woff2',
  'vendor/fonts/source-serif-4-latin-400-normal.woff2', 'vendor/fonts/source-serif-4-latin-600-normal.woff2'
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// pages: network first (so updates arrive), falling back to the cache when offline; other files: cache first
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).then((r) => { const copy = r.clone(); caches.open(VERSION).then((c) => c.put('./', copy)); return r; }).catch(() => caches.match('./')));
    return;
  }
  // a música (11 MB) vem sempre da rede, aos pedaços: não vai para o cache
  if (new URL(e.request.url).pathname.endsWith('.mp3')) return;
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((r) => { if (r.status === 200 && new URL(e.request.url).origin === location.origin) { const copy = r.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); } return r; })));
});
