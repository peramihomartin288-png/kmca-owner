// ═══════════════════════════════════════════════════════════════
// KMCA OWNER — SERVICE WORKER
// Version: 5.0
// Cache + Push Notifications + Chat + Background Sync
// ═══════════════════════════════════════════════════════════════

const CACHE_VERSION = 'v5.0';
const CACHE_NAME = `kmca-owner-cache-${CACHE_VERSION}`;
const RUNTIME_CACHE = `kmca-owner-runtime-${CACHE_VERSION}`;
const IMAGE_CACHE = `kmca-owner-images-${CACHE_VERSION}`;

// ═══════════════════════════════════════════════════════════════
// FILES TO CACHE
// ═══════════════════════════════════════════════════════════════

const urlsToCache = [
    './',
    './index.html',
    './welcome.html',
    './dashboard.html',
    './manifest.json',
    './hosting-config.js',
    './auth.js',
    './service-worker-register.js',
    './owner-nav.js',
    './upload-manager.js',
    './chat-voice.js',
    './chat-webrtc.js',
    './chat-notifications.js',
    './owner-icon-192.png',
    './owner-icon-512.png',
    './favicon.ico'
];

// ═══════════════════════════════════════════════════════════════
// INSTALL
// ═══════════════════════════════════════════════════════════════

self.addEventListener('install', event => {
    console.log('🔧 SW: Installing v' + CACHE_VERSION);
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 SW: Caching essential files...');
                return Promise.all(
                    urlsToCache.map(url =>
                        cache.add(url).catch(err => {
                            console.warn('⚠️ SW: Failed to cache:', url, err.message);
                        })
                    )
                );
            })
            .then(() => {
                console.log('✅ SW: Installed');
                return self.skipWaiting();
            })
    );
});

// ═══════════════════════════════════════════════════════════════
// ACTIVATE
// ═══════════════════════════════════════════════════════════════

self.addEventListener('activate', event => {
    console.log('🚀 SW: Activating v' + CACHE_VERSION);
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (
                            cacheName !== CACHE_NAME &&
                            cacheName !== RUNTIME_CACHE &&
                            cacheName !== IMAGE_CACHE
                        ) {
                            console.log('🗑️ SW: Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('✅ SW: Activated');
                return self.clients.claim();
            })
    );
});

// ═══════════════════════════════════════════════════════════════
// FETCH
// ═══════════════════════════════════════════════════════════════

self.addEventListener('fetch', event => {
    const request = event.request;
    
    // Skip non-GET
    if (request.method !== 'GET') return;
    
    // Skip external APIs
    if (request.url.includes('supabase.co') && !request.url.includes('storage')) return;
    if (request.url.includes('cloudinary.com')) return;
    if (request.url.includes('ucarecdn.com')) return;
    if (request.url.includes('cdn.jsdelivr.net')) return;
    if (request.url.includes('cdnjs.cloudflare.com')) return;
    if (request.url.includes('fonts.googleapis.com')) return;
    if (request.url.includes('fonts.gstatic.com')) return;
    
    // Skip non-http
    if (!request.url.startsWith('http')) return;
    
    // Handle different file types
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Images → cache first
    if (path.match(/\.(png|jpg|jpeg|gif|webp|svg|ico)$/)) {
        event.respondWith(cacheFirst(request, IMAGE_CACHE));
        return;
    }
    
    // HTML/JS/CSS → network first
    if (path.match(/\.(html|js|css|json)$/) || path === '/') {
        event.respondWith(networkFirst(request, CACHE_NAME));
        return;
    }
    
    // Everything else → stale-while-revalidate
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
});

// ═══════════════════════════════════════════════════════════════
// CACHE STRATEGIES
// ═══════════════════════════════════════════════════════════════

// Network first — kwa HTML, JS, CSS (fresh content)
async function networkFirst(request, cacheName) {
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Offline fallback kwa navigation
        if (request.mode === 'navigate') {
            const fallback = await caches.match('./index.html');
            if (fallback) return fallback;
        }
        
        return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain' })
        });
    }
}

