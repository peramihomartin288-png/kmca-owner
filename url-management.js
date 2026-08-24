// ============================================
// KMCA OWNER - URL MANAGEMENT
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const owner = requireOwnerAuth();
    if (!owner) return;
    
    loadUrls();
    setupEvents(owner);
});

// ========== LOAD URLS ==========
async function loadUrls() {
    try {
        const { data, error } = await supabaseClient
            .from('posts')
            .select('id, title, type, media_files, link_file, created_at')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const list = document.getElementById('urlsList');
        list.innerHTML = '';
        
        let totalUrls = 0;
        let liveUrls = 0;
        let expiredUrls = 0;
        
        if (!data || data.length === 0) {
            list.innerHTML = '<p class="no-data">Hakuna URLs bado</p>';
            document.getElementById('totalUrls').textContent = '0';
            document.getElementById('liveUrls').textContent = '0';
            document.getElementById('expiredUrls').textContent = '0';
            return;
        }
        
        data.forEach(function(post) {
            const urls = post.media_files || [];
            const linkUrl = post.link_file;
            
            urls.forEach(function(url) {
                totalUrls++;
                
                const isLive = post.type === 'live_video' || post.type === 'auto_fake_live_video';
                if (isLive) liveUrls++;
                
                const item = document.createElement('div');
                item.style.cssText = 'padding: 15px; border-bottom: 1px solid #334155;';
                
                item.innerHTML = '<div style="display: flex; justify-content: space-between; align-items: flex-start;">' +
                    '<div style="flex: 1; overflow: hidden;">' +
                    '<strong style="color: #d4af37;">' + post.title + '</strong>' +
                    '<p style="color: #94a3b8; font-size: 12px; word-break: break-all;">' + url + '</p>' +
                    '<p style="color: #94a3b8; font-size: 11px;">Type: ' + post.type + ' | ' + formatDate(post.created_at) + '</p>' +
                    (isLive ? '<span style="background: rgba(239, 68, 68, 0.2); color: #ef4444; padding: 3px 10px; border-radius: 15px; font-size: 11px;">🔴 LIVE</span>' : '') +
                    '</div>' +
                    '<button type="button" class="btn-delete-url" data-post-id="' + post.id + '" style="background: #ef4444; color: #fff; border: none; padding: 8px; border-radius: 5px; cursor: pointer;"><i class="fas fa-trash"></i></button>' +
                    '</div>';
                
                list.appendChild(item);
            });
            
            if (linkUrl) {
                totalUrls++;
                
                const item = document.createElement('div');
                item.style.cssText = 'padding: 15px; border-bottom: 1px solid #334155;';
                
                item.innerHTML = '<div style="display: flex; justify-content: space-between; align-items: flex-start;">' +
                    '<div style="flex: 1; overflow: hidden;">' +
                    '<strong style="color: #d4af37;">' + post.title + '</strong>' +
                    '<p style="color: #94a3b8; font-size: 12px; word-break: break-all;">' + linkUrl + '</p>' +
                    '<p style="color: #94a3b8; font-size: 11px;">Type: link | ' + formatDate(post.created_at) + '</p>' +
                    '</div>' +
                    '<button type="button" class="btn-delete-url" data-post-id="' + post.id + '" style="background: #ef4444; color: #fff; border: none; padding: 8px; border-radius: 5px; cursor: pointer;"><i class="fas fa-trash"></i></button>' +
                    '</div>';
                
                list.appendChild(item);
            }
        });
        
        document.getElementById('totalUrls').textContent = totalUrls;
        document.getElementById('liveUrls').textContent = liveUrls;
        document.getElementById('expiredUrls').textContent = expiredUrls;
        
        document.querySelectorAll('.btn-delete-url').forEach(function(btn) {
            btn.addEventListener('click', async function() {
                if (confirm('Futa post yenye URL hii?')) {
                    await supabaseClient.from('posts').delete().eq('id', this.getAttribute('data-post-id'));
                    loadUrls();
                }
            });
        });
    } catch (e) {
        document.getElementById('urlsList').innerHTML = '<p class="no-data">Imeshindikana kupakia URLs</p>';
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
    
    document.querySelectorAll('.sidebar-item').forEach(function(item) {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            if (page === 'url-management') return;
            window.location.href = page + '.html';
        });
    });
    
    document.querySelectorAll('.bottom-nav-item').forEach(function(item) {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            if (page === 'url-management') return;
            window.location.href = page + '.html';
        });
    });
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('sw-TZ', { day: 'numeric', month: 'short', year: 'numeric' });
}