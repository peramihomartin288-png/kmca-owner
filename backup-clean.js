// ============================================
// KMCA OWNER - BACKUP & CLEAN MANAGEMENT
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const owner = requireOwnerAuth();
    if (!owner) return;
    
    setupEvents(owner);
});

// ========== BACKUP FUNCTIONS ==========
async function backupTable(tableName) {
    try {
        const { data, error } = await supabaseClient
            .from(tableName)
            .select('*');
        
        if (error) throw error;
        
        const jsonData = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = tableName + '-backup-' + new Date().toISOString().split('T')[0] + '.json';
        link.click();
        
        URL.revokeObjectURL(url);
        
        alert(tableName + ' backup imefanikiwa! (' + data.length + ' records)');
    } catch (error) {
        alert('Imeshindikana: ' + error.message);
    }
}

async function backupAll() {
    const tables = ['users', 'posts', 'watakatifu', 'bible_verses', 'nyimbo_za_siku', 'masomo_dominica', 'likes', 'comments', 'shares', 'downloads', 'ai_schedules', 'auto_play_videos'];
    let allData = {};
    
    for (const table of tables) {
        try {
            const { data } = await supabaseClient.from(table).select('*');
            allData[table] = data || [];
        } catch (e) {}
    }
    
    const jsonData = JSON.stringify(allData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'kmca-full-backup-' + new Date().toISOString().split('T')[0] + '.json';
    link.click();
    
    URL.revokeObjectURL(url);
    
    alert('Backup kamili imefanikiwa!');
}

// ========== CLEAN FUNCTIONS ==========
async function cleanTable(tableName) {
    if (!confirm('Una uhakika unataka kufuta data kutoka ' + tableName + '?')) return;
    
    try {
        await supabaseClient.from(tableName).delete().gte('id', '00000000-0000-0000-0000-000000000000');
        alert(tableName + ' imefutwa!');
    } catch (error) {
        alert('Imeshindikana: ' + error.message);
    }
}

async function cleanPastEvents() {
    if (!confirm('Futa matukio yaliyopita?')) return;
    
    try {
        const today = new Date().toISOString().split('T')[0];
        await supabaseClient.from('matukio').delete().lt('tarehe_tukio', today);
        alert('Matukio yaliyopita yamefutwa!');
    } catch (error) {
        alert('Imeshindikana: ' + error.message);
    }
}

async function cleanExpiredPolls() {
    if (!confirm('Futa polls zilizoisha?')) return;
    
    try {
        const today = new Date().toISOString().split('T')[0];
        await supabaseClient.from('polls').delete().lt('tarehe_delete', today);
        alert('Polls zilizoisha zimefutwa!');
    } catch (error) {
        alert('Imeshindikana: ' + error.message);
    }
}

async function runAllCycles() {
    if (!confirm('Run daily cycles zote?')) return;
    
    try {
        await supabaseClient.rpc('archive_daily_bible_verse');
        await supabaseClient.rpc('archive_daily_wimbo');
        await supabaseClient.rpc('archive_expired_watakatifu');
        await supabaseClient.rpc('archive_expired_masomo');
        alert('Daily cycles zote zimefanikiwa!');
    } catch (error) {
        alert('Imeshindikana: ' + error.message);
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
    
    // Backup buttons
    document.querySelectorAll('.backup-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const table = this.getAttribute('data-table');
            
            if (table === 'all') {
                backupAll();
            } else {
                backupTable(table);
            }
        });
    });
    
    // Clean buttons
    document.querySelectorAll('.clean-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const action = this.getAttribute('data-action');
            
            if (action === 'notifications') cleanTable('notifications');
            if (action === 'activity') cleanTable('activity_logs');
            if (action === 'comments') cleanTable('comments');
            if (action === 'past_events') cleanPastEvents();
            if (action === 'expired_polls') cleanExpiredPolls();
            if (action === 'orphaned') cleanTable('likes');
        });
    });
    
    // Run all cycles
    document.getElementById('runAllCyclesBtn').addEventListener('click', runAllCycles);
    
    document.querySelectorAll('.sidebar-item').forEach(function(item) {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            if (page === 'backup-clean') return;
            window.location.href = page + '.html';
        });
    });
    
    document.querySelectorAll('.bottom-nav-item').forEach(function(item) {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            if (page === 'backup-clean') return;
            window.location.href = page + '.html';
        });
    });
}