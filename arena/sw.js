// 暗码矩阵 Service Worker v6 — 网络优先策略
const CACHE_NAME = 'arena-v6-20260629';
const ASSETS = [
  '/mohongyin-showcase/arena/',
  '/mohongyin-showcase/arena/index.html',
  '/mohongyin-showcase/arena/manifest.json'
];

// 安装：预缓存核心资源
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

// 激活：清理旧缓存 + 通知所有客户端刷新
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    )).then(() => {
      // 通知所有打开的页面有新版本
      self.clients.matchAll({type:'window'}).then(clients => {
        clients.forEach(client => {
          client.postMessage({type:'NEW_VERSION',version:'v6'});
        });
      });
    })
  );
  self.clients.claim();
});

// 请求：HTML走网络优先，其他走缓存优先
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  
  const url = new URL(e.request.url);
  const isHTML = e.request.headers.get('accept')?.includes('text/html') 
              || url.pathname.endsWith('/') 
              || url.pathname.endsWith('.html');
  
  if (isHTML) {
    // 网络优先：先尝试网络，失败才用缓存
    e.respondWith(
      fetch(e.request).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return response;
      }).catch(() => {
        return caches.match(e.request);
      })
    );
  } else {
    // 静态资源：缓存优先
    e.respondWith(
      caches.match(e.request).then(cached => {
        const fetchPromise = fetch(e.request).then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          }
          return response;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
  }
});
