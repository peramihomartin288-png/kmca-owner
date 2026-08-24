// ============================================
// KMCA OWNER - MEDIA LIBRARY MANAGEMENT
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const owner = requireOwnerAuth();
    if (!owner) return;
    
    loadMedia();
    loadStorageInfo();
    setupEvents(owner);
});

// ========== LOAD MEDIA ==========
async function loadMedia() {
    try {
        const { data, error } = await supabaseClient
            .from('media_library')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const list = document.getElementById('mediaList');
        list.innerHTML = '';
        
        if (!data || data.length === 0) {
            list.innerHTML = '<p class="no-data">Hakuna media bado</p>';
            return;
        }
        
        // Count per folder
        const counts = {};
        ['watakatifu', 'masomo', 'posts', 'nyimbo', 'bible'].forEach(function(folder) {
            counts[folder] = data.filter(function(item) { return item.folder === folder; }).length;
        });
        
        document.getElementById('watakatifuCount').textContent = counts.watakatifu + ' files';
        document.getElementById('masomoCount').textContent = counts.masomo + ' files';
        document.getElementById('postsCount').textContent = counts.posts + ' files';
        document.getElementById('nyimboCount').textContent = counts.nyimbo + ' files';
        document.getElementById('bibleCount').textContent = counts.bible + ' files';
        
        // Display files
        data.forEach(function(media) {
            const item = document.createElement('div');
            item.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 15px; border-bottom: 1px solid #334155;';
            
            let icon = 'fa-file';
            if (media.file_type && media.file_type.startsWith('image/')) icon = 'fa-image';
            if (media.file_type && media.file_type.startsWith('video/')) icon = 'fa-video';
            if (media.file_type && media.file_type.startsWith('audio/')) icon = 'fa-music';
            
            item.innerHTML = '<div style="display: flex; align-items: center; gap: 12px; flex: 1;">' +
                '<i class="fas ' + icon + '" style="color: #d4af37; font-size: 24px;"></i>' +
                '<div><strong style="color: #cbd5e1;">' + media.file_name + '</strong>' +
                '<p style="color: #94a3b8; font-size: 12px;">' + media.folder + ' | ' + formatDate(media.created_at) + '</p></div></div>' +
                '<div style="display: flex; gap: 5px;">' +
                '<button type="button" class="btn-view-media" data-url="' + media.file_url + '" style="background: #2563eb; color: #fff; border: none; padding: 8px; border-radius: 5px; cursor: pointer;"><i class="fas fa-eye"></i></button>' +
                '<button type="button" class="btn-delete-media" data-id="' + media.id + '" style="background: #ef4444; color: #fff; border: none; padding: 8px; border-radius: 5px; cursor: pointer;"><i class="fas fa-trash"></i></button>' +
                '</div>';
            
            list.appendChild(item);
        });
        
        document.querySelectorAll('.btn-view-media').forEach(function(btn) {
            btn.addEventListener('click', function() {
                window.open(this.getAttribute('data-url'), '_blank');
            });
        });
        
        document.querySelectorAll('.btn-delete-media').forEach(function(btn) {
            btn.addEventListener('click', async function() {
                if (confirm('Futa media hii?')) {
                    await supabaseClient.from('media_library').delete().eq('id', this.getAttribute('data-id'));
                    loadMedia();
                }
            });
        });
    } catch (e) {
        document.getElementById('mediaList').innerHTML = '<p class="no-data">Imeshindikana kupakia media</p>';
    }
}

// ========== LOAD STORAGE INFO ==========
async function loadStorageInfo() {
    try {
        const buckets = ['music', 'posts', 'videos', 'thumbnails', 'logos', 'pdfs'];
        let supabaseBytes = 0;
        
        for (const bucket of buckets) {
            try {
                const { data: files } = await supabaseClient.storage.from(bucket).list();
                if (files) {
                    files.forEach(function(file) {
                        supabaseBytes += file.metadata?.size || 0;
                    });
                }
            } catch (e) {}
        }
        
        const supabaseMB = (supabaseBytes / (1024 * 1024)).toFixed(2);
        document.getElementById('localSupabase').textContent = supabaseMB + ' MB / 1 GB';
        document.getElementById('localCloudinary').textContent = 'Check Cloudinary Dashboard';
        document.getElementById('localUploadcare').textContent = 'Check Uploadcare Dashboard';
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
    
    document.getElementById('uploadMediaBtn').addEventListener('click', function() {
        document.getElementById('uploadMediaModal').style.display = 'flex';
    });
    
    document.getElementById('uploadMediaClose').addEventListener('click', function() {
        document.getElementById('uploadMediaModal').style.display = 'none';
    });
    
    document.getElementById('uploadMediaForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const folder = document.getElementById('mediaFolder').value;
        const file = document.getElementById('mediaFile').files[0];
        
        if (!file) {
            alert('Chagua file');
            return;
        }
        
        const submitBtn = this.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Inapakia...';
        
        try {
            const result = await uploadFileSmart(file);
            
            if (result.success) {
                await supabaseClient.from('media_library').insert([{
                    file_name: file.name,
                    file_url: result.url,
                    file_type: file.type,
                    folder: folder,
                    file_size: (file.size / (1024 * 1024)).toFixed(2)
                }]);
                
                alert('Media imepakiwa kwenye ' + folder + '!');
                document.getElementById('uploadMediaModal').style.display = 'none';
                document.getElementById('uploadMediaForm').reset();
                loadMedia();
            }
        } catch (error) {
            alert('Imeshindikana: ' + error.message);
        }
        
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-upload"></i> Upload';
    });
    
    document.querySelectorAll('.sidebar-item').forEach(function(item) {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            if (page === 'media') return;
            window.location.href = page + '.html';
        });
    });
    
    document.querySelectorAll('.bottom-nav-item').forEach(function(item) {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            if (page === 'media') return;
            window.location.href = page + '.html';
        });
    });
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('sw-TZ', { day: 'numeric', month: 'short', year: 'numeric' });
}