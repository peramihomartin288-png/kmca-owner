// ============================================
// KMCA OWNER - NYIMBO ZA SIKU MANAGEMENT
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const owner = requireOwnerAuth();
    if (!owner) return;
    
    loadNyimbo();
    setupEvents(owner);
});

// ========== LOAD NYIMBO ==========
async function loadNyimbo() {
    try {
        const { data, error } = await supabaseClient
            .from('nyimbo_za_siku')
            .select('*')
            .order('tarehe', { ascending: true });
        
        if (error) throw error;
        
        const list = document.getElementById('nyimboList');
        list.innerHTML = '';
        
        if (!data || data.length === 0) {
            list.innerHTML = '<p class="no-data">Hakuna nyimbo bado</p>';
            return;
        }
        
        data.forEach(function(wimbo) {
            const item = document.createElement('div');
            item.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 15px; border-bottom: 1px solid #334155;';
            
            item.innerHTML = '<div style="flex: 1;">' +
                '<strong style="color: #d4af37;">' + wimbo.jina + '</strong>' +
                '<p style="color: #94a3b8; font-size: 12px;">' + wimbo.media_type + ' | Tarehe: ' + formatDate(wimbo.tarehe) + '</p>' +
                (wimbo.maelezo ? '<p style="color: #94a3b8; font-size: 11px;">' + wimbo.maelezo.substring(0, 60) + '...</p>' : '') +
                '</div>' +
                '<button type="button" class="btn-delete-wimbo" data-id="' + wimbo.id + '" style="background: #ef4444; color: #fff; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer;"><i class="fas fa-trash"></i></button>';
            
            list.appendChild(item);
        });
        
        document.querySelectorAll('.btn-delete-wimbo').forEach(function(btn) {
            btn.addEventListener('click', async function() {
                if (confirm('Futa wimbo huu?')) {
                    await supabaseClient.from('nyimbo_za_siku').delete().eq('id', this.getAttribute('data-id'));
                    loadNyimbo();
                }
            });
        });
    } catch (e) {
        document.getElementById('nyimboList').innerHTML = '<p class="no-data">Imeshindikana kupakia nyimbo</p>';
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
    
    document.getElementById('addWimboBtn').addEventListener('click', function() {
        document.getElementById('addWimboModal').style.display = 'flex';
    });
    
    document.getElementById('addWimboClose').addEventListener('click', function() {
        document.getElementById('addWimboModal').style.display = 'none';
    });
    
    document.getElementById('runWimboCycleBtn').addEventListener('click', async function() {
        if (!confirm('Run wimbo daily cycle?')) return;
        
        try {
            await supabaseClient.rpc('archive_daily_wimbo');
            alert('Wimbo daily cycle imefanikiwa!');
            loadNyimbo();
        } catch (e) {
            alert('Imeshindikana: ' + e.message);
        }
    });
    
    document.getElementById('addWimboForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const jina = document.getElementById('wimboJina').value.trim();
        const tarehe = document.getElementById('wimboTarehe').value;
        const maelezo = document.getElementById('wimboMaelezo').value.trim();
        const mediaType = document.getElementById('wimboMediaType').value;
        const file = document.getElementById('wimboFile').files[0];
        
        if (!jina || !tarehe || !mediaType || !file) {
            alert('Jaza vipengele vyote');
            return;
        }
        
        const submitBtn = this.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Inahifadhi...';
        
        try {
            const result = await uploadFileSmart(file);
            
            if (!result.success) {
                alert('Upload imeshindikana: ' + result.error);
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-save"></i> Hifadhi Wimbo';
                return;
            }
            
            await supabaseClient.from('nyimbo_za_siku').insert([{
                jina: jina,
                tarehe: tarehe,
                maelezo: maelezo || null,
                media_type: mediaType,
                media_file: result.url
            }]);
            
            alert('Wimbo umehifadhiwa!');
            document.getElementById('addWimboModal').style.display = 'none';
            document.getElementById('addWimboForm').reset();
            loadNyimbo();
        } catch (error) {
            alert('Imeshindikana: ' + error.message);
        }
        
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Hifadhi Wimbo';
    });
    
    document.querySelectorAll('.sidebar-item').forEach(function(item) {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            if (page === 'nyimbo') return;
            window.location.href = page + '.html';
        });
    });
    
    document.querySelectorAll('.bottom-nav-item').forEach(function(item) {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            if (page === 'nyimbo') return;
            window.location.href = page + '.html';
        });
    });
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('sw-TZ', { day: 'numeric', month: 'short', year: 'numeric' });
}