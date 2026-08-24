// ============================================
// KMCA OWNER - POSTS MANAGEMENT
// 9 Types + Smart Upload + URL Support
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const owner = requireOwnerAuth();
    if (!owner) return;
    
    loadPosts();
    setupPostsEvents(owner);
});

let selectedPostType = '';
let selectedSource = '';

// ========== LOAD POSTS ==========
async function loadPosts() {
    try {
        const { data, error } = await supabaseClient
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const postsList = document.getElementById('postsList');
        postsList.innerHTML = '';
        
        if (!data || data.length === 0) {
            postsList.innerHTML = '<p class="no-data">Hakuna posts bado</p>';
            return;
        }
        
        const typeLabels = {
            'picha_moja': 'Picha Moja',
            'picha_nyingi': 'Picha Nyingi',
            'picha_music': 'Picha + Music',
            'picha_nyingi_music': 'Picha Nyingi + Music',
            'video': 'Video',
            'maneno': 'Maneno',
            'other_file': 'File',
            'live_video': '🔴 Live Video',
            'auto_fake_live_video': '🎬 Auto Fake Live'
        };
        
        data.forEach(function(post) {
            const item = document.createElement('div');
            item.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 15px; border-bottom: 1px solid #334155;';
            
            item.innerHTML = '<div style="flex: 1;">' +
                '<strong style="color: #d4af37;">' + post.title + '</strong>' +
                '<p style="color: #94a3b8; font-size: 12px;">' + (typeLabels[post.type] || post.type) + ' | ' + formatDate(post.created_at) + '</p>' +
                (post.media_files && post.media_files.length > 0 ? '<p style="color: #94a3b8; font-size: 11px;">Media: ' + post.media_files.length + '</p>' : '') +
                (post.audio_file ? '<p style="color: #94a3b8; font-size: 11px;">Audio: ✓</p>' : '') +
                '</div>' +
                '<button type="button" class="btn-delete-post" data-post-id="' + post.id + '" style="background: #ef4444; color: #fff; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer;"><i class="fas fa-trash"></i></button>';
            
            postsList.appendChild(item);
        });
        
        document.querySelectorAll('.btn-delete-post').forEach(function(btn) {
            btn.addEventListener('click', async function() {
                if (confirm('Futa post hii?')) {
                    await supabaseClient.from('posts').delete().eq('id', this.getAttribute('data-post-id'));
                    loadPosts();
                }
            });
        });
    } catch (e) {
        document.getElementById('postsList').innerHTML = '<p class="no-data">Imeshindikana kupakia posts</p>';
    }
}

