// ============================================================
// KMCA OWNER — SERVICE WORKER REGISTRATION
// Version: 4.0
// Register + Install Prompt + Auto-Update
// ============================================================

// ============================================
// SERVICE WORKER REGISTRATION
// ============================================
let swRegistration = null;

function registerOwnerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
        console.log('❌ SW not supported');
        return;
    }
    
    if (window.location.protocol === 'file:') {
        console.log('⚠️ SW requires HTTPS');
        return;
    }
    
    navigator.serviceWorker.register('./service-worker.js')
        .then(registration => {
            console.log('✅ SW registered:', registration.scope);
            swRegistration = registration;
            
            // Auto-update check kila dakika 30
            setInterval(() => {
                registration.update().catch(() => {});
            }, 30 * 60 * 1000);
            
            // Check update mara moja
            registration.update().catch(() => {});
            
            // Listen kwa update
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        showUpdateNotification();
                    }
                });
            });
        })
        .catch(error => {
            console.error('❌ SW registration failed:', error);
        });
    
    // Reload on controller change
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        console.log('🔄 Controller changed');
        window.location.reload();
    });
}

// ============================================
// UPDATE NOTIFICATION
// ============================================
function showUpdateNotification() {
    if (document.getElementById('swUpdateToast')) return;
    
    const toast = document.createElement('div');
    toast.id = 'swUpdateToast';
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        padding: 14px 20px;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 600;
        z-index: 999999;
        box-shadow: 0 10px 40px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        gap: 12px;
        max-width: 90%;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        font-family: -apple-system, sans-serif;
    `;
    
    toast.innerHTML = `
        <i class="fas fa-sync-alt" style="animation: spin 1s linear infinite;"></i>
        <div style="flex: 1;">
            <div style="font-weight: 800;">Update Mpya!</div>
            <div style="font-size: 12px; opacity: 0.9;">Bonyeza ku-update</div>
        </div>
        <button id="swUpdateBtn" style="
            background: white;
            color: #10b981;
            border: none;
            border-radius: 8px;
            padding: 8px 14px;
            font-weight: 700;
            cursor: pointer;
            font-size: 13px;
        ">Update</button>
    `;
    
    if (!document.getElementById('swSpinStyle')) {
        const style = document.createElement('style');
        style.id = 'swSpinStyle';
        style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
        document.head.appendChild(style);
    }
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.transform = 'translateX(-50%) translateY(0)';
    }, 100);
    
    document.getElementById('swUpdateBtn').addEventListener('click', function() {
        if (swRegistration && swRegistration.waiting) {
            swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        setTimeout(() => window.location.reload(), 500);
    });
    
    // Auto-dismiss
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.transform = 'translateX(-50%) translateY(100px)';
            setTimeout(() => toast.remove(), 300);
        }
    }, 15000);
}

// ============================================
// PWA INSTALL PROMPT
// ============================================
let deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    window.deferredInstallPrompt = event;
    console.log('✅ Install prompt captured');
});

window.addEventListener('appinstalled', () => {
    localStorage.setItem('kmca_owner_pwa_installed', '1');
    deferredInstallPrompt = null;
    window.deferredInstallPrompt = null;
    console.log('✅ PWA installed');
});

// ============================================
// CHECK KAMA PWA IMESAKINISHWA
// ============================================
function isOwnerPwaInstalled() {
    return localStorage.getItem('kmca_owner_pwa_installed') === '1' ||
           window.matchMedia('(display-mode: standalone)').matches;
}

// ============================================
// SHOW INSTALL PROMPT
// ============================================
function showOwnerInstallPrompt() {
    if (isOwnerPwaInstalled()) return false;
    if (!deferredInstallPrompt) return false;
    
    return true;
}

// ============================================
// TRIGGER INSTALL
// ============================================
async function triggerOwnerInstall() {
    if (!deferredInstallPrompt) return { success: false, error: 'No prompt available' };
    
    try {
        deferredInstallPrompt.prompt();
        const choice = await deferredInstallPrompt.userChoice;
        
        deferredInstallPrompt = null;
        window.deferredInstallPrompt = null;
        
        if (choice.outcome === 'accepted') {
            localStorage.setItem('kmca_owner_pwa_installed', '1');
            return { success: true, outcome: 'accepted' };
        } else {
            // Track declined count
            const declined = parseInt(localStorage.getItem('kmca_owner_pwa_declined_count') || '0', 10);
            localStorage.setItem('kmca_owner_pwa_declined_count', String(declined + 1));
            return { success: true, outcome: 'declined' };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ============================================
// CLEAR CACHE (Helper)
// ============================================
function clearOwnerCache() {
    if (!navigator.serviceWorker.controller) return;
    
    navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
}

// ============================================
// FORCE REFRESH (Helper)
// ============================================
function forceOwnerRefresh() {
    if (!navigator.serviceWorker.controller) {
        window.location.reload();
        return;
    }
    
    navigator.serviceWorker.controller.postMessage({ type: 'FORCE_REFRESH' });
}

// ============================================
// AUTO-INIT
// ============================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', registerOwnerServiceWorker);
} else {
    registerOwnerServiceWorker();
}

// ============================================
// EXPORT GLOBAL
// ============================================
window.isOwnerPwaInstalled = isOwnerPwaInstalled;
window.showOwnerInstallPrompt = showOwnerInstallPrompt;
window.triggerOwnerInstall = triggerOwnerInstall;
window.clearOwnerCache = clearOwnerCache;
window.forceOwnerRefresh = forceOwnerRefresh;
window.showUpdateNotification = showUpdateNotification;

console.log('✅ SERVICE_WORKER_REGISTER loaded');