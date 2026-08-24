// ============================================
// KMCA OWNER - SERVICE WORKER REGISTRATION
// ============================================

function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    if (window.location.protocol === 'file:') return;
    
    navigator.serviceWorker.register('service-worker.js')
        .then(function(registration) {
            console.log('Service Worker registered:', registration.scope);
            
            if ('Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission();
            }
        })
        .catch(function(error) {
            console.log('SW registration failed:', error);
        });
}

document.addEventListener('DOMContentLoaded', function() {
    registerServiceWorker();
});