// Cache first — kwa images
async function cacheFirst(request, cacheName) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
        // Refresh kwa background
        fetch(request).then(response => {
            if (response && response.status === 200) {
                caches.open(cacheName).then(cache => cache.put(request, response));
            }
        }).catch(() => {});
        
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        // Return placeholder
        return new Response('', { status: 404 });
    }
}

// Stale while revalidate
async function staleWhileRevalidate(request, cacheName) {
    const cachedResponse = await caches.match(request);
    
    const fetchPromise = fetch(request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
            caches.open(cacheName).then(cache => cache.put(request, networkResponse.clone()));
        }
        return networkResponse;
    }).catch(() => cachedResponse);
    
    return cachedResponse || fetchPromise;
}

// ═══════════════════════════════════════════════════════════════
// PUSH NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════

self.addEventListener('push', event => {
    console.log('🔔 SW: Push received');
    
    let data = {
        title: 'KMCA Owner',
        body: 'Taarifa mpya!',
        icon: './owner-icon-192.png',
        badge: './owner-icon-192.png',
        url: './dashboard.html',
        tag: 'kmca-general',
        type: 'general',
        vibrate: [200, 100, 200],
        requireInteraction: false,
        actions: []
    };
    
    // Parse data
    if (event.data) {
        try {
            const parsed = event.data.json();
            data = { ...data, ...parsed };
        } catch (e) {
            data.body = event.data.text();
        }
    }
    
    // Handle different notification types
    let notificationOptions = {
        body: data.body,
        icon: data.icon || './owner-icon-192.png',
        badge: data.badge || './owner-icon-192.png',
        vibrate: data.vibrate || [100, 50, 100],
        tag: data.tag || `kmca-${Date.now()}`,
        renotify: true,
        data: {
            url: data.url,
            type: data.type,
            callId: data.callId,
            chatId: data.chatId,
            timestamp: Date.now()
        }
    };
    
    // Different settings kwa kila aina
    switch (data.type) {
        case 'chat':
        case 'message':
            notificationOptions.actions = [
                { action: 'open', title: '💬 Fungua' },
                { action: 'close', title: 'Funga' }
            ];
            break;
        
        case 'mention':
            notificationOptions.actions = [
                { action: 'open', title: '📣 Jibu' },
                { action: 'close', title: 'Funga' }
            ];
            notificationOptions.vibrate = [100, 50, 100, 50, 100];
            notificationOptions.requireInteraction = true;
            break;
        
        case 'call':
            notificationOptions.actions = [
                { action: 'accept', title: '✅ Pokea' },
                { action: 'decline', title: '❌ Kataa' }
            ];
            notificationOptions.vibrate = [500, 200, 500, 200, 500];
            notificationOptions.requireInteraction = true;
            notificationOptions.tag = data.tag || `call-${data.callId || Date.now()}`;
            break;
        
        case 'pwa_update':
            notificationOptions.actions = [
                { action: 'update', title: '🔄 Update' },
                { action: 'close', title: 'Baadaye' }
            ];
            break;
        
        default:
            notificationOptions.actions = [
                { action: 'open', title: 'Fungua' },
                { action: 'close', title: 'Funga' }
            ];
    }
    
    // Show notification
    event.waitUntil(
        self.registration.showNotification(data.title, notificationOptions)
    );
});

// ═══════════════════════════════════════════════════════════════
// NOTIFICATION CLICK
// ═══════════════════════════════════════════════════════════════

