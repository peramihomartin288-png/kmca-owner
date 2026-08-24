// ============================================
// KMCA OWNER - PWA MANAGEMENT
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const owner = requireOwnerAuth();
    if (!owner) return;
    
    loadPwaStats();
    loadPwaUsers();
    setupEvents(owner);
});

// ========== LOAD PWA STATS ==========
async function loadPwaStats() {
    try {
        const { data, error } = await supabaseClient
            .from('pwa_downloads')
            .select('*');
        
        if (error) throw error;
        
        const total = data.length;
        const android = data.filter(function(item) { return item.device_type === 'android'; }).length;
        const ios = data.filter(function(item) { return item.device_type === 'ios'; }).length;
        const desktop = data.filter(function(item) { return item.device_type === 'desktop'; }).length;
        
        document.getElementById('totalInstalls').textContent = total;
        document.getElementById('androidCount').textContent = android;
        document.getElementById('iosCount').textContent = ios;
        document.getElementById('desktopCount').textContent = desktop;
    } catch (e) {}
}

// ========== LOAD PWA USERS ==========
async function loadPwaUsers() {
    try {
        const { data, error } = await supabaseClient
            .from('pwa_downloads')
            .select('*, users(jina, phone)')
            .order('installed_at', { ascending: false });
        
        if (error) throw error;
        
        const list = document.getElementById('pwaUsersList');
        list.innerHTML = '';
        
        if (!data || data.length === 0) {
            list.innerHTML = '<p class="no-data">Hakuna users walio install PWA bado</p>';
            return;
        }
        
        data.forEach(function(item) {
            const div = document.createElement('div');
            div.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 15px; border-bottom: 1px solid #334155;';
            
            const userName = item.users ? item.users.jina : 'Unknown';
            const userPhone = item.users ? item.users.phone : 'N/A';
            
            div.innerHTML = '<div>' +
                '<strong style="color: #d4af37;">' + userName + '</strong>' +
                '<p style="color: #94a3b8; font-size: 12px;">' + userPhone + ' | ' + item.device_type + ' | ' + formatDate(item.installed_at) + '</p>' +
                '</div>' +
                '<span style="color: #10b981;">✓ Installed</span>';
            
            list.appendChild(div);
        });
    } catch (e) {
        document.getElementById('pwaUsersList').innerHTML = '<p class="no-data">Imeshindikana kupakia users</p>';
    }
}

// ========== SETUP EVENTS ==========
function setupEvents(owner) {
    document.getElementById('menuToggle').addEventListener('click', function() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('open');
    });
    
    document.getElementById('logoutBtn').addEventListener('click', function() {
        logoutOwner();
    });
    
    document.getElementById('updatePwaForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const version = document.getElementById('pwaVersion').value.trim();
        const message = document.getElementById('pwaUpdateMessage').value.trim();
        
        if (!version || !message) {
            alert('Jaza vipengele vyote');
            return;
        }
        
        try {
            await supabaseClient.from('pwa_updates').insert([{
                version: version,
                update_message: message
            }]);
            
            const { data: users } = await supabaseClient.from('users').select('id');
            
            for (const user of users) {
                await supabaseClient.from('notifications').insert([{
                    title: 'Toleo Jipya ' + version,
                    content: message,
                    type: 'pwa_update',
                    is_read: false
                }]);
            }
            
            alert('Update imetumwa kwa users wote!');
            document.getElementById('updatePwaForm').reset();
        } catch (error) {
            alert('Imeshindikana: ' + error.message);
        }
    });
    
    document.querySelectorAll('.sidebar-item').forEach(function(item) {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            if (page === 'pwa-management') return;
            window.location.href = page + '.html';
        });
    });
    
    document.querySelectorAll('.bottom-nav-item').forEach(function(item) {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            if (page === 'pwa-management') return;
            window.location.href = page + '.html';
        });
    });
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('sw-TZ', { day: 'numeric', month: 'short', year: 'numeric' });
}