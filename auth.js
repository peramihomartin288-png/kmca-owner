// ============================================
// KMCA OWNER - AUTHENTICATION SYSTEM
// ============================================

function getCurrentOwner() {
    const ownerData = sessionStorage.getItem('kmca_owner');
    if (!ownerData) {
        const backup = localStorage.getItem('kmca_owner_backup');
        return backup ? JSON.parse(backup) : null;
    }
    return JSON.parse(ownerData);
}

function saveOwner(owner) {
    sessionStorage.setItem('kmca_owner', JSON.stringify(owner));
    localStorage.setItem('kmca_owner_backup', JSON.stringify(owner));
    localStorage.setItem('kmca_owner_backup_time', new Date().toISOString());
}

function clearOwner() {
    sessionStorage.removeItem('kmca_owner');
    localStorage.removeItem('kmca_owner_backup');
    localStorage.removeItem('kmca_owner_backup_time');
}

function saveOwnerPhone(phone) {
    sessionStorage.setItem('kmca_owner_phone', phone);
    localStorage.setItem('kmca_owner_phone_backup', phone);
}

function getSavedOwnerPhone() {
    return sessionStorage.getItem('kmca_owner_phone') || localStorage.getItem('kmca_owner_phone_backup');
}

function isSessionValid() {
    const lastActivity = localStorage.getItem('kmca_owner_backup_time');
    if (!lastActivity) return false;
    const diff = new Date().getTime() - new Date(lastActivity).getTime();
    return diff < 30 * 60 * 1000; // Updated: 30 minutes timeout
}

function updateLastActivity() {
    localStorage.setItem('kmca_owner_backup_time', new Date().toISOString());
}

function requireOwnerAuth() {
    const owner = getCurrentOwner();
    if (!owner) {
        window.location.href = 'index.html';
        return null;
    }
    updateLastActivity();
    return owner;
}

function logoutOwner() {
    clearOwner();
    window.location.href = 'index.html';
}

// Session Labels
const SESSION_LABELS = {
    'full_access': '👑 Full Access',
    'manage_posts': 'Posts Management',
    'manage_events': 'Events Management',
    'manage_polls': 'Polls Management',
    'manage_bible_verses': 'Bible Verses',
    'manage_watakatifu': 'Watakatifu',
    'manage_nyimbo': 'Nyimbo za Siku',
    'manage_masomo': 'Masomo ya Dominica',
    'manage_questions': 'Questions',
    'manage_users': 'Users Management',
    'manage_announcements': 'Announcements',
    'manage_ai_schedules': '🤖 AI Schedules',
    'manage_auto_play': '🎬 Auto-Play Video',
    'manage_media': 'Media Library',
    'manage_backup': 'Backup & Clean',
    'manage_urls': 'URL Management',
    'manage_pwa': 'PWA Management',
    'manage_owners': 'Owners Management',
    'manage_settings': 'Settings'
};

// Check if owner has session
async function hasSession(owner, sessionType) {
    if (owner.is_super_admin) return true;
    
    try {
        const { data: sessions } = await supabaseClient
            .from('owner_sessions')
            .select('session_type')
            .eq('owner_id', owner.id);
        
        return sessions && sessions.some(s => s.session_type === sessionType || s.session_type === 'full_access');
    } catch (e) {
        return false;
    }
}

// Login handler
document.addEventListener('DOMContentLoaded', function() {
    const owner = getCurrentOwner();
    const isLoginPage = window.location.pathname.includes('index.html');
    
    if (owner && isSessionValid()) {
        if (isLoginPage) window.location.href = 'welcome.html';
    }
    
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const pin = document.getElementById('pin').value.trim();
            const phone = document.getElementById('phone').value.trim();
            
            if (!pin) {
                alert('Tafadhali weka PIN');
                return;
            }
            
            const submitBtn = this.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Inaingia...';
            
            try {
                const savedPhone = getSavedOwnerPhone();
                
                // Try saved phone first
                if (savedPhone) {
                    const { data: ownerWithSavedPhone } = await supabaseClient
                        .from('owners')
                        .select('*')
                        .eq('phone', savedPhone)
                        .eq('pin', pin);
                    
                    if (ownerWithSavedPhone && ownerWithSavedPhone.length > 0) {
                        saveOwner(ownerWithSavedPhone[0]);
                        window.location.href = 'welcome.html';
                        return;
                    }
                }
                
                // Try super admin
                const { data: superAdmin } = await supabaseClient
                    .from('owners')
                    .select('*')
                    .eq('pin', pin)
                    .eq('is_super_admin', true);
                
                if (superAdmin && superAdmin.length > 0) {
                    saveOwner(superAdmin[0]);
                    window.location.href = 'welcome.html';
                    return;
                }
                
                // Show phone field if needed
                if (!savedPhone && !phone) {
                    document.getElementById('phoneGroup').style.display = 'block';
                    alert('Tafadhali weka namba ya simu');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Ingia';
                    return;
                }
                
                // Try with phone
                if (phone) {
                    const { data: ownerWithPhone } = await supabaseClient
                        .from('owners')
                        .select('*')
                        .eq('phone', phone)
                        .eq('pin', pin);
                    
                    if (ownerWithPhone && ownerWithPhone.length > 0) {
                        saveOwner(ownerWithPhone[0]);
                        saveOwnerPhone(phone);
                        window.location.href = 'welcome.html';
                        return;
                    }
                }
                
                alert('PIN au namba si sahihi');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Ingia';
            } catch (error) {
                alert('Imeshindikana kuingia');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Ingia';
            }
        });
    }
    
    // Forgot PIN
    const forgotBtn = document.getElementById('forgotPinBtn');
    if (forgotBtn) {
        forgotBtn.addEventListener('click', function() {
            document.getElementById('forgotPinModal').style.display = 'flex';
        });
    }
    
    const forgotClose = document.getElementById('forgotPinClose');
    if (forgotClose) {
        forgotClose.addEventListener('click', function() {
            document.getElementById('forgotPinModal').style.display = 'none';
        });
    }
    
    const showPinBtn = document.getElementById('showPinBtn');
    if (showPinBtn) {
        showPinBtn.addEventListener('click', async function() {
            const phone = document.getElementById('forgotPhone').value.trim();
            
            if (!phone) {
                alert('Weka namba ya simu');
                return;
            }
            
            const { data: owner } = await supabaseClient
                .from('owners')
                .select('pin, jina')
                .eq('phone', phone);
            
            if (owner && owner.length > 0) {
                document.getElementById('ownerNameDisplay').textContent = 'Jina: ' + owner[0].jina;
                document.getElementById('ownerPinDisplay').textContent = 'PIN: ' + owner[0].pin;
                document.getElementById('pinResult').style.display = 'block';
            } else {
                alert('Namba ya simu haipo');
            }
        });
    }
});