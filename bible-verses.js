// ============================================
// KMCA OWNER - BIBLE VERSES MANAGEMENT
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const owner = requireOwnerAuth();
    if (!owner) return;
    
    loadVerses();
    setupEvents(owner);
});

// ========== LOAD VERSES ==========
async function loadVerses() {
    try {
        const { data, error } = await supabaseClient
            .from('bible_verses')
            .select('*')
            .order('tarehe', { ascending: true });
        
        if (error) throw error;
        
        const list = document.getElementById('versesList');
        list.innerHTML = '';
        
        if (!data || data.length === 0) {
            list.innerHTML = '<p class="no-data">Hakuna bible verses bado</p>';
            document.getElementById('totalVerses').textContent = '0';
            document.getElementById('todayVerses').textContent = '0';
            document.getElementById('pastVerses').textContent = '0';
            document.getElementById('upcomingVerses').textContent = '0';
            return;
        }
        
        const today = new Date().toISOString().split('T')[0];
        
        let todayCount = 0;
        let pastCount = 0;
        let upcomingCount = 0;
        
        data.forEach(function(verse) {
            const isToday = verse.tarehe === today;
            const isPast = verse.tarehe < today;
            
            if (isToday) todayCount++;
            if (isPast) pastCount++;
            if (!isToday && !isPast) upcomingCount++;
            
            let statusBadge = '';
            if (isToday) {
                statusBadge = '<span style="background: rgba(16, 185, 129, 0.2); color: #10b981; padding: 3px 10px; border-radius: 15px; font-size: 11px;">🟢 Leo</span>';
            } else if (isPast) {
                statusBadge = '<span style="background: rgba(239, 68, 68, 0.2); color: #ef4444; padding: 3px 10px; border-radius: 15px; font-size: 11px;">🔴 Imepita</span>';
            } else {
                statusBadge = '<span style="background: rgba(37, 99, 235, 0.2); color: #2563eb; padding: 3px 10px; border-radius: 15px; font-size: 11px;">🔵 Inakuja</span>';
            }
            
            const item = document.createElement('div');
            item.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 15px; border-bottom: 1px solid #334155;';
            
            item.innerHTML = '<div style="flex: 1;">' +
                '<strong style="color: #d4af37;">' + verse.kichwa + '</strong>' +
                '<p style="color: #94a3b8; font-size: 12px;">' + verse.reference + ' | Tarehe: ' + formatDate(verse.tarehe) + '</p>' +
                '<p style="color: #94a3b8; font-size: 11px;">' + verse.verse_text.substring(0, 50) + '...</p>' +
                statusBadge +
                '</div>' +
                '<button type="button" class="btn-delete-verse" data-verse-id="' + verse.id + '" style="background: #ef4444; color: #fff; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer;"><i class="fas fa-trash"></i></button>';
            
            list.appendChild(item);
        });
        
        document.getElementById('totalVerses').textContent = data.length;
        document.getElementById('todayVerses').textContent = todayCount;
        document.getElementById('pastVerses').textContent = pastCount;
        document.getElementById('upcomingVerses').textContent = upcomingCount;
        
        document.querySelectorAll('.btn-delete-verse').forEach(function(btn) {
            btn.addEventListener('click', async function() {
                if (confirm('Futa verse hii?')) {
                    await supabaseClient.from('bible_verses').delete().eq('id', this.getAttribute('data-verse-id'));
                    loadVerses();
                }
            });
        });
    } catch (e) {
        document.getElementById('versesList').innerHTML = '<p class="no-data">Imeshindikana kupakia bible verses</p>';
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
    
    document.getElementById('addVerseBtn').addEventListener('click', function() {
        document.getElementById('addVerseModal').style.display = 'flex';
    });
    
    document.getElementById('addVerseClose').addEventListener('click', function() {
        document.getElementById('addVerseModal').style.display = 'none';
    });
    
    document.getElementById('runBibleCycleBtn').addEventListener('click', async function() {
        if (!confirm('Run bible daily cycle sasa?')) return;
        
        try {
            await supabaseClient.rpc('archive_daily_bible_verse');
            alert('Bible daily cycle imefanikiwa!');
            loadVerses();
        } catch (e) {
            alert('Imeshindikana: ' + e.message);
        }
    });
    
    document.getElementById('addVerseForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const kichwa = document.getElementById('verseKichwa').value.trim();
        const tarehe = document.getElementById('verseTarehe').value;
        const verseText = document.getElementById('verseText').value.trim();
        const reference = document.getElementById('verseReference').value.trim();
        const funzo = document.getElementById('verseFunzo').value.trim();
        
        if (!kichwa || !tarehe || !verseText || !reference || !funzo) {
            alert('Jaza vipengele vyote');
            return;
        }
        
        const submitBtn = this.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Inahifadhi...';
        
        try {
            await supabaseClient.from('bible_verses').insert([{
                kichwa: kichwa,
                tarehe: tarehe,
                verse_text: verseText,
                reference: reference,
                funzo: funzo
            }]);
            
            alert('Verse imehifadhiwa!');
            document.getElementById('addVerseModal').style.display = 'none';
            document.getElementById('addVerseForm').reset();
            loadVerses();
        } catch (error) {
            alert('Imeshindikana: ' + error.message);
        }
        
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Hifadhi Verse';
    });
    
    document.querySelectorAll('.sidebar-item').forEach(function(item) {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            if (page === 'bible-verses') return;
            window.location.href = page + '.html';
        });
    });
    
    document.querySelectorAll('.bottom-nav-item').forEach(function(item) {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            if (page === 'bible-verses') return;
            window.location.href = page + '.html';
        });
    });
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('sw-TZ', { day: 'numeric', month: 'short', year: 'numeric' });
}