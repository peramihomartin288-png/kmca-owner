// ============================================
// KMCA OWNER - SERVICE WORKER
// ============================================

const CACHE_NAME = 'kmca-owner-cache-v2';
const urlsToCache = [
    './',
    './index.html',
    './welcome.html',
    './dashboard.html',
    './posts.html',
    './events.html',
    './polls.html',
    './bible-verses.html',
    './watakatifu.html',
    './nyimbo.html',
    './masomo.html',
    './questions.html',
    './users.html',
    './announcements.html',
    './ai-schedules.html',
    './auto-play-video.html',
    './media.html',
    './backup-clean.html',
    './url-management.html',
    './pwa-management.html',
    './owners.html',
    './settings.html',
    './style.css',
    './responsive.css',
    './manifest.json',
    './owner-icon-192.png',
    './owner-icon-512.png'
];

// Install
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            console.log('KMCA Owner - Caching files...');
            return Promise.all(
                urlsToCache.map(function(url) {
                    return cache.add(url).catch(function(err) {
                        console.log('Failed to cache:', url);
                    });
                })
            );
        }).then(function() {
            return self.skipWaiting();
        })
    );
});

// Activate
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(function() {
            return self.clients.claim();
        })
    );
});

// Fetch
self.addEventListener('fetch', function(event) {
    if (event.request.method !== 'GET') return;
    if (event.request.url.includes('supabase.co')) return;
    if (event.request.url.includes('cloudinary.com')) return;
    if (event.request.url.includes('uploadcare.com')) return;
    
    event.respondWith(
        caches.match(event.request).then(function(response) {
            if (response) {
                fetch(event.request).then(function(freshResponse) {
                    if (freshResponse && freshResponse.status === 200) {
                        caches.open(CACHE_NAME).then(function(cache) {
                            cache.put(event.request, freshResponse);
                        });
                    }
                }).catch(function() {});
                
                return response;
            }
            
            return fetch(event.request).then(function(fetchResponse) {
                if (!fetchResponse || fetchResponse.status !== 200) return fetchResponse;
                
                var responseToCache = fetchResponse.clone();
                caches.open(CACHE_NAME).then(function(cache) {
                    cache.put(event.request, responseToCache);
                });
                
                return fetchResponse;
            }).catch(function() {
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            });
        })
    );
});

// Push Notifications
self.addEventListener('push', function(event) {
    let data = { title: 'KMCA Owner', body: 'Taarifa mpya!' };
    
    if (event.data) {
        try { data = Object.assign(data, event.data.json()); } catch (e) {}
    }
    
    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: './owner-icon-192.png',
            badge: './owner-icon-192.png',
            vibrate: [100, 50, 100],
            data: {
                url: data.url || './dashboard.html'
            }
        })
    );
});

// Notification click
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(function(clientList) {
            for (const client of clientList) {
                if ('focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(event.notification.data.url || './dashboard.html');
            }
        })
    );
});

// Message
self.addEventListener('message', function(event) {
    if (event.data === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});