self.addEventListener('notificationclick', event => {
    console.log('👆 SW: Notification clicked:', event.action);
    
    event.notification.close();
    
    const data = event.notification.data || {};
    const action = event.action;
    
    // Handle actions
    if (action === 'close') {
        return;
    }
    
    if (action === 'decline') {
        // Notify app kama ipo
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
                for (const client of clientList) {
                    client.postMessage({
                        type: 'call_declined',
                        callId: data.callId
                    });
                }
            })
        );
        return;
    }
    
    if (action === 'accept') {
        // Fungua app kwa call
        const callUrl = data.url || `chat-view.html?chat=${data.chatId}&call=${data.callId}`;
        event.waitUntil(openOrFocusApp(callUrl));
        return;
    }
    
    if (action === 'update') {
        // Skip waiting na refresh
        self.skipWaiting();
        event.waitUntil(
            clients.matchAll({ type: 'window' }).then(clientList => {
                for (const client of clientList) {
                    client.navigate(client.url);
                }
            })
        );
        return;
    }
    
    // Default: fungua URL
    const urlToOpen = data.url || './dashboard.html';
    event.waitUntil(openOrFocusApp(urlToOpen));
});

// ═══════════════════════════════════════════════════════════════
// OPEN OR FOCUS APP
// ═══════════════════════════════════════════════════════════════

async function openOrFocusApp(urlToOpen) {
    try {
        const clientList = await clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        });
        
        // Focus existing window
        for (const client of clientList) {
            if (client.url.includes(self.location.origin) && 'focus' in client) {
                await client.focus();
                
                // Navigate kama URL ni tofauti
                if ('navigate' in client && !client.url.includes(urlToOpen)) {
                    try {
                        await client.navigate(urlToOpen);
                    } catch (e) {
                        console.warn('Navigate error:', e);
                    }
                }
                
                return;
            }
        }
        
        // Open new window
        if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
        }
    } catch (error) {
        console.error('Open/focus error:', error);
    }
}

// ═══════════════════════════════════════════════════════════════
// NOTIFICATION CLOSE
// ═══════════════════════════════════════════════════════════════

self.addEventListener('notificationclose', event => {
    console.log('🔕 SW: Notification closed');
    
    const data = event.notification.data || {};
    
    // Notify app kama ipo
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
        for (const client of clientList) {
            client.postMessage({
                type: 'notification_closed',
                notificationType: data.type,
                callId: data.callId
            });
        }
    });
});

// ═══════════════════════════════════════════════════════════════
// PUSH SUBSCRIPTION CHANGE
// ═══════════════════════════════════════════════════════════════

self.addEventListener('pushsubscriptionchange', event => {
    console.log('🔄 SW: Push subscription changed');
    
    event.waitUntil(
        (async () => {
            try {
                // Re-subscribe kwa VAPID key
                const VAPID_KEY = 'BKNmfI7QOo1GE2kXwHIUHPTEMoKFNF2FjKWE5-9Wes7YYgmuEF8eYmzp4YscPtyVbg0So4j3wpeMvBsQm1hyVrw';
                
                const newSubscription = await self.registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(VAPID_KEY)
                });
                
                // Notify app kwa new subscription
                const clientList = await clients.matchAll({ type: 'window', includeUncontrolled: true });
                for (const client of clientList) {
                    client.postMessage({
                        type: 'push_subscription_changed',
                        subscription: newSubscription.toJSON()
                    });
                }
            } catch (error) {
                console.error('Push resubscribe error:', error);
            }
        })()
    );
});

// ═══════════════════════════════════════════════════════════════
// MESSAGE HANDLING
// ═══════════════════════════════════════════════════════════════

