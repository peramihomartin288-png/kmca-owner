// ============================================
// KMCA OWNER - POLLS MANAGEMENT
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const owner = requireOwnerAuth();
    if (!owner) return;
    
    loadPolls();
    setupEvents(owner);
});

// ========== LOAD POLLS ==========
async function loadPolls() {
    try {
        const { data, error } = await supabaseClient
            .from('polls')
            .select('*')
            .order('tarehe_send', { ascending: true });
        
        if (error) throw error;
        
        const list = document.getElementById('pollsList');
        list.innerHTML = '';
        
        if (!data || data.length === 0) {
            list.innerHTML = '<p class="no-data">Hakuna polls bado</p>';
            return;
        }
        
        for (const poll of data) {
            const { count: votesCount } = await supabaseClient
                .from('poll_votes')
                .select('*', { count: 'exact', head: true })
                .eq('poll_id', poll.id);
            
            const item = document.createElement('div');
            item.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 15px; border-bottom: 1px solid #334155;';
            
            item.innerHTML = '<div style="flex: 1;">' +
                '<strong style="color: #d4af37;">' + poll.swali + '</strong>' +
                '<p style="color: #94a3b8; font-size: 12px;">' + 
                'Send: ' + formatDate(poll.tarehe_send) + ' | Futa: ' + formatDate(poll.tarehe_delete) + ' | Kura: ' + (votesCount || 0) + 
                '</p>' +
                '</div>' +
                '<button type="button" class="btn-delete-poll" data-poll-id="' + poll.id + '" style="background: #ef4444; color: #fff; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer;"><i class="fas fa-trash"></i></button>';
            
            list.appendChild(item);
        }
        
        document.querySelectorAll('.btn-delete-poll').forEach(function(btn) {
            btn.addEventListener('click', async function() {
                if (confirm('Futa poll hii?')) {
                    await supabaseClient.from('polls').delete().eq('id', this.getAttribute('data-poll-id'));
                    loadPolls();
                }
            });
        });
    } catch (e) {
        document.getElementById('pollsList').innerHTML = '<p class="no-data">Imeshindikana kupakia polls</p>';
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
    
    document.getElementById('addPollBtn').addEventListener('click', function() {
        document.getElementById('addPollModal').style.display = 'flex';
    });
    
    document.getElementById('addPollClose').addEventListener('click', function() {
        document.getElementById('addPollModal').style.display = 'none';
    });
    
    document.getElementById('addPollForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const swali = document.getElementById('pollSwali').value.trim();
        const chaguo1 = document.getElementById('pollChaguo1').value.trim();
        const chaguo2 = document.getElementById('pollChaguo2').value.trim();
        const chaguo3 = document.getElementById('pollChaguo3').value.trim();
        const chaguo4 = document.getElementById('pollChaguo4').value.trim();
        const tareheSend = document.getElementById('pollTareheSend').value;
        const tareheDelete = document.getElementById('pollTareheDelete').value;
        
        if (!swali || !chaguo1 || !chaguo2 || !tareheSend || !tareheDelete) {
            alert('Jaza vipengele vyote vya lazima');
            return;
        }
        
        try {
            const { data: newPoll, error: pollError } = await supabaseClient
                .from('polls')
                .insert([{
                    swali: swali,
                    tarehe_send: tareheSend,
                    tarehe_delete: tareheDelete
                }])
                .select();
            
            if (pollError) throw pollError;
            
            const pollId = newPoll[0].id;
            
            const options = [chaguo1, chaguo2, chaguo3, chaguo4].filter(function(o) { return o.trim() !== ''; });
            
            for (const option of options) {
                await supabaseClient.from('poll_options').insert([{
                    poll_id: pollId,
                    chaguo: option
                }]);
            }
            
            alert('Poll imehifadhiwa!');
            document.getElementById('addPollModal').style.display = 'none';
            document.getElementById('addPollForm').reset();
            loadPolls();
        } catch (error) {
            alert('Imeshindikana: ' + error.message);
        }
    });
    
    document.querySelectorAll('.sidebar-item').forEach(function(item) {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            if (page === 'polls') return;
            window.location.href = page + '.html';
        });
    });
    
    document.querySelectorAll('.bottom-nav-item').forEach(function(item) {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            if (page === 'polls') return;
            window.location.href = page + '.html';
        });
    });
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('sw-TZ', { day: 'numeric', month: 'short', year: 'numeric' });
}