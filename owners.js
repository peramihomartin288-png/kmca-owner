// ============================================
// KMCA OWNER - OWNERS MANAGEMENT
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const owner = requireOwnerAuth();
    if (!owner) return;
    
    if (!owner.is_super_admin) {
        alert('Huna ruhusa ya kusimamia owners');
        window.location.href = 'dashboard.html';
        return;
    }
    
    loadOwners();
    setupEvents(owner);
});

// ========== LOAD OWNERS ==========
async function loadOwners() {
    try {
        const { data, error } = await supabaseClient
            .from('owners')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const list = document.getElementById('ownersList');
        list.innerHTML = '';
        
        if (!data || data.length === 0) {
            list.innerHTML = '<p class="no-data">Hakuna owners bado</p>';
            return;
        }
        
        for (const owner of data) {
            const { data: sessions } = await supabaseClient
                .from('owner_sessions')
                .select('session_type')
                .eq('owner_id', owner.id);
            
            const item = document.createElement('div');
            item.style.cssText = 'padding: 15px; border-bottom: 1px solid #334155;';
            
            const sessionsText = sessions ? sessions.map(function(s) { 
                return SESSION_LABELS[s.session_type] || s.session_type; 
            }).join(', ') : 'No sessions';
            
            item.innerHTML = '<div style="display: flex; justify-content: space-between; align-items: flex-start;">' +
                '<div style="flex: 1;">' +
                '<strong style="color: #d4af37;">' + owner.jina + (owner.is_super_admin ? ' 👑' : '') + '</strong>' +
                '<p style="color: #94a3b8; font-size: 12px;">' + (owner.phone || 'No phone') + ' | PIN: ' + owner.pin + '</p>' +
                '<p style="color: #94a3b8; font-size: 11px;">' + sessionsText + '</p>' +
                '</div>' +
                (owner.is_super_admin ? '' : 
                '<div style="display: flex; gap: 5px;">' +
                '<button type="button" class="btn-reset-pin" data-owner-id="' + owner.id + '" data-owner-name="' + owner.jina + '" style="background: #2563eb; color: #fff; border: none; padding: 8px; border-radius: 5px; cursor: pointer;"><i class="fas fa-key"></i></button>' +
                '<button type="button" class="btn-delete-owner" data-owner-id="' + owner.id + '" data-owner-name="' + owner.jina + '" style="background: #ef4444; color: #fff; border: none; padding: 8px; border-radius: 5px; cursor: pointer;"><i class="fas fa-trash"></i></button>' +
                '</div>') +
                '</div>';
            
            list.appendChild(item);
        }
        
        // Reset PIN
        document.querySelectorAll('.btn-reset-pin').forEach(function(btn) {
            btn.addEventListener('click', function() {
                const ownerId = this.getAttribute('data-owner-id');
                const ownerName = this.getAttribute('data-owner-name');
                
                const newPin = prompt('Weka PIN mpya kwa ' + ownerName + ':');
                
                if (newPin && newPin.length === 4) {
                    supabaseClient.from('owners').update({ pin: newPin }).eq('id', ownerId).then(function() {
                        alert('PIN imebadilishwa!');
                        loadOwners();
                    });
                }
            });
        });
        
        // Delete owner
        document.querySelectorAll('.btn-delete-owner').forEach(function(btn) {
            btn.addEventListener('click', async function() {
                if (confirm('Futa owner ' + this.getAttribute('data-owner-name') + '?')) {
                    await supabaseClient.from('owners').delete().eq('id', this.getAttribute('data-owner-id'));
                    loadOwners();
                }
            });
        });
    } catch (e) {
        document.getElementById('ownersList').innerHTML = '<p class="no-data">Imeshindikana kupakia owners</p>';
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
    
    document.getElementById('addOwnerBtn').addEventListener('click', function() {
        document.getElementById('addOwnerModal').style.display = 'flex';
    });
    
    document.getElementById('addOwnerClose').addEventListener('click', function() {
        document.getElementById('addOwnerModal').style.display = 'none';
    });
    
    document.getElementById('addOwnerForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const jina = document.getElementById('ownerName').value.trim();
        const phone = document.getElementById('ownerPhone').value.trim();
        const pin = document.getElementById('ownerPin').value.trim();
        
        if (!jina || !phone || !pin || pin.length !== 4) {
            alert('Jaza vipengele vyote (PIN iwe na namba 4)');
            return;
        }
        
        try {
            const { data: newOwner, error } = await supabaseClient
                .from('owners')
                .insert([{
                    jina: jina,
                    phone: phone,
                    pin: pin,
                    is_super_admin: false
                }])
                .select();
            
            if (error) throw error;
            
            const ownerId = newOwner[0].id;
            
            // Add sessions
            const sessions = [];
            document.querySelectorAll('#addOwnerForm input[type="checkbox"]:checked').forEach(function(checkbox) {
                sessions.push(checkbox.value);
            });
            
            for (const session of sessions) {
                await supabaseClient.from('owner_sessions').insert([{
                    owner_id: ownerId,
                    session_type: session
                }]);
            }
            
            alert('Owner ameongezwa!');
            document.getElementById('addOwnerModal').style.display = 'none';
            document.getElementById('addOwnerForm').reset();
            loadOwners();
        } catch (error) {
            alert('Imeshindikana: ' + error.message);
        }
    });
    
    document.querySelectorAll('.sidebar-item').forEach(function(item) {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            if (page === 'owners') return;
            window.location.href = page + '.html';
        });
    });
    
    document.querySelectorAll('.bottom-nav-item').forEach(function(item) {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            if (page === 'owners') return;
            window.location.href = page + '.html';
        });
    });
}