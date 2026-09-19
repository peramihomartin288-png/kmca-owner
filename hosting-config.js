// ============================================================
// KMCA OWNER PANEL — HOSTING CONFIG
// Version: 4.0
// ============================================================

window.HOSTING_CONFIG = {
    
    // ============================================
    // SUPABASE
    // ============================================
    supabase: {
        url: 'https://ctzdiiyzoocxmlmeagtt.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0emRpaXl6b29jeG1sbWVhZ3R0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxMjI1NTEsImV4cCI6MjEwMjY5ODU1MX0.Jy_T5XaI5CI4qfFVH7b53MDCurR2olh0a6Tx9BzDOGw'
    },
    
    // ============================================
    // VAPID (Push Notifications)
    // ============================================
    vapid: {
        publicKey: 'BKNmfI7QOo1GE2kXwHIUHPTEMoKFNF2FjKWE5-9Wes7YYgmuEF8eYmzp4YscPtyVbg0So4j3wpeMvBsQm1hyVrw'
    },
    
    // ============================================
    // CLOUDINARY — 4 Accounts
    // ============================================
    cloudinary: {
        // 📷 PRIMARY IMAGE — Kmca 2
        image: {
            name: 'Kmca 2',
            cloudName: 'fuik0cav',
            uploadPreset: 'Kwaya ya kmca',
            folder: 'Kmca/Images'
        },
        
        // 🎥 PRIMARY VIDEO — Old
        video: {
            name: 'Old',
            cloudName: 'pv88ocpt',
            uploadPreset: 'kmca_preset',
            folder: 'Videos'
        },
        
        // 🚨 EMERGENCY — 2 accounts
        emergency: [
            {
                name: 'Kmca 5',
                cloudName: 'evxn8kjr',
                uploadPreset: 'kwaya ya vijana mombo',
                folder: 'Emergency'
            },
            {
                name: 'kmca',
                cloudName: 'bnq4lifd',
                uploadPreset: 'kwaya ya vijana',
                folder: 'Emergency'
            }
        ],
        
        // Limits (kwa hosting monitor)
        limits: {
            videoGB: 25,
            imageGB: 25,
            emergencyGB: 50,
            totalGB: 100
        }
    },
    
    // ============================================
    // UPLOADCARE — Audio + Files
    // ============================================
    uploadcare: {
        publicKey: 'b69fa8f92a2bd382c0b4',
        cdnBase: 'https://ucarecdn.com/'
    },
    
    // ============================================
    // APP INFO
    // ============================================
    app: {
        name: 'KMCA Owner',
        version: '2.0.0',
        buildDate: '2026-09-17'
    },
    
    // ============================================
    // SESSION
    // ============================================
    session: {
        timeoutMs: 5 * 60 * 1000,        // Dakika 5
        rateLimit: {
            maxAttempts: 5,
            windowMs: 5 * 60 * 1000      // Dakika 5
        }
    },
    
    // ============================================
    // FILE UPLOAD LIMITS
    // ============================================
    limits: {
        image: 25 * 1024 * 1024,         // 25 MB
        video: 500 * 1024 * 1024,        // 500 MB
        audio: 100 * 1024 * 1024,        // 100 MB
        file: 50 * 1024 * 1024           // 50 MB
    },
    
    // ============================================
    // ROUTING — File type → Upload target
    // ============================================
    routing: {
        'image/jpeg': 'cloudinary.image',
        'image/png': 'cloudinary.image',
        'image/webp': 'cloudinary.image',
        'image/gif': 'cloudinary.image',
        'image/svg+xml': 'cloudinary.image',
        'video/mp4': 'cloudinary.video',
        'video/webm': 'cloudinary.video',
        'video/quicktime': 'cloudinary.video',
        'audio/mpeg': 'uploadcare',
        'audio/mp3': 'uploadcare',
        'audio/wav': 'uploadcare',
        'audio/mp4': 'uploadcare',
        'audio/aac': 'uploadcare',
        'audio/ogg': 'uploadcare',
        'application/pdf': 'uploadcare',
        'application/msword': 'uploadcare',
        'application/zip': 'uploadcare'
    }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

// Shortcut kwa Supabase config
window.getSupabaseConfig = function() {
    return window.HOSTING_CONFIG.supabase;
};

// Shortcut kwa VAPID key
window.getVapidKey = function() {
    return window.HOSTING_CONFIG.vapid.publicKey;
};

// Format bytes kwa display
window.formatBytes = function(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

console.log('✅ HOSTING_CONFIG v' + window.HOSTING_CONFIG.app.version + ' loaded');