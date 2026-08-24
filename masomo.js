// ============================================
// KMCA OWNER - MASOMO YA DOMINICA MANAGEMENT
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const owner = requireOwnerAuth();
    if (!owner) return;
    
    loadMasomo();
    setupEvents(owner);
});

// ========== LOAD MASOMO ==========
async function loadMasomo() {
    try {
        const { data, error } = await supabaseClient
            .from('masomo_dominica')
            .select('*')
            .order('tarehe_jumapili', { ascending: true });
        
        if (error) throw error;
        
        const list = document.getElementById('masomoList');
        list.innerHTML = '';
        
        if (!data || data.length === 0) {
            list.innerHTML = '<p class="no-data">Hakuna masomo bado</p>';
            return;
        }
        
        data.forEach(function(somo) {
            const item = document.createElement('div');
            item.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 15px; border-bottom: 1px solid #334155;';
            
            item.innerHTML = '<div style="flex: 1;">' +
                '<strong style="color: #d4af37;">' + somo.jina_dominika + '</strong>' +
                '<p style="color: #94a3b8; font-size: 12px;">Jumapili: ' + formatDate(somo.tarehe_jumapili) + '</p>' +
                '</div>' +
                '<button type="button" class="btn-delete-somo" data-id="' + somo.id + '" style="background: #ef4444; color: #fff; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer;"><i class="fas fa-trash"></i></button>';
            
            list.appendChild(item);
        });
        
        document.querySelectorAll('.btn-delete-somo').forEach(function(btn) {
            btn.addEventListener('click', async function() {
                if (confirm('Futa somo hili?')) {
                    await supabaseClient.from('masomo_dominica').delete().eq('id', this.getAttribute('data-id'));
                    loadMasomo();
                }
            });
        });
    } catch (e) {
        document.getElementById('masomoList').innerHTML = '<p class="no-data">Imeshindikana kupakia masomo</p>';
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
    
    document.getElementById('addSomoBtn').addEventListener('click', function() {
        document.getElementById('addSomoModal').style.display = 'flex';
    });
    
    document.getElementById('addSomoClose').addEventListener('click', function() {
        document.getElementById('addSomoModal').style.display = 'none';
    });
    
    document.getElementById('addSomoForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const jina = document.getElementById('somoJina').value.trim();
        const tarehe = document.getElementById('somoTarehe').value;
        const somo1 = document.getElementById('somo1').value.trim();
        const wimboKatikati = document.getElementById('wimboKatikati').value.trim();
        const somo2 = document.getElementById('somo2').value.trim();
        const shangilio = document.getElementById('shangilio').value.trim();
        const injili = document.getElementById('injili').value.trim();
        
        if (!jina || !tarehe || !somo1 || !somo2 || !injili) {
            alert('Jaza vipengele vyote vya lazima');
            return;
        }
        
        const submitBtn = this.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Inahifadhi...';
        
        try {
            await supabaseClient.from('masomo_dominica').insert([{
                jina_dominika: jina,
                tarehe_jumapili: tarehe,
                somo_1: somo1,
                wimbo_katikati: wimboKatikati || null,
                somo_2: somo2,
                shangilio: shangilio || null,
                injili: injili
            }]);
            
            alert('Somo limehifadhiwa!');
            document.getElementById('addSomoModal').style.display = 'none';
            document.getElementById('addSomoForm').reset();
            loadMasomo();
        } catch (error) {
            alert('Imeshindikana: ' + error.message);
        }
        
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Hifadhi Somo';
    });
    
    document.querySelectorAll('.sidebar-item').forEach(function(item) {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            if (page === 'masomo') return;
            window.location.href = page + '.html';
        });
    });
    
    document.querySelectorAll('.bottom-nav-item').forEach(function(item) {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            if (page === 'masomo') return;
            window.location.href = page + '.html';
        });
    });
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('sw-TZ', { day: 'numeric', month: 'short', year: 'numeric' });
}