// ========== SETUP EVENTS ==========
function setupPostsEvents(owner) {
    document.getElementById('menuToggle').addEventListener('click', function() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('open');
    });
    
    document.getElementById('logoutBtn').addEventListener('click', function() {
        logoutOwner();
    });
    
    document.getElementById('addPostBtn').addEventListener('click', function() {
        document.getElementById('addPostModal').style.display = 'flex';
        document.getElementById('stepChooseType').style.display = 'block';
        document.getElementById('stepSource').style.display = 'none';
        document.getElementById('stepForm').style.display = 'none';
        document.getElementById('autoFakeLiveFields').style.display = 'none';
    });
    
    document.getElementById('addPostClose').addEventListener('click', function() {
        document.getElementById('addPostModal').style.display = 'none';
    });
    
    document.querySelectorAll('.post-type-card').forEach(function(card) {
        card.addEventListener('click', function() {
            selectedPostType = this.getAttribute('data-type');
            
            document.getElementById('stepChooseType').style.display = 'none';
            document.getElementById('stepSource').style.display = 'block';
        });
    });
    
    document.getElementById('backToTypes').addEventListener('click', function() {
        document.getElementById('stepChooseType').style.display = 'block';
        document.getElementById('stepSource').style.display = 'none';
    });
    
    document.querySelectorAll('.source-card').forEach(function(card) {
        card.addEventListener('click', function() {
            selectedSource = this.getAttribute('data-source');
            
            document.getElementById('stepSource').style.display = 'none';
            document.getElementById('stepForm').style.display = 'block';
            
            // Show/hide fields
            if (selectedSource === 'file') {
                document.getElementById('fileUploadGroup').style.display = 'block';
                document.getElementById('urlInputGroup').style.display = 'none';
            } else {
                document.getElementById('fileUploadGroup').style.display = 'none';
                document.getElementById('urlInputGroup').style.display = 'block';
            }
            
            // Live video note
            if (selectedPostType === 'live_video') {
                document.getElementById('liveNote').style.display = 'block';
                document.getElementById('urlInputGroup').style.display = 'block';
                document.getElementById('fileUploadGroup').style.display = 'none';
                document.getElementById('autoFakeLiveFields').style.display = 'none';
            } else {
                document.getElementById('liveNote').style.display = 'none';
            }
            
            // Auto fake live video fields
            if (selectedPostType === 'auto_fake_live_video') {
                document.getElementById('autoFakeLiveFields').style.display = 'block';
                document.getElementById('urlInputGroup').style.display = 'block';
                document.getElementById('fileUploadGroup').style.display = 'none';
            } else {
                document.getElementById('autoFakeLiveFields').style.display = 'none';
            }
        });
    });
    
    document.getElementById('backToSource').addEventListener('click', function() {
        document.getElementById('stepSource').style.display = 'block';
        document.getElementById('stepForm').style.display = 'none';
    });
    
    document.getElementById('addPostForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const title = document.getElementById('postTitle').value.trim();
        const description = document.getElementById('postDescription').value.trim();
        
        if (!title) {
            alert('Weka title');
            return;
        }
        
        const submitBtn = this.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Inahifadhi...';
        
        try {
            let mediaUrls = [];
            let audioUrl = null;
            
            if (selectedSource === 'file') {
                const file = document.getElementById('postFile').files[0];
                
                if (!file) {
                    alert('Chagua file');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-save"></i> Hifadhi Post';
                    return;
                }
                
                const result = await uploadFileSmart(file);
                
                if (result.success) {
                    if (file.type.startsWith('audio/')) {
                        audioUrl = result.url;
                    } else {
                        mediaUrls.push(result.url);
                    }
                }
            } else if (selectedSource === 'url') {
                const url = document.getElementById('postUrl').value.trim();
                
                if (!url) {
                    alert('Weka URL');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-save"></i> Hifadhi Post';
                    return;
                }
                
                mediaUrls.push(url);
            }
            
            const postData = {
                title: title,
                description: description || null,
                type: selectedPostType,
                media_files: mediaUrls.length > 0 ? mediaUrls : null,
                audio_file: audioUrl,
                link_file: selectedPostType === 'maneno' ? document.getElementById('postUrl').value.trim() || null : null
            };
            
            // Auto fake live video fields
            if (selectedPostType === 'auto_fake_live_video') {
                postData.playback_duration = parseInt(document.getElementById('fakeLiveDuration').value) || 60;
                postData.start_time = document.getElementById('fakeLiveStartTime').value;
                postData.end_time = document.getElementById('fakeLiveEndTime').value;
            }
            
            await supabaseClient.from('posts').insert([postData]);
            
            alert('Post imehifadhiwa!');
            document.getElementById('addPostModal').style.display = 'none';
            document.getElementById('addPostForm').reset();
            loadPosts();
        } catch (error) {
            alert('Imeshindikana: ' + error.message);
        }
        
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Hifadhi Post';
    });
    
    document.querySelectorAll('.sidebar-item').forEach(function(item) {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            if (page === 'posts') return;
            window.location.href = page + '.html';
        });
    });
    
    document.querySelectorAll('.bottom-nav-item').forEach(function(item) {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            if (page === 'posts') return;
            window.location.href = page + '.html';
        });
    });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('sw-TZ', { day: 'numeric', month: 'short', year: 'numeric' });
}