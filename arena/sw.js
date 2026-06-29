// 暗码矩阵 Service Worker v7 — 网络优先策略
const CACHE_NAME = 'arena-v7-20260629';
const ASSETS = [
  '/mohongyin-showcase/arena/',
  '/mohongyin-showcase/arena/index.html',
  '/mohongyin-showcase/arena/manifest.json'
];

self.addEventListener('install', e => {
  // 不预缓存，直接激活
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(k => caches.delete(k))
    )).then(() => {
      self.clients.matchAll({type:'window'}).then(clients => {
        clients.forEach(client => {
          client.postMessage({type:'NEW_VERSION',version:'v7'});
        });
      });
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});

self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
