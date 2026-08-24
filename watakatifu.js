// ============================================
// KMCA OWNER - WATAKATIFU MANAGEMENT
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const owner = requireOwnerAuth();
    if (!owner) return;
    
    loadWatakatifu();
    setupEvents(owner);
});

// ========== LOAD WATAKATIFU ==========
async function loadWatakatifu() {
    try {
        const { data, error } = await supabaseClient
            .from('watakatifu')
            .select('*')
            .order('sikukuu', { ascending: true });
        
        if (error) throw error;
        
        const list = document.getElementById('watakatifuList');
        list.innerHTML = '';
        
        if (!data || data.length === 0) {
            list.innerHTML = '<p class="no-data">Hakuna watakatifu bado</p>';
            return;
        }
        
        data.forEach(function(mtakatifu) {
            const item = document.createElement('div');
            item.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 15px; border-bottom: 1px solid #334155;';
            
            item.innerHTML = '<div style="flex: 1;">' +
                '<strong style="color: #d4af37;">' + mtakatifu.jina + '</strong>' +
                '<p style="color: #94a3b8; font-size: 12px;">Sikukuu: ' + formatDate(mtakatifu.sikukuu) + '</p>' +
                (mtakatifu.historia ? '<p style="color: #94a3b8; font-size: 11px;">' + mtakatifu.historia.substring(0, 60) + '...</p>' : '') +
                '</div>' +
                '<button type="button" class="btn-delete-mtakatifu" data-id="' + mtakatifu.id + '" style="background: #ef4444; color: #fff; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer;"><i class="fas fa-trash"></i></button>';
            
            list.appendChild(item);
        });
        
        document.querySelectorAll('.btn-delete-mtakatifu').forEach(function(btn) {
            btn.addEventListener('click', async function() {
                if (confirm('Futa mtakatifu huyu?')) {
                    await supabaseClient.from('watakatifu').delete().eq('id', this.getAttribute('data-id'));
                    loadWatakatifu();
                }
            });
        });
    } catch (e) {
        document.getElementById('watakatifuList').innerHTML = '<p class="no-data">Imeshindikana kupakia watakatifu</p>';
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
    
    document.getElementById('addMtakatifuBtn').addEventListener('click', function() {
        document.getElementById('addMtakatifuModal').style.display = 'flex';
    });
    
    document.getElementById('addMtakatifuClose').addEventListener('click', function() {
        document.getElementById('addMtakatifuModal').style.display = 'none';
    });
    
    document.getElementById('runWatakatifuCycleBtn').addEventListener('click', async function() {
        if (!confirm('Run watakatifu daily cycle?')) return;
        
        try {
            await supabaseClient.rpc('archive_expired_watakatifu');
            alert('Watakatifu daily cycle imefanikiwa!');
            loadWatakatifu();
        } catch (e) {
            alert('Imeshindikana: ' + e.message);
        }
    });
    
    document.getElementById('addMtakatifuForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const jina = document.getElementById('mtakatifuJina').value.trim();
        const sikukuu = document.getElementById('mtakatifuSikukuu').value;
        const historia = document.getElementById('mtakatifuHistoria').value.trim();
        const sala = document.getElementById('mtakatifuSala').value.trim();
        const miujiza = document.getElementById('mtakatifuMiujiza').value.trim();
        const picha = document.getElementById('mtakatifuPicha').files[0];
        
        if (!jina || !sikukuu) {
            alert('Jaza jina na sikukuu');
            return;
        }
        
        const submitBtn = this.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Inahifadhi...';
        
        try {
            let pichaUrl = null;
            
            if (picha) {
                const result = await uploadToCloudinary(picha);
                if (result.success) {
                    pichaUrl = result.url;
                }
            }
            
            await supabaseClient.from('watakatifu').insert([{
                jina: jina,
                sikukuu: sikukuu,
                historia: historia || null,
                sala: sala || null,
                miujiza: miujiza || null,
                picha_file: pichaUrl
            }]);
            
            alert('Mtakatifu amehifadhiwa!');
            document.getElementById('addMtakatifuModal').style.display = 'none';
            document.getElementById('addMtakatifuForm').reset();
            loadWatakatifu();
        } catch (error) {
            alert('Imeshindikana: ' + error.message);
        }
        
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Hifadhi Mtakatifu';
    });
    
    document.querySelectorAll('.sidebar-item').forEach(function(item) {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            if (page === 'watakatifu') return;
            window.location.href = page + '.html';
        });
    });
    
    document.querySelectorAll('.bottom-nav-item').forEach(function(item) {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            if (page === 'watakatifu') return;
            window.location.href = page + '.html';
        });
    });
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('sw-TZ', { day: 'numeric', month: 'short', year: 'numeric' });
}