self.addEventListener('message', event => {
    const data = event.data;
    if (!data) return;
    
    console.log('📨 SW: Message received:', data.type);
    
    // Skip waiting (for updates)
    if (data.type === 'SKIP_WAITING') {
        self.skipWaiting();
        return;
    }
    
    // Clear cache
    if (data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys()
                .then(cacheNames => Promise.all(
                    cacheNames.map(name => caches.delete(name))
                ))
                .then(() => {
                    if (event.source) {
                        event.source.postMessage({ type: 'CACHE_CLEARED' });
                    }
                })
        );
        return;
    }
    
    // Force refresh
    if (data.type === 'FORCE_REFRESH') {
        event.waitUntil(
            self.clients.matchAll()
                .then(clients => clients.forEach(client => client.navigate(client.url)))
        );
        return;
    }
    
    // Show notification manually
    if (data.type === 'SHOW_NOTIFICATION') {
        event.waitUntil(
            self.registration.showNotification(data.title || 'KMCA Owner', {
                body: data.body || '',
                icon: data.icon || './owner-icon-192.png',
                badge: './owner-icon-96.png',
                tag: data.tag,
                data: data.data || {},
                vibrate: data.vibrate || [100, 50, 100],
                actions: data.actions || [
                    { action: 'open', title: 'Fungua' },
                    { action: 'close', title: 'Funga' }
                ]
            })
        );
        return;
    }
    
    // Close notifications
    if (data.type === 'CLOSE_NOTIFICATIONS') {
        event.waitUntil(
            self.registration.getNotifications({ tag: data.tag })
                .then(notifications => {
                    notifications.forEach(notification => notification.close());
                })
        );
        return;
    }
});

// ═══════════════════════════════════════════════════════════════
// BACKGROUND SYNC
// ═══════════════════════════════════════════════════════════════

self.addEventListener('sync', event => {
    console.log('🔄 SW: Background sync:', event.tag);
    
    if (event.tag === 'sync-chat-messages') {
        event.waitUntil(syncChatMessages());
    }
    
    if (event.tag === 'sync-presence') {
        event.waitUntil(syncPresence());
    }
});

async function syncChatMessages() {
    try {
        // Get pending messages kutoka IndexedDB au localStorage
        const clientList = await clients.matchAll({ type: 'window' });
        
        for (const client of clientList) {
            client.postMessage({
                type: 'SYNC_CHAT_MESSAGES',
                timestamp: Date.now()
            });
        }
        
        console.log('✅ Chat messages synced');
    } catch (error) {
        console.error('Sync chat error:', error);
    }
}

async function syncPresence() {
    try {
        const clientList = await clients.matchAll({ type: 'window' });
        
        for (const client of clientList) {
            client.postMessage({
                type: 'SYNC_PRESENCE',
                timestamp: Date.now()
            });
        }
        
        console.log('✅ Presence synced');
    } catch (error) {
        console.error('Sync presence error:', error);
    }
}

// ═══════════════════════════════════════════════════════════════
// PERIODIC BACKGROUND SYNC (Kama ina support)
// ═══════════════════════════════════════════════════════════════

self.addEventListener('periodicsync', event => {
    console.log('🔄 SW: Periodic sync:', event.tag);
    
    if (event.tag === 'check-updates') {
        event.waitUntil(checkForUpdates());
    }
    
    if (event.tag === 'cleanup-media') {
        event.waitUntil(cleanupOldMedia());
    }
});

async function checkForUpdates() {
    try {
        const clientList = await clients.matchAll({ type: 'window' });
        
        for (const client of clientList) {
            client.postMessage({
                type: 'CHECK_UPDATES'
            });
        }
    } catch (error) {
        console.error('Check updates error:', error);
    }
}

async function cleanupOldMedia() {
    try {
        const clientList = await clients.matchAll({ type: 'window' });
        
        for (const client of clientList) {
            client.postMessage({
                type: 'CLEANUP_OLD_MEDIA'
            });
        }
    } catch (error) {
        console.error('Cleanup error:', error);
    }
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
}

// ═══════════════════════════════════════════════════════════════
// LOG
// ═══════════════════════════════════════════════════════════════

console.log('✅ KMCA Owner Service Worker v' + CACHE_VERSION + ' loaded');
console.log('   • Cache: ' + CACHE_NAME);
console.log('   • Runtime: ' + RUNTIME_CACHE);
console.log('   • Images: ' + IMAGE_CACHE);