// ============================================
// KMCA OWNER - EVENTS MANAGEMENT
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const owner = requireOwnerAuth();
    if (!owner) return;
    
    loadEvents();
    setupEvents(owner);
});

// ========== LOAD EVENTS ==========
async function loadEvents() {
    try {
        const { data, error } = await supabaseClient
            .from('matukio')
            .select('*')
            .order('tarehe_tukio', { ascending: true });
        
        if (error) throw error;
        
        const list = document.getElementById('eventsList');
        list.innerHTML = '';
        
        if (!data || data.length === 0) {
            list.innerHTML = '<p class="no-data">Hakuna matukio bado</p>';
            return;
        }
        
        data.forEach(function(event) {
            const item = document.createElement('div');
            item.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 15px; border-bottom: 1px solid #334155;';
            
            item.innerHTML = '<div style="flex: 1;">' +
                '<strong style="color: #d4af37;">' + event.jina + '</strong>' +
                '<p style="color: #94a3b8; font-size: 12px;">' + 
                'Send: ' + formatDate(event.tarehe_send) + ' | Tukio: ' + formatDate(event.tarehe_tukio) + ' | Futa: ' + formatDate(event.tarehe_delete) + 
                '</p>' +
                (event.mahali ? '<p style="color: #94a3b8; font-size: 11px;">📍 ' + event.mahali + '</p>' : '') +
                '</div>' +
                '<button type="button" class="btn-delete-event" data-event-id="' + event.id + '" style="background: #ef4444; color: #fff; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer;"><i class="fas fa-trash"></i></button>';
            
            list.appendChild(item);
        });
        
        document.querySelectorAll('.btn-delete-event').forEach(function(btn) {
            btn.addEventListener('click', async function() {
                if (confirm('Futa tukio hili?')) {
                    await supabaseClient.from('matukio').delete().eq('id', this.getAttribute('data-event-id'));
                    loadEvents();
                }
            });
        });
    } catch (e) {
        document.getElementById('eventsList').innerHTML = '<p class="no-data">Imeshindikana kupakia matukio</p>';
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
    
    document.getElementById('addEventBtn').addEventListener('click', function() {
        document.getElementById('addEventModal').style.display = 'flex';
    });
    
    document.getElementById('addEventClose').addEventListener('click', function() {
        document.getElementById('addEventModal').style.display = 'none';
    });
    
    document.getElementById('addEventForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const jina = document.getElementById('eventJina').value.trim();
        const maelezo = document.getElementById('eventMaelezo').value.trim();
        const tareheSend = document.getElementById('eventTareheSend').value;
        const tareheTukio = document.getElementById('eventTareheTukio').value;
        const tareheDelete = document.getElementById('eventTareheDelete').value;
        const muda = document.getElementById('eventMuda').value;
        const mahali = document.getElementById('eventMahali').value.trim();
        
        if (!jina || !tareheSend || !tareheTukio || !tareheDelete) {
            alert('Jaza vipengele vyote vya lazima');
            return;
        }
        
        try {
            await supabaseClient.from('matukio').insert([{
                jina: jina,
                maelezo: maelezo || null,
                tarehe_send: tareheSend,
                tarehe_tukio: tareheTukio,
                tarehe_delete: tareheDelete,
                muda: muda || null,
                mahali: mahali || null
            }]);
            
            alert('Tukio limehifadhiwa!');
            document.getElementById('addEventModal').style.display = 'none';
            document.getElementById('addEventForm').reset();
            loadEvents();
        } catch (error) {
            alert('Imeshindikana: ' + error.message);
        }
    });
    
    document.querySelectorAll('.sidebar-item').forEach(function(item) {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            if (page === 'events') return;
            window.location.href = page + '.html';
        });
    });
    
    document.querySelectorAll('.bottom-nav-item').forEach(function(item) {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            if (page === 'events') return;
            window.location.href = page + '.html';
        });
    });
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('sw-TZ', { day: 'numeric', month: 'short', year: 'numeric' });
}