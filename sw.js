const CACHE_NAME = 'phryco-cache-v11';
const OFFLINE_URL = '/offline.html';

const STATIC_ASSETS = [
    '/',
    '/offline.html',
    '/css/index.css',
    '/assets/phryco-icon.png',
    '/js/api/client.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // 1. Network Only for API and Video Streams
    if (url.pathname.startsWith('/api/') ||
        url.pathname.includes('/stream') ||
        url.pathname.endsWith('.m3u8') ||
        url.pathname.endsWith('.ts')) {
        return; // Let the browser handle it normally (bypass service worker)
    }

    // 2. Network First for HTML Navigation
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, response.clone());
                        return response;
                    });
                })
                .catch(() => {
                    return caches.match(event.request).then((cachedResponse) => {
                        if (cachedResponse) return cachedResponse;
                        return caches.match(OFFLINE_URL);
                    });
                })
        );
        return;
    }

    // 3. Cache First (Stale-While-Revalidate) for Static Assets (JS, CSS, Images, CDNs)
    const isStaticAsset = url.pathname.endsWith('.css') ||
        url.pathname.endsWith('.js') ||
        url.pathname.endsWith('.png') ||
        url.pathname.endsWith('.jpg') ||
        url.hostname === 'cdn.jsdelivr.net';

    if (isStaticAsset) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                const fetchPromise = fetch(event.request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                    return networkResponse;
                }).catch(() => {
                    // Ignore fetch errors for static assets if we already have cache
                });

                return cachedResponse || fetchPromise;
            })
        );
        return;
    }
});
