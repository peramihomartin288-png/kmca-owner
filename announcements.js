// ============================================
// KMCA OWNER - ANNOUNCEMENTS MANAGEMENT
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const owner = requireOwnerAuth();
    if (!owner) return;
    
    loadAnnouncements();
    setupEvents(owner);
});

// ========== LOAD ANNOUNCEMENTS ==========
async function loadAnnouncements() {
    try {
        const { data, error } = await supabaseClient
            .from('announcements')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const list = document.getElementById('announcementsList');
        list.innerHTML = '';
        
        if (!data || data.length === 0) {
            list.innerHTML = '<p class="no-data">Hakuna matangazo bado</p>';
            return;
        }
        
        data.forEach(function(announcement) {
            const item = document.createElement('div');
            item.style.cssText = 'padding: 15px; border-bottom: 1px solid #334155;';
            
            item.innerHTML = '<div style="display: flex; justify-content: space-between; align-items: flex-start;">' +
                '<div style="flex: 1;">' +
                '<strong style="color: #d4af37;">' + announcement.title + '</strong>' +
                '<p style="color: #cbd5e1; font-size: 14px; margin: 5px 0;">' + announcement.content + '</p>' +
                '<span style="color: #94a3b8; font-size: 12px;">' + formatDate(announcement.created_at) + '</span>' +
                '</div>' +
                '<button type="button" class="btn-delete-announcement" data-id="' + announcement.id + '" style="background: #ef4444; color: #fff; border: none; padding: 8px; border-radius: 5px; cursor: pointer;"><i class="fas fa-trash"></i></button>' +
                '</div>';
            
            list.appendChild(item);
        });
        
        document.querySelectorAll('.btn-delete-announcement').forEach(function(btn) {
            btn.addEventListener('click', async function() {
                if (confirm('Futa tangazo hili?')) {
                    await supabaseClient.from('announcements').delete().eq('id', this.getAttribute('data-id'));
                    loadAnnouncements();
                }
            });
        });
    } catch (e) {
        document.getElementById('announcementsList').innerHTML = '<p class="no-data">Imeshindikana kupakia matangazo</p>';
    }
}

// ========== LOAD USERS FOR CHECKBOX ==========
async function loadUsersForCheckbox() {
    try {
        const { data: users } = await supabaseClient
            .from('users')
            .select('id, jina, phone')
            .order('jina', { ascending: true });
        
        const list = document.getElementById('usersCheckboxList');
        list.innerHTML = '';
        
        if (users && users.length > 0) {
            users.forEach(function(user) {
                const label = document.createElement('label');
                label.style.cssText = 'display: flex; align-items: center; gap: 10px; padding: 8px; cursor: pointer; color: #cbd5e1;';
                
                label.innerHTML = '<input type="checkbox" class="user-checkbox" value="' + user.id + '">' +
                    '<span>' + user.jina + ' (' + user.phone + ')</span>';
                
                list.appendChild(label);
            });
        } else {
            list.innerHTML = '<p class="no-data">Hakuna users</p>';
        }
    } catch (e) {}
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
    
    document.getElementById('addAnnouncementBtn').addEventListener('click', function() {
        document.getElementById('addAnnouncementModal').style.display = 'flex';
    });
    
    document.getElementById('addAnnouncementClose').addEventListener('click', function() {
        document.getElementById('addAnnouncementModal').style.display = 'none';
    });
    
    document.getElementById('announcementTarget').addEventListener('change', function() {
        if (this.value === 'selected') {
            document.getElementById('selectedUsersGroup').style.display = 'block';
            loadUsersForCheckbox();
        } else {
            document.getElementById('selectedUsersGroup').style.display = 'none';
        }
    });
    
    document.getElementById('addAnnouncementForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const title = document.getElementById('announcementTitle').value.trim();
        const content = document.getElementById('announcementContent').value.trim();
        const target = document.getElementById('announcementTarget').value;
        
        if (!title || !content || !target) {
            alert('Jaza vipengele vyote');
            return;
        }
        
        try {
            await supabaseClient.from('announcements').insert([{
                title: title,
                content: content
            }]);
            
            if (target === 'all') {
                const { data: users } = await supabaseClient.from('users').select('id');
                
                for (const user of users) {
                    await supabaseClient.from('notifications').insert([{
                        title: title,
                        content: content,
                        type: 'announcement',
                        is_read: false
                    }]);
                }
                
                alert('Tangazo limetumwa kwa users wote!');
            } else {
                const selectedUsers = document.querySelectorAll('.user-checkbox:checked');
                
                for (const checkbox of selectedUsers) {
                    await supabaseClient.from('notifications').insert([{
                        title: title,
                        content: content,
                        type: 'announcement',
                        is_read: false
                    }]);
                }
                
                alert('Tangazo limetumwa kwa users ' + selectedUsers.length + '!');
            }
            
            document.getElementById('addAnnouncementModal').style.display = 'none';
            document.getElementById('addAnnouncementForm').reset();
            loadAnnouncements();
        } catch (error) {
            alert('Imeshindikana: ' + error.message);
        }
    });
    
    document.querySelectorAll('.sidebar-item').forEach(function(item) {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            if (page === 'announcements') return;
            window.location.href = page + '.html';
        });
    });
    
    document.querySelectorAll('.bottom-nav-item').forEach(function(item) {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            if (page === 'announcements') return;
            window.location.href = page + '.html';
        });
    });
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('sw-TZ', { day: 'numeric', month: 'short', year: 'numeric' });
}