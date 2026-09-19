// ============================================================
// KMCA OWNER — PUSH NOTIFICATIONS
// Version: 4.0
// Subscribe + Send + Manage Push + CSS
// ============================================================

(function() {
    'use strict';

    // ============================================
    // CSS INJECTION
    // ============================================
    const OWNER_PUSH_CSS = `
        /* ============================================================
           PUSH TOGGLE — CSS
           ============================================================ */
        .owner-push-toggle-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 14px;
            padding: 16px;
            background: var(--owner-bg-input, #1e293b);
            border: 1px solid var(--owner-border, #334155);
            border-radius: var(--owner-radius-md, 12px);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
        }

        .owner-push-toggle-item::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, transparent, var(--owner-primary, #d4af37), transparent);
            opacity: 0;
            transition: opacity 0.3s;
        }

        .owner-push-toggle-item.enabled::before {
            opacity: 1;
        }

        .owner-push-toggle-item.enabled {
            background: rgba(212, 175, 55, 0.05);
            border-color: var(--owner-primary, #d4af37);
        }

        .owner-push-toggle-left {
            display: flex;
            align-items: center;
            gap: 14px;
            flex: 1;
            min-width: 0;
        }

        .owner-push-toggle-icon {
            width: 42px;
            height: 42px;
            background: rgba(212, 175, 55, 0.12);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            color: var(--owner-primary, #d4af37);
            flex-shrink: 0;
            transition: all 0.3s;
        }

        .owner-push-toggle-item.enabled .owner-push-toggle-icon {
            background: var(--owner-primary, #d4af37);
            color: var(--owner-bg-dark, #020617);
            box-shadow: 0 0 20px rgba(212, 175, 55, 0.4);
            animation: ownerPushIconPulse 2s ease-in-out infinite;
        }

        @keyframes ownerPushIconPulse {
            0%, 100% { 
                transform: scale(1); 
                box-shadow: 0 0 20px rgba(212, 175, 55, 0.4);
            }
            50% { 
                transform: scale(1.05); 
                box-shadow: 0 0 30px rgba(212, 175, 55, 0.7);
            }
        }

        .owner-push-toggle-text {
            flex: 1;
            min-width: 0;
        }

        .owner-push-toggle-text h4 {
            font-size: 14px;
            font-weight: 700;
            color: var(--owner-text-light, #f8fafc);
            margin-bottom: 3px;
            line-height: 1.3;
        }

        .owner-push-toggle-text p {
            font-size: 12px;
            color: var(--owner-text-muted, #94a3b8);
            line-height: 1.4;
        }

        /* ============================================================
           TOGGLE SWITCH
           ============================================================ */
        .owner-push-switch {
            position: relative;
            width: 52px;
            height: 30px;
            background: var(--owner-border, #334155);
            border-radius: 15px;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            flex-shrink: 0;
        }

        .owner-push-switch::after {
            content: '';
            position: absolute;
            top: 3px;
            left: 3px;
            width: 24px;
            height: 24px;
            background: white;
            border-radius: 50%;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }

        .owner-push-switch.active {
            background: var(--owner-primary, #d4af37);
        }

        .owner-push-switch.active::after {
            left: 25px;
            box-shadow: 0 2px 8px rgba(212, 175, 55, 0.5);
        }

        .owner-push-switch.disabled {
            opacity: 0.4;
            cursor: not-allowed;
        }

        .owner-push-switch.loading::after {
            animation: ownerPushSwitchSpin 1s linear infinite;
            background: transparent;
            border: 3px solid rgba(255,255,255,0.3);
            border-top-color: white;
            width: 20px;
            height: 20px;
            top: 5px;
            left: 5px;
        }

        @keyframes ownerPushSwitchSpin {
            to { transform: rotate(360deg); }
        }

        /* ============================================================
           TEST BUTTON
           ============================================================ */
        .owner-push-test-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            width: 100%;
            margin-top: 12px;
            padding: 12px 18px;
            background: var(--owner-bg-input, #1e293b);
            border: 1px solid var(--owner-border, #334155);
            border-radius: var(--owner-radius-md, 12px);
            color: var(--owner-text-light, #f8fafc);
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            font-family: inherit;
        }

        .owner-push-test-btn:hover:not(:disabled) {
            background: var(--owner-primary, #d4af37);
            color: var(--owner-bg-dark, #020617);
            border-color: var(--owner-primary, #d4af37);
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(212, 175, 55, 0.4);
        }

        .owner-push-test-btn:active:not(:disabled) {
            transform: translateY(0) scale(0.98);
        }

        .owner-push-test-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        /* ============================================================
           INFO BOX
           ============================================================ */
        .owner-push-info {
            display: none;
            align-items: flex-start;
            gap: 10px;
            padding: 12px 14px;
            margin-top: 12px;
            border-radius: var(--owner-radius-md, 12px);
            font-size: 12px;
            line-height: 1.5;
            animation: ownerPushInfoSlide 0.3s ease-out;
        }

        .owner-push-info.show {
            display: flex;
        }

        @keyframes ownerPushInfoSlide {
            from { 
                opacity: 0; 
                transform: translateY(-8px); 
            }
            to { 
                opacity: 1; 
                transform: translateY(0); 
            }
        }

        .owner-push-info i {
            font-size: 16px;
            flex-shrink: 0;
            margin-top: 1px;
        }

        .owner-push-info.warning {
            background: rgba(245, 158, 11, 0.1);
            border-left: 3px solid #f59e0b;
            color: #fcd34d;
        }

        .owner-push-info.warning i {
            color: #f59e0b;
        }

        .owner-push-info.error {
            background: rgba(239, 68, 68, 0.1);
            border-left: 3px solid #ef4444;
            color: #fca5a5;
        }

        .owner-push-info.error i {
            color: #ef4444;
        }

        .owner-push-info.info {
            background: rgba(59, 130, 246, 0.1);
            border-left: 3px solid #3b82f6;
            color: #93c5fd;
        }

        .owner-push-info.info i {
            color: #3b82f6;
        }

        /* ============================================================
           CONFIRM MODAL (Generic — inaweza kutumika kwa logout pia)
           ============================================================ */
        .owner-confirm-modal {
            position: fixed;
            inset: 0;
            background: rgba(2, 6, 23, 0.9);
            z-index: 100000;
            display: none;
            align-items: center;
            justify-content: center;
            padding: 20px;
            backdrop-filter: blur(8px);
            opacity: 0;
            transition: opacity 0.3s;
        }

        .owner-confirm-modal.active {
            display: flex;
            opacity: 1;
        }

        .owner-confirm-content {
            background: var(--owner-bg-card, #0f172a);
            border: 1px solid var(--owner-border, #334155);
            border-radius: var(--owner-radius-lg, 16px);
            padding: 28px 24px;
            max-width: 400px;
            width: 100%;
            text-align: center;
            transform: scale(0.9);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        }

        .owner-confirm-modal.active .owner-confirm-content {
            transform: scale(1);
        }

        .owner-confirm-icon {
            width: 64px;
            height: 64px;
            margin: 0 auto 16px;
            background: rgba(245, 158, 11, 0.15);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            color: #f59e0b;
            animation: ownerConfirmPulse 2s ease-in-out infinite;
        }

        .owner-confirm-icon.danger {
            background: rgba(239, 68, 68, 0.15);
            color: #ef4444;
        }

        @keyframes ownerConfirmPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.08); }
        }

        .owner-confirm-content h3 {
            font-size: 20px;
            font-weight: 800;
            color: var(--owner-text-light, #f8fafc);
            margin-bottom: 10px;
        }

        .owner-confirm-content p {
            font-size: 14px;
            color: var(--owner-text-muted, #94a3b8);
            line-height: 1.6;
            margin-bottom: 24px;
        }

        .owner-confirm-actions {
            display: flex;
            gap: 10px;
        }

        .owner-confirm-btn {
            flex: 1;
            padding: 13px;
            border-radius: var(--owner-radius-md, 12px);
            border: none;
            font-size: 15px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            font-family: inherit;
        }

        .owner-confirm-btn.cancel {
            background: var(--owner-bg-input, #1e293b);
            color: var(--owner-text-light, #f8fafc);
        }

        .owner-confirm-btn.cancel:hover {
            background: var(--owner-border, #334155);
        }

        .owner-confirm-btn.confirm {
            background: var(--owner-primary, #d4af37);
            color: var(--owner-bg-dark, #020617);
        }

        .owner-confirm-btn.confirm:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(212, 175, 55, 0.4);
        }

        .owner-confirm-btn.confirm.danger {
            background: #ef4444;
            color: white;
        }

        .owner-confirm-btn.confirm.danger:hover {
            box-shadow: 0 8px 24px rgba(239, 68, 68, 0.4);
        }

        /* ============================================================
           TOAST (kama haipo tayari)
           ============================================================ */
        .owner-toast {
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%) translateY(-120px);
            background: #10b981;
            color: white;
            padding: 14px 22px;
            border-radius: var(--owner-radius-md, 12px);
            font-size: 14px;
            font-weight: 600;
            z-index: 999999;
            box-shadow: 0 10px 40px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            gap: 10px;
            opacity: 0;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            max-width: 90%;
            font-family: -apple-system, sans-serif;
            pointer-events: none;
        }

        .owner-toast.show {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }

        .owner-toast.error { background: #ef4444; }
        .owner-toast.warning { background: #f59e0b; }
        .owner-toast.info { background: #3b82f6; }
        .owner-toast.success { background: #10b981; }
    `;

    // ============================================
    // INJECT CSS
    // ============================================
    function injectPushCSS() {
        if (document.getElementById('owner-push-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'owner-push-styles';
        style.textContent = OWNER_PUSH_CSS;
        document.head.appendChild(style);
        
        console.log('✅ Owner Push CSS injected');
    }

    // ============================================
    // VAPID KEY
    // ============================================
    let VAPID_PUBLIC_KEY = 'BKNmfI7QOo1GE2kXwHIUHPTEMoKFNF2FjKWE5-9Wes7YYgmuEF8eYmzp4YscPtyVbg0So4j3wpeMvBsQm1hyVrw';

    // ============================================
    // HELPERS
    // ============================================
    function urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');
        
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    function isPushSupported() {
        return 'serviceWorker' in navigator && 
               'PushManager' in window && 
               'Notification' in window;
    }

    function getDeviceType() {
        const ua = navigator.userAgent;
        if (/android/i.test(ua)) return 'android';
        if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
        return 'desktop';
    }

    async function loadVapidKey() {
        if (typeof supabaseClient === 'undefined') return;
        
        try {
            const { data } = await supabaseClient
                .from('app_settings')
                .select('setting_value')
                .eq('setting_key', 'vapid_public_key')
                .single();
            
            if (data && data.setting_value) {
                VAPID_PUBLIC_KEY = data.setting_value;
            }
        } catch (e) {
            // Use default
        }
    }

    function getOwnerSession() {
        try {
            const data = sessionStorage.getItem('kmca_owner');
            if (!data) {
                const backup = localStorage.getItem('kmca_owner_backup');
                return backup ? JSON.parse(backup) : null;
            }
            return JSON.parse(data);
        } catch (e) {
            return null;
        }
    }

    // ============================================
    // SUBSCRIBE OWNER TO PUSH
    // ============================================
    async function subscribeOwnerToPush(ownerId) {
        try {
            console.log('🔔 Subscribing owner to push...');
            
            if (!isPushSupported()) {
                return { success: false, error: 'Push notifications hazitumiki kwenye browser hii' };
            }
            
            if (window.location.protocol === 'file:') {
                return { success: false, error: 'Push inahitaji HTTPS' };
            }
            
            await loadVapidKey();
            
            const registration = await navigator.serviceWorker.ready;
            
            // Check permission
            let permission = Notification.permission;
            
            if (permission === 'denied') {
                return { success: false, error: 'Umezima notifications. Ruhusu kwenye browser settings.' };
            }
            
            if (permission === 'default') {
                permission = await Notification.requestPermission();
            }
            
            if (permission !== 'granted') {
                return { success: false, error: 'Hukubali notifications' };
            }
            
            // Get or create subscription
            let subscription = await registration.pushManager.getSubscription();
            
            if (!subscription) {
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                });
            }
            
            console.log('✅ Push subscription:', subscription.endpoint);
            
            // Convert keys
            const p256dhKey = subscription.getKey('p256dh');
            const authKey = subscription.getKey('auth');
            
            const subscriptionData = {
                user_id: ownerId,
                endpoint: subscription.endpoint,
                p256dh: btoa(String.fromCharCode(...new Uint8Array(p256dhKey))),
                auth: btoa(String.fromCharCode(...new Uint8Array(authKey))),
                device_type: getDeviceType(),
                user_agent: navigator.userAgent,
                is_active: true,
                updated_at: new Date().toISOString()
            };
            
            // Save to Supabase
            const { error } = await supabaseClient
                .from('push_subscriptions')
                .upsert(subscriptionData, { onConflict: 'user_id,endpoint' });
            
            if (error) throw error;
            
            console.log('✅ Subscription saved');
            
            return { 
                success: true, 
                subscription: subscription,
                deviceType: getDeviceType()
            };
            
        } catch (error) {
            console.error('❌ Subscribe error:', error);
            return { success: false, error: error.message };
        }
    }

    // ============================================
    // UNSUBSCRIBE OWNER
    // ============================================
    async function unsubscribeOwnerFromPush(ownerId) {
        try {
            console.log('🔕 Unsubscribing owner...');
            
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            
            if (subscription) {
                const endpoint = subscription.endpoint;
                await subscription.unsubscribe();
                
                await supabaseClient
                    .from('push_subscriptions')
                    .delete()
                    .eq('user_id', ownerId)
                    .eq('endpoint', endpoint);
                
                console.log('✅ Unsubscribed');
            }
            
            return { success: true };
        } catch (error) {
            console.error('❌ Unsubscribe error:', error);
            return { success: false, error: error.message };
        }
    }

    // ============================================
    // CHECK PUSH STATUS
    // ============================================
    async function checkOwnerPushStatus() {
        if (!isPushSupported()) {
            return { supported: false, subscribed: false, permission: 'unsupported' };
        }
        
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            
            return {
                supported: true,
                subscribed: !!subscription,
                permission: Notification.permission,
                subscription: subscription
            };
        } catch (error) {
            return { 
                supported: true, 
                subscribed: false, 
                permission: 'error', 
                error: error.message 
            };
        }
    }

    // ============================================
    // SEND PUSH (Generic)
    // ============================================
    async function sendOwnerPush(options) {
        try {
            const {
                all_users = false,
                user_id = null,
                user_ids = null,
                title = 'KMCA',
                message = 'Taarifa mpya!',
                url = '/home.html',
                icon = '/user-icon-192.png',
                badge = '/user-icon-192.png',
                tag = null
            } = options;
            
            console.log('📤 Sending push:', { all_users, user_id, title });
            
            const { data, error } = await supabaseClient.functions.invoke('send-push', {
                body: {
                    all_users,
                    user_id,
                    user_ids,
                    title,
                    message,
                    url,
                    icon,
                    badge,
                    tag: tag || `kmca-${Date.now()}`
                }
            });
            
            if (error) throw error;
            
            console.log('✅ Push sent:', data);
            return { success: true, result: data };
            
        } catch (error) {
            console.error('❌ Send push error:', error);
            return { success: false, error: error.message };
        }
    }

    // ============================================
    // SEND TEST PUSH TO SELF
    // ============================================
    async function sendTestPushToSelf(ownerId) {
        try {
            const { data, error } = await supabaseClient.functions.invoke('send-push', {
                body: {
                    user_id: ownerId,
                    title: '🧪 Test Notification',
                    message: 'Hii ni test kutoka KMCA Owner Panel. Kama unaona hii, push inafanya kazi!',
                    url: '/dashboard.html',
                    tag: 'test-' + Date.now()
                }
            });
            
            if (error) throw error;
            return { success: true, result: data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ============================================
    // NOTIFY USERS (Helper kwa kila action)
    // ============================================
    async function notifyUsers(actionType, data) {
        try {
            console.log(`🔔 notifyUsers: ${actionType}`);
            
            const configs = {
                'saint': {
                    title: '🕊️ Mtakatifu wa Leo',
                    message: buildSaintMessage(data),
                    url: '/watakatifu.html?id=' + data.id,
                    tag: 'saint-' + data.id
                },
                'post': {
                    title: '📝 Post Mpya',
                    message: (data.title || data.description || 'Angalia post mpya').substring(0, 100),
                    url: '/home.html',
                    tag: 'post-' + data.id
                },
                'poll': {
                    title: '🗳️ Poll Mpya',
                    message: data.swali || 'Piga kura yako sasa',
                    url: '/home.html',
                    tag: 'poll-' + data.id
                },
                'event': {
                    title: '📅 Tukio Jipya',
                    message: buildEventMessage(data),
                    url: '/matukio.html?id=' + data.id,
                    tag: 'event-' + data.id
                },
                'bible': {
                    title: '📖 Bible Verse ya Leo',
                    message: buildBibleMessage(data),
                    url: '/bible.html?id=' + data.id,
                    tag: 'bible-' + data.id
                },
                'song': {
                    title: '🎵 Wimbo wa Siku',
                    message: buildSongMessage(data),
                    url: '/wimbo.html?id=' + data.id,
                    tag: 'song-' + data.id
                },
                'masomo': {
                    title: '📚 Masomo ya Dominica',
                    message: buildMasomoMessage(data),
                    url: '/masomo.html?id=' + data.id,
                    tag: 'masomo-' + data.id
                },
                'announcement': {
                    title: buildAnnouncementTitle(data),
                    message: buildAnnouncementMessage(data),
                    url: '/announcements.html?id=' + data.id,
                    tag: 'announcement-' + data.id
                }
            };
            
            const config = configs[actionType];
            if (!config) {
                return { success: false, error: 'Unknown action type: ' + actionType };
            }
            
            return await sendOwnerPush({
                all_users: true,
                title: config.title,
                message: config.message,
                url: config.url,
                tag: config.tag
            });
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ============================================
    // MESSAGE BUILDERS
    // ============================================
    function buildSaintMessage(data) {
        let msg = 'Mtakatifu ' + (data.jina || 'wa leo');
        if (data.sikukuu) {
            const date = new Date(data.sikukuu);
            msg += ' — Sikukuu ya ' + date.toLocaleDateString('sw-TZ', { 
                day: '2-digit', month: '2-digit', year: 'numeric' 
            });
        }
        return msg;
    }

    function buildEventMessage(data) {
        let msg = data.jina || 'Angalia tukio';
        if (data.tarehe_tukio) {
            const date = new Date(data.tarehe_tukio);
            msg += ' — ' + date.toLocaleDateString('sw-TZ', { 
                day: '2-digit', month: '2-digit', year: 'numeric' 
            });
        }
        if (data.mahali) msg += ' (' + data.mahali + ')';
        return msg;
    }

    function buildBibleMessage(data) {
        let msg = data.kichwa || 'Verse ya leo';
        if (data.reference) msg += ' (' + data.reference + ')';
        return msg;
    }

    function buildSongMessage(data) {
        let msg = data.jina || 'Sikiliza wimbo';
        if (data.maelezo) msg += ' — ' + data.maelezo.substring(0, 80);
        return msg;
    }

    function buildMasomoMessage(data) {
        let msg = data.jina_dominika || 'Soma masomo';
        if (data.tarehe_jumapili) {
            const date = new Date(data.tarehe_jumapili);
            msg += ' — ' + date.toLocaleDateString('sw-TZ', { 
                day: '2-digit', month: '2-digit', year: 'numeric' 
            });
        }
        return msg;
    }

    function buildAnnouncementTitle(data) {
        if (data.priority === 'urgent') return '🚨 Tangazo la Dharura';
        if (data.priority === 'important') return '⚠️ Tangazo Muhimu';
        return '📢 Tangazo Jipya';
    }

    function buildAnnouncementMessage(data) {
        let msg = data.title || 'Tangazo jipya';
        if (data.content) msg += ' — ' + data.content.substring(0, 100);
        return msg;
    }

    // ============================================
    // AUTO-SUBSCRIBE OWNER
    // ============================================
    async function autoSubscribeOwner(ownerId) {
        try {
            const status = await checkOwnerPushStatus();
            
            if (!status.supported) return { success: false, reason: 'not_supported' };
            if (status.permission === 'denied') return { success: false, reason: 'denied' };
            if (status.permission === 'default') return { success: false, reason: 'permission_default' };
            if (status.subscribed) return { success: true, reason: 'already_subscribed' };
            
            return await subscribeOwnerToPush(ownerId);
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ============================================
    // INIT OWNER PUSH TOGGLE (UI)
    // ============================================
    async function initOwnerPushToggle(owner) {
        const toggle = document.getElementById('ownerPushSwitch');
        const statusText = document.getElementById('ownerPushStatus');
        const testBtn = document.getElementById('ownerTestPushBtn');
        const infoBox = document.getElementById('ownerPushInfoBox');
        const infoText = document.getElementById('ownerPushInfoText');
        
        if (!toggle) {
            console.warn('⚠️ Push toggle elements not found');
            return;
        }
        
        let currentStatus = await checkOwnerPushStatus();
        
        function updateUI() {
            // Wrap item
            const wrapper = toggle.closest('.owner-push-toggle-item');
            
            if (!currentStatus.supported) {
                if (statusText) {
                    statusText.textContent = 'Hazitumiki kwenye browser hii';
                    statusText.style.color = '#f59e0b';
                }
                toggle.classList.remove('active');
                toggle.classList.add('disabled');
                if (wrapper) wrapper.classList.remove('enabled');
                if (testBtn) testBtn.style.display = 'none';
                if (infoBox) {
                    infoBox.classList.add('show', 'warning');
                    if (infoText) infoText.textContent = 'Push hazitumiki kwenye browser hii.';
                }
                return;
            }
            
            if (currentStatus.permission === 'denied') {
                if (statusText) {
                    statusText.textContent = 'Zimezuiwa kwenye browser';
                    statusText.style.color = '#ef4444';
                }
                toggle.classList.remove('active');
                toggle.classList.add('disabled');
                if (wrapper) wrapper.classList.remove('enabled');
                if (testBtn) testBtn.style.display = 'none';
                if (infoBox) {
                    infoBox.classList.add('show', 'error');
                    if (infoText) infoText.textContent = 'Ruhusu notifications kwenye browser settings, kisha refresh ukurasa.';
                }
                return;
            }
            
            if (currentStatus.subscribed) {
                if (statusText) {
                    statusText.textContent = 'Zimewashwa ✓';
                    statusText.style.color = '#10b981';
                }
                toggle.classList.add('active');
                toggle.classList.remove('disabled');
                if (wrapper) wrapper.classList.add('enabled');
                if (testBtn) testBtn.style.display = 'flex';
                if (infoBox) infoBox.classList.remove('show');
            } else {
                if (statusText) {
                    statusText.textContent = 'Zimezimwa';
                    statusText.style.color = '#94a3b8';
                }
                toggle.classList.remove('active');
                toggle.classList.remove('disabled');
                if (wrapper) wrapper.classList.remove('enabled');
                if (testBtn) testBtn.style.display = 'none';
                if (infoBox) infoBox.classList.remove('show');
            }
        }
        
        updateUI();
        
        // Toggle click
        toggle.addEventListener('click', async function() {
            if (this.classList.contains('disabled') || this.classList.contains('loading')) return;
            
            const isActive = this.classList.contains('active');
            
            if (isActive) {
                // Unsubscribe
                showConfirm(
                    'Zima Notifications?',
                    'Hutapata push notifications kwenye device hii.',
                    'warning',
                    async () => {
                        this.classList.add('loading');
                        const result = await unsubscribeOwnerFromPush(owner.id);
                        this.classList.remove('loading');
                        
                        if (result.success) {
                            currentStatus.subscribed = false;
                            updateUI();
                            showToast('Notifications zimezimwa', 'warning');
                        } else {
                            showToast('Imeshindikana: ' + result.error, 'error');
                        }
                    }
                );
            } else {
                // Subscribe
                this.classList.add('loading');
                
                const result = await subscribeOwnerToPush(owner.id);
                
                this.classList.remove('loading');
                
                if (result.success) {
                    currentStatus.subscribed = true;
                    currentStatus.permission = 'granted';
                    updateUI();
                    showToast('Notifications zimewashwa!', 'success');
                } else {
                    showToast('Imeshindikana: ' + result.error, 'error');
                    updateUI();
                }
            }
        });
        
        // Test button
        if (testBtn) {
            testBtn.addEventListener('click', async function() {
                this.disabled = true;
                const originalHtml = this.innerHTML;
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Inatuma...';
                
                const result = await sendTestPushToSelf(owner.id);
                
                if (result.success) {
                    showToast('Test notification imetumwa! Angalia simu 🔔', 'success');
                } else {
                    showToast('Imeshindikana: ' + result.error, 'error');
                }
                
                this.disabled = false;
                this.innerHTML = originalHtml;
            });
        }
    }

    // ============================================
    // GLOBAL UI HELPERS (Confirm + Toast)
    // ============================================
    
    // Show confirm modal (global helper)
    function showConfirm(title, message, type, callback) {
        // Futa ya zamani
        const existing = document.getElementById('ownerConfirmModal');
        if (existing) existing.remove();
        
        const modal = document.createElement('div');
        modal.id = 'ownerConfirmModal';
        modal.className = 'owner-confirm-modal active';
        
        const isDanger = type === 'danger' || type === 'warning';
        
        modal.innerHTML = `
            <div class="owner-confirm-content">
                <div class="owner-confirm-icon ${isDanger ? 'danger' : ''}">
                    <i class="fas fa-${isDanger ? 'exclamation-triangle' : 'question-circle'}"></i>
                </div>
                <h3>${title}</h3>
                <p>${message}</p>
                <div class="owner-confirm-actions">
                    <button class="owner-confirm-btn cancel" id="ownerConfirmCancel">Ghairi</button>
                    <button class="owner-confirm-btn confirm ${isDanger ? 'danger' : ''}" id="ownerConfirmOk">Ndio</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const cancelBtn = document.getElementById('ownerConfirmCancel');
        const okBtn = document.getElementById('ownerConfirmOk');
        
        function close() {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        }
        
        cancelBtn.addEventListener('click', close);
        okBtn.addEventListener('click', () => {
            close();
            if (callback) setTimeout(callback, 100);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) close();
        });
    }

    // Show toast (global helper)
    function showToast(message, type = 'success') {
        // Futa ya zamani
        const existing = document.querySelector('.owner-toast.show');
        if (existing) existing.remove();
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        const toast = document.createElement('div');
        toast.className = 'owner-toast ' + type;
        toast.innerHTML = `<i class="fas ${icons[type] || icons.success}"></i> <span>${message}</span>`;
        
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 50);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 3500);
    }

    // ============================================
    // EXPORT GLOBAL
    // ============================================
    window.subscribeOwnerToPush = subscribeOwnerToPush;
    window.unsubscribeOwnerFromPush = unsubscribeOwnerFromPush;
    window.checkOwnerPushStatus = checkOwnerPushStatus;
    window.sendOwnerPush = sendOwnerPush;
    window.sendTestPushToSelf = sendTestPushToSelf;
    window.notifyUsers = notifyUsers;
    window.autoSubscribeOwner = autoSubscribeOwner;
    window.initOwnerPushToggle = initOwnerPushToggle;
    window.isPushSupported = isPushSupported;
    
    // Global UI helpers (kama hazipo kwenye HTML)
    if (typeof window.showToast !== 'function') {
        window.showToast = showToast;
    }
    if (typeof window.showConfirm !== 'function') {
        window.showConfirm = showConfirm;
    }

    // ============================================
    // AUTO-INIT
    // ============================================
    function ready(fn) {
        if (document.readyState !== 'loading') {
            fn();
        } else {
            document.addEventListener('DOMContentLoaded', fn);
        }
    }

    ready(() => {
        injectPushCSS();
        console.log('✅ OWNER_PUSH v4.0 ready');
    });

    console.log('✅ OWNER_PUSH_NOTIFICATIONS v4.0 loaded (with CSS)');
    console.log('   • subscribeOwnerToPush()');
    console.log('   • unsubscribeOwnerFromPush()');
    console.log('   • checkOwnerPushStatus()');
    console.log('   • sendOwnerPush()');
    console.log('   • sendTestPushToSelf()');
    console.log('   • notifyUsers()');
    console.log('   • autoSubscribeOwner()');
    console.log('   • initOwnerPushToggle()');
    console.log('   • showConfirm() [global]');
    console.log('   • showToast() [global if not defined]');

})();