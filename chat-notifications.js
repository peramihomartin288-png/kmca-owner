// ═══════════════════════════════════════════════════════════════
// KMCA OWNER CHAT — NOTIFICATIONS MODULE
// Version: 1.0
// Toast + Browser + Push + Sound + Vibration + Badge
// ═══════════════════════════════════════════════════════════════

(function() {
    'use strict';
    
    // ═══════════════════════════════════════════════════════════════
    // CONFIG
    // ═══════════════════════════════════════════════════════════════
    
    const CONFIG = window.HOSTING_CONFIG || {};
    const SUPABASE_URL = CONFIG.supabase?.url;
    const SUPABASE_ANON_KEY = CONFIG.supabase?.anonKey;
    
    const NOTIF_CONFIG = {
        soundEnabled: true,
        vibrationEnabled: true,
        browserEnabled: true,
        pushEnabled: true,
        toastEnabled: true,
        badgeEnabled: true,
        rateLimitWindow: 2000,        // ms — spam prevention
        maxBadgeCount: 99,
        mentionSound: 'mention',      // 'mention' | 'message' | 'call'
        defaultSound: 'message',
        dndStart: null,               // mfano: '22:00'
        dndEnd: null,                 // mfano: '07:00'
        requestPermissionOnInit: false
    };
    
    // ═══════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════
    
    const state = {
        owner: null,
        isInitialized: false,
        permission: 'default',
        lastNotifications: new Map(),  // chatId -> timestamp
        mutedChats: new Set(),
        totalUnread: 0,
        originalTitle: document.title,
        unreadByChat: new Map(),       // chatId -> count
        audioContext: null,
        notificationSound: null,
        mentionSound: null,
        callSound: null
    };
    
    // ═══════════════════════════════════════════════════════════════
    // INIT
    // ═══════════════════════════════════════════════════════════════
    
    function init(options = {}) {
        console.log('🔔 Chat notifications initializing...');
        
        if (state.isInitialized) {
            console.warn('⚠️ Already initialized');
            return getAPI();
        }
        
        // Merge config
        Object.assign(NOTIF_CONFIG, options);
        
        // Get owner
        state.owner = getOwnerSession();
        if (!state.owner) {
            console.warn('⚠️ No owner session');
            return getAPI();
        }
        
        // Load settings
        loadSettings();
        
        // Check permission
        state.permission = getNotificationPermission();
        
        // Setup visibility tracking
        setupVisibilityTracking();
        
        // Setup storage listener (kwa sync across tabs)
        setupStorageListener();
        
        // Request permission kama inahitajika
        if (NOTIF_CONFIG.requestPermissionOnInit && state.permission === 'default') {
            requestPermission();
        }
        
        state.isInitialized = true;
        console.log('✅ Notifications ready');
        console.log('   • Permission:', state.permission);
        
        return getAPI();
    }
    
    // ═══════════════════════════════════════════════════════════════
    // GET OWNER SESSION
    // ═══════════════════════════════════════════════════════════════
    
    function getOwnerSession() {
        try {
            const d = sessionStorage.getItem('kmca_owner');
            if (!d) {
                const b = localStorage.getItem('kmca_owner_backup');
                return b ? JSON.parse(b) : null;
            }
            return JSON.parse(d);
        } catch (e) { return null; }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // LOAD SETTINGS
    // ═══════════════════════════════════════════════════════════════
    
    function loadSettings() {
        try {
            // Load notif settings
            const saved = localStorage.getItem('kmca_notif_settings');
            if (saved) {
                const settings = JSON.parse(saved);
                Object.assign(NOTIF_CONFIG, settings);
            }
            
            // Load muted chats
            const muted = localStorage.getItem('kmca_muted_chats');
            if (muted) {
                const mutedArr = JSON.parse(muted);
                state.mutedChats = new Set(mutedArr);
            }
        } catch (e) {
            console.warn('Load settings error:', e);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // SAVE SETTINGS
    // ═══════════════════════════════════════════════════════════════
    
    function saveSettings() {
        try {
            localStorage.setItem('kmca_notif_settings', JSON.stringify({
                soundEnabled: NOTIF_CONFIG.soundEnabled,
                vibrationEnabled: NOTIF_CONFIG.vibrationEnabled,
                browserEnabled: NOTIF_CONFIG.browserEnabled,
                pushEnabled: NOTIF_CONFIG.pushEnabled,
                toastEnabled: NOTIF_CONFIG.toastEnabled,
                badgeEnabled: NOTIF_CONFIG.badgeEnabled
            }));
            
            localStorage.setItem('kmca_muted_chats', JSON.stringify(Array.from(state.mutedChats)));
        } catch (e) {
            console.warn('Save settings error:', e);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // NOTIFICATION PERMISSION
    // ═══════════════════════════════════════════════════════════════
    
    function getNotificationPermission() {
        if (!('Notification' in window)) return 'unsupported';
        return Notification.permission;
    }
    
    async function requestPermission() {
        if (!('Notification' in window)) {
            console.warn('⚠️ Notification API haitumiki');
            return 'unsupported';
        }
        
        if (Notification.permission === 'granted') {
            state.permission = 'granted';
            return 'granted';
        }
        
        if (Notification.permission === 'denied') {
            state.permission = 'denied';
            return 'denied';
        }
        
        try {
            const permission = await Notification.requestPermission();
            state.permission = permission;
            console.log('🔔 Permission:', permission);
            return permission;
        } catch (error) {
            console.error('Permission request error:', error);
            return 'denied';
        }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // VISIBILITY TRACKING
    // ═══════════════════════════════════════════════════════════════
    
    let isVisible = !document.hidden;
    
    function setupVisibilityTracking() {
        document.addEventListener('visibilitychange', () => {
            isVisible = !document.hidden;
            
            if (isVisible) {
                // User amerudi — reset title
                resetTitle();
            }
        });
    }
    
    // ═══════════════════════════════════════════════════════════════
    // STORAGE LISTENER (Sync across tabs)
    // ═══════════════════════════════════════════════════════════════
    
    function setupStorageListener() {
        window.addEventListener('storage', (e) => {
            if (e.key === 'kmca_chat_unread') {
                try {
                    const data = JSON.parse(e.newValue || '{}');
                    updateBadgeFromData(data);
                } catch (err) {}
            }
        });
    }
    
    // ═══════════════════════════════════════════════════════════════
    // SOUNDS (Web Audio API)
    // ═══════════════════════════════════════════════════════════════
    
    function playSound(type = 'message') {
        if (!NOTIF_CONFIG.soundEnabled) return;
        
        try {
            // Create audio context kama haipo
            if (!state.audioContext) {
                state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            const ctx = state.audioContext;
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            // Different sounds kwa aina tofauti
            switch (type) {
                case 'mention':
                    // Double ping (higher pitch)
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
                    oscillator.frequency.setValueAtTime(1200, ctx.currentTime + 0.1);
                    gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
                    oscillator.start(ctx.currentTime);
                    oscillator.stop(ctx.currentTime + 0.2);
                    break;
                    
                case 'call':
                    // Long ring
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(800, ctx.currentTime);
                    oscillator.frequency.setValueAtTime(1000, ctx.currentTime + 0.2);
                    oscillator.frequency.setValueAtTime(800, ctx.currentTime + 0.4);
                    gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
                    oscillator.start(ctx.currentTime);
                    oscillator.stop(ctx.currentTime + 0.6);
                    break;
                    
                case 'message':
                default:
                    // Single ping
                    oscillator.type = 'sine';
                    oscillator.frequency.value = 800;
                    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
                    oscillator.start(ctx.currentTime);
                    oscillator.stop(ctx.currentTime + 0.15);
                    break;
            }
        } catch (error) {
            console.warn('Sound error:', error);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // VIBRATION
    // ═══════════════════════════════════════════════════════════════
    
    function vibrate(pattern = 'message') {
        if (!NOTIF_CONFIG.vibrationEnabled) return;
        if (!navigator.vibrate) return;
        
        try {
            switch (pattern) {
                case 'mention':
                    navigator.vibrate([50, 30, 50, 30, 50]);
                    break;
                case 'call':
                    navigator.vibrate([500, 200, 500, 200, 500]);
                    break;
                case 'message':
                default:
                    navigator.vibrate([100, 50, 100]);
                    break;
            }
        } catch (error) {
            console.warn('Vibration error:', error);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // SHOW NOTIFICATION (Main function)
    // ═══════════════════════════════════════════════════════════════
    
    async function showNotification(options = {}) {
        const {
            chatId = null,
            title = 'Ujumbe Mpya',
            message = '',
            senderName = '',
            senderAvatar = null,
            type = 'message',      // 'message' | 'mention' | 'call'
            url = null,
            tag = null,
            requireInteraction = false,
            forceShow = false      // Ignore rate limit
        } = options;
        
        if (!state.owner) return { success: false, error: 'No owner' };
        
        // Check mute
        if (chatId && isChatMuted(chatId) && !forceShow) {
            console.log('🔕 Chat imemuted:', chatId);
            return { success: false, error: 'Muted' };
        }
        
        // Check DND
        if (isDNDActive() && !forceShow) {
            console.log('🌙 Do Not Disturb active');
            return { success: false, error: 'DND' };
        }
        
        // Rate limit
        if (!forceShow && chatId && isRateLimited(chatId)) {
            console.log('⏱️ Rate limited:', chatId);
            return { success: false, error: 'Rate limited' };
        }
        
        // Update rate limit timestamp
        if (chatId) {
            state.lastNotifications.set(chatId, Date.now());
        }
        
        // Increment unread
        if (chatId && type !== 'call') {
            incrementUnread(chatId);
        }
        
        const results = {
            toast: false,
            sound: false,
            vibration: false,
            browser: false,
            push: false
        };
        
        // 1. Toast (kama page inaonekana)
        if (isVisible && NOTIF_CONFIG.toastEnabled) {
            results.toast = showToast({
                title,
                message,
                senderName,
                senderAvatar,
                type,
                url,
                chatId
            });
        }
        
        // 2. Sound (kila wakati, kama enabled)
        if (NOTIF_CONFIG.soundEnabled) {
            playSound(type === 'mention' ? 'mention' : type === 'call' ? 'call' : 'message');
            results.sound = true;
        }
        
        // 3. Vibration (kila wakati, kama enabled)
        if (NOTIF_CONFIG.vibrationEnabled) {
            vibrate(type);
            results.vibration = true;
        }
        
        // 4. Browser notification (kama app ipo background)
        if (!isVisible && NOTIF_CONFIG.browserEnabled && state.permission === 'granted') {
            results.browser = await showBrowserNotification({
                title,
                message,
                senderName,
                senderAvatar,
                type,
                url,
                tag: tag || `chat-${chatId || 'general'}-${Date.now()}`,
                requireInteraction: requireInteraction || type === 'call'
            });
        }
        
        // 5. Push notification (kwa simu, kama ipo background)
        // Hii inafanyika automatically kupitia Edge Function — hatuitaji ku-call hapa
        
        return { success: true, results };
    }
    
    // ═══════════════════════════════════════════════════════════════
    // SHOW TOAST (In-app)
    // ═══════════════════════════════════════════════════════════════
    
    function showToast(options) {
        try {
            // Check kama Toastify au toast library ipo
            if (typeof Toastify === 'function') {
                Toastify({
                    text: `${options.title}\n${options.message}`,
                    duration: 4000,
                    gravity: 'top',
                    position: 'center',
                    style: {
                        background: 'var(--bg-card, #0f172a)',
                        border: '1px solid var(--primary, #d4af37)',
                        color: 'var(--text-light, #f8fafc)',
                        borderRadius: '12px',
                        padding: '12px 20px',
                        fontSize: '14px',
                        fontWeight: '600',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.4)'
                    },
                    onClick: () => {
                        if (options.url) window.location.href = options.url;
                    }
                }).showToast();
                return true;
            }
            
            // Custom toast
            showCustomToast(options);
            return true;
        } catch (error) {
            console.warn('Toast error:', error);
            return false;
        }
    }
    
    function showCustomToast(options) {
        // Remove existing toast kama ipo
        const existing = document.getElementById('chatNotifToast');
        if (existing) existing.remove();
        
        const toast = document.createElement('div');
        toast.id = 'chatNotifToast';
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%) translateY(-100px);
            background: var(--bg-card, #0f172a);
            border: 1px solid var(--primary, #d4af37);
            border-radius: 16px;
            padding: 14px 18px;
            display: flex;
            align-items: center;
            gap: 12px;
            z-index: 999999;
            box-shadow: 0 10px 40px rgba(0,0,0,0.5);
            max-width: 90%;
            min-width: 280px;
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        `;
        
        // Icon based on type
        let iconHtml = '';
        if (options.type === 'mention') {
            iconHtml = '<span style="font-size: 24px;">📣</span>';
        } else if (options.type === 'call') {
            iconHtml = '<span style="font-size: 24px; animation: ring 1s infinite;">📞</span>';
        } else {
            iconHtml = '<span style="font-size: 24px;">💬</span>';
        }
        
        // Sender avatar
        let avatarHtml = '';
        if (options.senderAvatar) {
            avatarHtml = `<img src="${options.senderAvatar}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid var(--primary, #d4af37);" onerror="this.style.display='none'">`;
        } else if (options.senderName) {
            const initials = getInitials(options.senderName);
            avatarHtml = `<div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #d4af37, #b8962e); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px; color: #020617; letter-spacing: 1px;">${initials}</div>`;
        } else {
            avatarHtml = iconHtml;
        }
        
        toast.innerHTML = `
            <div style="flex-shrink: 0;">${avatarHtml}</div>
            <div style="flex: 1; min-width: 0;">
                <div style="font-weight: 800; font-size: 14px; color: var(--text-light, #f8fafc); margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${escapeHtml(options.title)}
                </div>
                <div style="font-size: 13px; color: var(--text-muted, #94a3b8); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${escapeHtml(options.message)}
                </div>
            </div>
            <button style="background: transparent; border: none; color: var(--text-muted, #94a3b8); cursor: pointer; padding: 4px; font-size: 18px; flex-shrink: 0;">×</button>
        `;
        
        // Add ring animation
        if (!document.getElementById('chatNotifStyles')) {
            const style = document.createElement('style');
            style.id = 'chatNotifStyles';
            style.textContent = `
                @keyframes ring {
                    0%, 100% { transform: rotate(0deg); }
                    20%, 60% { transform: rotate(-15deg); }
                    40%, 80% { transform: rotate(15deg); }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(toast);
        
        // Show animation
        setTimeout(() => {
            toast.style.transform = 'translateX(-50%) translateY(0)';
        }, 50);
        
        // Click handler
        toast.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                hideToast();
                return;
            }
            
            if (options.url) {
                window.location.href = options.url;
            }
        });
        
        // Auto-hide
        setTimeout(hideToast, 4000);
        
        function hideToast() {
            toast.style.transform = 'translateX(-50%) translateY(-100px)';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 400);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // BROWSER NOTIFICATION
    // ═══════════════════════════════════════════════════════════════
    
    async function showBrowserNotification(options) {
        if (!('Notification' in window)) return false;
        if (Notification.permission !== 'granted') return false;
        
        try {
            // Kama service worker ipo, tumia reg.showNotification
            if ('serviceWorker' in navigator) {
                const reg = await navigator.serviceWorker.ready;
                
                await reg.showNotification(options.title, {
                    body: options.message,
                    icon: options.senderAvatar || 'owner-icon-192.png',
                    badge: 'owner-icon-96.png',
                    tag: options.tag,
                    requireInteraction: options.requireInteraction,
                    vibrate: NOTIF_CONFIG.vibrationEnabled ? [100, 50, 100] : null,
                    data: {
                        url: options.url,
                        type: options.type
                    },
                    actions: options.type === 'call' ? [
                        { action: 'accept', title: '✅ Pokea' },
                        { action: 'decline', title: '❌ Kataa' }
                    ] : [
                        { action: 'open', title: 'Fungua' },
                        { action: 'close', title: 'Funga' }
                    ]
                });
                
                return true;
            }
            
            // Fallback: Notification API
            const notif = new Notification(options.title, {
                body: options.message,
                icon: options.senderAvatar || 'owner-icon-192.png',
                tag: options.tag,
                requireInteraction: options.requireInteraction,
                vibrate: NOTIF_CONFIG.vibrationEnabled ? [100, 50, 100] : null,
                data: { url: options.url }
            });
            
            notif.addEventListener('click', () => {
                window.focus();
                if (options.url) window.location.href = options.url;
                notif.close();
            });
            
            return true;
        } catch (error) {
            console.warn('Browser notification error:', error);
            return false;
        }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // PUSH NOTIFICATION (Kupitia Edge Function)
    // ═══════════════════════════════════════════════════════════════
    
    async function sendPushToOwner(ownerId, options) {
        if (!NOTIF_CONFIG.pushEnabled) return { success: false };
        
        try {
            const response = await fetch(`${SUPABASE_URL}/functions/v1/send-push`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: ownerId,
                    title: options.title,
                    message: options.message,
                    url: options.url,
                    icon: options.senderAvatar,
                    tag: options.tag
                })
            });
            
            if (response.ok) {
                console.log('📤 Push sent to:', ownerId);
                return { success: true };
            }
            
            return { success: false };
        } catch (error) {
            console.warn('Push error:', error);
            return { success: false };
        }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // BADGE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════
    
    function incrementUnread(chatId) {
        const current = state.unreadByChat.get(chatId) || 0;
        state.unreadByChat.set(chatId, current + 1);
        state.totalUnread++;
        
        updateBadge();
        
        // Save to localStorage kwa sync across tabs
        saveUnreadToStorage();
    }
    
    function decrementUnread(chatId) {
        const current = state.unreadByChat.get(chatId) || 0;
        if (current > 0) {
            state.unreadByChat.set(chatId, current - 1);
            state.totalUnread = Math.max(0, state.totalUnread - 1);
        }
        
        updateBadge();
        saveUnreadToStorage();
    }
    
    function clearUnread(chatId) {
        const current = state.unreadByChat.get(chatId) || 0;
        state.unreadByChat.set(chatId, 0);
        state.totalUnread = Math.max(0, state.totalUnread - current);
        
        updateBadge();
        saveUnreadToStorage();
    }
    
    function clearAllUnread() {
        state.unreadByChat.clear();
        state.totalUnread = 0;
        updateBadge();
        saveUnreadToStorage();
    }
    
    function updateBadge() {
        if (!NOTIF_CONFIG.badgeEnabled) return;
        
        // 1. Title badge
        if (state.totalUnread > 0 && !isVisible) {
            document.title = `(${state.totalUnread}) ${state.originalTitle}`;
        } else {
            resetTitle();
        }
        
        // 2. Nav badge (kama ipo)
        const navBadge = document.getElementById('chatNavBadge');
        if (navBadge) {
            if (state.totalUnread > 0) {
                navBadge.textContent = state.totalUnread > NOTIF_CONFIG.maxBadgeCount 
                    ? `${NOTIF_CONFIG.maxBadgeCount}+` 
                    : state.totalUnread;
                navBadge.classList.add('show');
            } else {
                navBadge.classList.remove('show');
            }
        }
        
        // 3. Header badge (kama ipo)
        const headerBadge = document.getElementById('notificationBadge');
        if (headerBadge) {
            if (state.totalUnread > 0) {
                headerBadge.textContent = state.totalUnread > NOTIF_CONFIG.maxBadgeCount 
                    ? `${NOTIF_CONFIG.maxBadgeCount}+` 
                    : state.totalUnread;
                headerBadge.classList.add('show');
            } else {
                headerBadge.classList.remove('show');
            }
        }
        
        // 4. Navigator badge (Set App Badge API)
        if ('setAppBadge' in navigator) {
            if (state.totalUnread > 0) {
                navigator.setAppBadge(state.totalUnread).catch(() => {});
            } else {
                navigator.clearAppBadge().catch(() => {});
            }
        }
    }
    
    function resetTitle() {
        document.title = state.originalTitle;
    }
    
    function saveUnreadToStorage() {
        try {
            const data = {
                totalUnread: state.totalUnread,
                unreadByChat: Object.fromEntries(state.unreadByChat),
                timestamp: Date.now()
            };
            localStorage.setItem('kmca_chat_unread', JSON.stringify(data));
        } catch (e) {}
    }
    
    function updateBadgeFromData(data) {
        if (!data) return;
        
        state.totalUnread = data.totalUnread || 0;
        state.unreadByChat = new Map(Object.entries(data.unreadByChat || {}));
        
        updateBadge();
    }
    
    // ═══════════════════════════════════════════════════════════════
    // RATE LIMITING
    // ═══════════════════════════════════════════════════════════════
    
    function isRateLimited(chatId) {
        const lastTime = state.lastNotifications.get(chatId);
        if (!lastTime) return false;
        
        return (Date.now() - lastTime) < NOTIF_CONFIG.rateLimitWindow;
    }
    
    // ═══════════════════════════════════════════════════════════════
    // MUTE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════
    
    function muteChat(chatId) {
        state.mutedChats.add(chatId);
        saveSettings();
        console.log('🔕 Muted:', chatId);
    }
    
    function unmuteChat(chatId) {
        state.mutedChats.delete(chatId);
        saveSettings();
        console.log('🔔 Unmuted:', chatId);
    }
    
    function isChatMuted(chatId) {
        return state.mutedChats.has(chatId);
    }
    
    function toggleMute(chatId) {
        if (isChatMuted(chatId)) {
            unmuteChat(chatId);
            return false;
        } else {
            muteChat(chatId);
            return true;
        }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // DO NOT DISTURB
    // ═══════════════════════════════════════════════════════════════
    
    function isDNDActive() {
        if (!NOTIF_CONFIG.dndStart || !NOTIF_CONFIG.dndEnd) return false;
        
        try {
            const now = new Date();
            const currentMinutes = now.getHours() * 60 + now.getMinutes();
            
            const [startH, startM] = NOTIF_CONFIG.dndStart.split(':').map(Number);
            const [endH, endM] = NOTIF_CONFIG.dndEnd.split(':').map(Number);
            
            const startMinutes = startH * 60 + startM;
            const endMinutes = endH * 60 + endM;
            
            // Handle overnight DND (mfano 22:00 - 07:00)
            if (startMinutes > endMinutes) {
                return currentMinutes >= startMinutes || currentMinutes < endMinutes;
            } else {
                return currentMinutes >= startMinutes && currentMinutes < endMinutes;
            }
        } catch (e) {
            return false;
        }
    }
    
    function setDND(start, end) {
        NOTIF_CONFIG.dndStart = start;
        NOTIF_CONFIG.dndEnd = end;
        saveSettings();
        console.log(`🌙 DND: ${start} - ${end}`);
    }
    
    function clearDND() {
        NOTIF_CONFIG.dndStart = null;
        NOTIF_CONFIG.dndEnd = null;
        saveSettings();
        console.log('🌙 DND cleared');
    }
    
    // ═══════════════════════════════════════════════════════════════
    // CONVENIENCE FUNCTIONS
    // ═══════════════════════════════════════════════════════════════
    
    // Notify kwa message mpya
    async function notifyNewMessage(msg, chatInfo = {}) {
        if (!msg || msg.sender_id === state.owner?.id) return;
        
        const senderName = msg.sender_name || 'Unknown';
        const isMention = msg.mentions && msg.mentions.includes(state.owner?.id);
        
        // Preview ya message
        let preview = msg.message || '';
        if (msg.message_type === 'image') preview = '🖼️ Picha';
        else if (msg.message_type === 'video') preview = '🎥 Video';
        else if (msg.message_type === 'file') preview = '📎 ' + (msg.attachment_name || 'File');
        else if (msg.message_type === 'voice') preview = '🎤 Voice note';
        else if (preview.length > 80) preview = preview.substring(0, 80) + '...';
        
        return await showNotification({
            chatId: msg.chat_id,
            title: isMention ? `📣 ${senderName} amekutaja` : senderName,
            message: preview,
            senderName: senderName,
            senderAvatar: chatInfo.senderAvatar || null,
            type: isMention ? 'mention' : 'message',
            url: `chat-view.html?chat=${msg.chat_id}`,
            tag: `msg-${msg.id}`,
            forceShow: isMention  // Mention hu-show kila wakati
        });
    }
    
    // Notify kwa call mpya
    async function notifyIncomingCall(call) {
        if (!call) return;
        
        return await showNotification({
            chatId: null,
            title: `📞 ${call.caller_name || 'Owner'} anakupigia`,
            message: `${call.call_type === 'video' ? 'Video' : 'Voice'} call...`,
            senderName: call.caller_name,
            senderAvatar: call.caller_avatar || null,
            type: 'call',
            url: `chat-view.html?chat=${call.chat_id}&call=${call.id}`,
            tag: `call-${call.id}`,
            requireInteraction: true,
            forceShow: true
        });
    }
    
    // Notify kwa mention
    async function notifyMention(data) {
        return await showNotification({
            chatId: data.chat_id,
            title: `📣 ${data.from_name} amekutaja`,
            message: data.message || 'Umekutajwa kwenye chat',
            senderName: data.from_name,
            type: 'mention',
            url: `chat-view.html?chat=${data.chat_id}`,
            tag: `mention-${data.id}`,
            forceShow: true
        });
    }
    
    // ═══════════════════════════════════════════════════════════════
    // PER-CHAT SUBSCRIPTION
    // ═══════════════════════════════════════════════════════════════
    
    let messageSubscription = null;
    
    function subscribeToMessages(chatId = null) {
        if (messageSubscription) {
            messageSubscription.unsubscribe();
        }
        
        const filter = chatId ? `chat_id=eq.${chatId}` : undefined;
        
        messageSubscription = supabaseClient
            .channel('chat-notifs')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'owner_chat_messages',
                ...(filter && { filter })
            }, async (payload) => {
                const msg = payload.new;
                if (!msg || msg.sender_id === state.owner?.id) return;
                
                // Get sender info
                const sender = await getOwnerInfo(msg.sender_id);
                
                await notifyNewMessage(msg, {
                    senderAvatar: sender?.profile_picture || null
                });
            })
            .subscribe();
        
        console.log('📡 Subscribed to messages');
    }
    
    async function getOwnerInfo(ownerId) {
        try {
            const { data } = await supabaseClient
                .from('owners')
                .select('id, jina, profile_picture')
                .eq('id', ownerId)
                .maybeSingle();
            
            return data;
        } catch (e) {
            return null;
        }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // CLEANUP
    // ═══════════════════════════════════════════════════════════════
    
    function cleanup() {
        if (messageSubscription) {
            messageSubscription.unsubscribe();
            messageSubscription = null;
        }
        
        state.unreadByChat.clear();
        state.totalUnread = 0;
        updateBadge();
    }
    
    // ═══════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════
    
    function getInitials(j) {
        if (!j) return '??';
        const c = j.trim().replace(/\s+/g, ' ');
        const n = c.split(' ');
        if (n.length >= 2) return (n[0][0] + n[1][0]).toUpperCase();
        if (n.length === 1 && n[0].length >= 2) return n[0].substring(0, 2).toUpperCase();
        return '??';
    }
    
    function escapeHtml(t) {
        if (!t) return '';
        const d = document.createElement('div');
        d.textContent = t;
        return d.innerHTML;
    }
    
    // ═══════════════════════════════════════════════════════════════
    // GET API
    // ═══════════════════════════════════════════════════════════════
    
    function getAPI() {
        return {
            // Core
            init,
            showNotification,
            requestPermission,
            getPermission: () => state.permission,
            
            // Convenience
            notifyNewMessage,
            notifyIncomingCall,
            notifyMention,
            sendPushToOwner,
            
            // Badge
            incrementUnread,
            decrementUnread,
            clearUnread,
            clearAllUnread,
            updateBadge,
            getUnreadCount: () => state.totalUnread,
            
            // Settings
            muteChat,
            unmuteChat,
            isChatMuted,
            toggleMute,
            setDND,
            clearDND,
            isDNDActive,
            
            // Config
            setSoundEnabled: (v) => { NOTIF_CONFIG.soundEnabled = v; saveSettings(); },
            setVibrationEnabled: (v) => { NOTIF_CONFIG.vibrationEnabled = v; saveSettings(); },
            setBrowserEnabled: (v) => { NOTIF_CONFIG.browserEnabled = v; saveSettings(); },
            setPushEnabled: (v) => { NOTIF_CONFIG.pushEnabled = v; saveSettings(); },
            setToastEnabled: (v) => { NOTIF_CONFIG.toastEnabled = v; saveSettings(); },
            setBadgeEnabled: (v) => { NOTIF_CONFIG.badgeEnabled = v; saveSettings(); },
            
            getConfig: () => ({ ...NOTIF_CONFIG }),
            
            // Subscription
            subscribeToMessages,
            cleanup,
            
            // Utilities
            playSound,
            vibrate
        };
    }
    
    // ═══════════════════════════════════════════════════════════════
    // EXPORT GLOBAL
    // ═══════════════════════════════════════════════════════════════
    
    window.ChatNotifications = getAPI();
    
    // Auto-init kama document iko ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('🔔 ChatNotifications ready (call .init() to start)');
        });
    } else {
        console.log('🔔 ChatNotifications ready (call .init() to start)');
    }
    
    console.log('✅ OWNER_CHAT_NOTIFICATIONS loaded');
    console.log('   • ChatNotifications.init()');
    console.log('   • ChatNotifications.notifyNewMessage(msg, chatInfo)');
    console.log('   • ChatNotifications.notifyIncomingCall(call)');
    console.log('   • ChatNotifications.notifyMention(data)');
    console.log('   • ChatNotifications.incrementUnread(chatId)');
    console.log('   • ChatNotifications.clearUnread(chatId)');
    console.log('   • ChatNotifications.muteChat(chatId)');
    console.log('   • ChatNotifications.requestPermission()');
    
})();