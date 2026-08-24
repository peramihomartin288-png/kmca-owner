// ============================================
// KMCA OWNER - USERS MANAGEMENT
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const owner = requireOwnerAuth();
    if (!owner) return;
    
    loadUsers();
    setupEvents(owner);
});

// ========== LOAD USERS ==========
async function loadUsers(searchTerm) {
    try {
        let query = supabaseClient
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (searchTerm) {
            query = query.or('jina.ilike.%' + searchTerm + '%,phone.ilike.%' + searchTerm + '%');
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        const list = document.getElementById('usersList');
        list.innerHTML = '';
        
        if (!data || data.length === 0) {
            list.innerHTML = '<p class="no-data">Hakuna users</p>';
            return;
        }
        
        for (const user of data) {
            const { count: pointsData } = await supabaseClient
                .from('user_points')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);
            
            const item = document.createElement('div');
            item.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 15px; border-bottom: 1px solid #334155;';
            
            const avatarText = generateAvatar(user.jina);
            
            item.innerHTML = '<div style="display: flex; align-items: center; gap: 12px; flex: 1;">' +
                '<div style="width: 40px; height: 40px; border-radius: 50%; background: #2563eb; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700;">' + avatarText + '</div>' +
                '<div><strong style="color: #d4af37;">' + user.jina + '</strong>' +
                '<p style="color: #94a3b8; font-size: 12px;">' + user.phone + ' | Points: ' + (pointsData || 0) + '</p></div></div>' +
                '<div style="display: flex; gap: 5px;">' +
                '<button type="button" class="btn-view-user" data-user-id="' + user.id + '" style="background: #2563eb; color: #fff; border: none; padding: 8px; border-radius: 5px; cursor: pointer;"><i class="fas fa-eye"></i></button>' +
                '<button type="button" class="btn-delete-user" data-user-id="' + user.id + '" data-user-name="' + user.jina + '" style="background: #ef4444; color: #fff; border: none; padding: 8px; border-radius: 5px; cursor: pointer;"><i class="fas fa-trash"></i></button>' +
                '</div>';
            
            list.appendChild(item);
        }
        
        // View user
        document.querySelectorAll('.btn-view-user').forEach(function(btn) {
            btn.addEventListener('click', function() {
                const userId = this.getAttribute('data-user-id');
                const user = data.find(function(u) { return u.id === userId; });
                
                if (user) {
                    alert('Jina: ' + user.jina + '\nPhone: ' + user.phone + '\nMiaka: ' + (user.miaka || 'N/A') + '\nParokia: ' + (user.parokia || 'N/A') + '\nJimbo: ' + (user.jimbo || 'N/A'));
                }
            });
        });
        
        // Delete user
        document.querySelectorAll('.btn-delete-user').forEach(function(btn) {
            btn.addEventListener('click', async function() {
                if (confirm('Futa user ' + this.getAttribute('data-user-name') + '?')) {
                    await supabaseClient.from('users').delete().eq('id', this.getAttribute('data-user-id'));
                    loadUsers();
                }
            });
        });
    } catch (e) {
        document.getElementById('usersList').innerHTML = '<p class="no-data">Imeshindikana kupakia users</p>';
    }
}

// ========== GENERATE AVATAR ==========
function generateAvatar(jina) {
    const names = jina.trim().split(/\s+/);
    if (names.length >= 2) return (names[0][0] + names[1][0]).toUpperCase();
    if (names.length === 1 && names[0].length >= 2) return names[0].substring(0, 2).toUpperCase();
    return '??';
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
    
    document.getElementById('searchInput').addEventListener('input', function() {
        loadUsers(this.value.trim());
    });
    
    document.querySelectorAll('.sidebar-item').forEach(function(item) {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            if (page === 'users') return;
            window.location.href = page + '.html';
        });
    });
    
    document.querySelectorAll('.bottom-nav-item').forEach(function(item) {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            if (page === 'users') return;
            window.location.href = page + '.html';
        });
    });
}