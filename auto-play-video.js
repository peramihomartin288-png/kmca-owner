// ============================================
// KMCA OWNER - AUTO-PLAY SALA VIDEO
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const owner = requireOwnerAuth();
    if (!owner) return;
    
    loadStats();
    loadVideos();
    loadVideoStats();
    setupEvents(owner);
});

// ========== LOAD STATS ==========
async function loadStats() {
    try {
        const { data: videos } = await supabaseClient
            .from('auto_play_videos')
            .select('*');
        
        const total = videos.length;
        const active = videos.filter(v => v.status === 'active').length;
        
        document.getElementById('totalVideos').textContent = total;
        document.getElementById('activeVideos').textContent = active;
        
        // Count playing now
        const now = new Date();
        const currentTime = now.toTimeString().slice(0, 8);
        let playingNow = 0;
        
        for (const video of videos) {
            if (video.status !== 'active') continue;
            
            for (const playTime of video.play_times) {
                const startTime = playTime;
                const endTime = addMinutes(playTime, video.playback_duration);
                
                if (currentTime >= startTime && currentTime <= endTime) {
                    playingNow++;
                }
            }
        }
        
        document.getElementById('playingNow').textContent = playingNow;
        
        // Total viewers
        const { count: viewers } = await supabaseClient
            .from('auto_play_video_viewers')
            .select('*', { count: 'exact', head: true });
        
        document.getElementById('totalViewers').textContent = viewers || 0;
    } catch (e) {
        console.error('Error loading video stats:', e);
    }
}

// ========== LOAD VIDEOS ==========
async function loadVideos() {
    try {
        const { data, error } = await supabaseClient
            .from('auto_play_videos')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const list = document.getElementById('videosList');
        list.innerHTML = '';
        
        if (!data || data.length === 0) {
            list.innerHTML = '<p class="no-data">Hakuna video bado</p>';
            return;
        }
        
        data.forEach(function(video) {
            const item = document.createElement('div');
            item.style.cssText = 'padding: 15px; border-bottom: 1px solid #334155;';
            
            item.innerHTML = 
                '<div style="display: flex; justify-content: space-between; align-items: flex-start;">' +
                '<div style="flex: 1;">' +
                '<strong style="color: #d4af37;">' + video.title + '</strong>' +
                '<p style="color: #94a3b8; font-size: 12px;">' + 
                'Video: ' + video.video_duration + ' dk | Playback: ' + video.playback_duration + ' dk | Repeat: ' + video.repeat_count + 'x' +
                '</p>' +
                '<p style="color: #94a3b8; font-size: 11px;">' + 
                'Muda: ' + (video.play_times ? video.play_times.join(', ') : '') + 
                '</p>' +
                '<span style="background: ' + (video.status === 'active' ? '#10b981' : '#f59e0b') + '20; color: ' + (video.status === 'active' ? '#10b981' : '#f59e0b') + '; padding: 3px 10px; border-radius: 15px; font-size: 11px;">' + 
                video.status + 
                '</span>' +
                '</div>' +
                '<div style="display: flex; gap: 5px;">' +
                (video.status === 'active' ? 
                    '<button type="button" class="btn-pause-video" data-id="' + video.id + '" style="background: #f59e0b; color: #fff; border: none; padding: 8px; border-radius: 5px; cursor: pointer;"><i class="fas fa-pause"></i></button>' : 
                    '<button type="button" class="btn-resume-video" data-id="' + video.id + '" style="background: #10b981; color: #fff; border: none; padding: 8px; border-radius: 5px; cursor: pointer;"><i class="fas fa-play"></i></button>') +
                '<button type="button" class="btn-delete-video" data-id="' + video.id + '" style="background: #ef4444; color: #fff; border: none; padding: 8px; border-radius: 5px; cursor: pointer;"><i class="fas fa-trash"></i></button>' +
                '</div>' +
                '</div>';
            
            list.appendChild(item);
        });
        
        // Pause/Resume
        document.querySelectorAll('.btn-pause-video').forEach(function(btn) {
            btn.addEventListener('click', async function() {
                await supabaseClient.from('auto_play_videos').update({ status: 'paused' }).eq('id', this.getAttribute('data-id'));
                loadStats();
                loadVideos();
            });
        });
        
        document.querySelectorAll('.btn-resume-video').forEach(function(btn) {
            btn.addEventListener('click', async function() {
                await supabaseClient.from('auto_play_videos').update({ status: 'active' }).eq('id', this.getAttribute('data-id'));
                loadStats();
                loadVideos();
            });
        });
        
        // Delete
        document.querySelectorAll('.btn-delete-video').forEach(function(btn) {
            btn.addEventListener('click', async function() {
                if (confirm('Futa video hii?')) {
                    await supabaseClient.from('auto_play_videos').delete().eq('id', this.getAttribute('data-id'));
                    loadStats();
                    loadVideos();
                }
            });
        });
    } catch (e) {
        document.getElementById('videosList').innerHTML = '<p class="no-data">Imeshindikana kupakia video</p>';
    }
}

// ========== LOAD VIDEO STATS ==========
async function loadVideoStats() {
    try {
        const { data, error } = await supabaseClient
            .from('video_statistics_view')
            .select('*')
            .limit(10);
        
        if (error) throw error;
        
        const list = document.getElementById('videoStatsList');
        list.innerHTML = '';
        
        if (!data || data.length === 0) {
            list.innerHTML = '<p class="no-data">Hakuna takwimu bado</p>';
            return;
        }
        
        data.forEach(function(stat) {
            const item = document.createElement('div');
            item.style.cssText = 'padding: 12px; border-bottom: 1px solid #334155;';
            
            item.innerHTML = 
                '<div style="display: flex; justify-content: space-between;">' +
                '<span style="color: #cbd5e1; font-size: 13px;">' + stat.title + '</span>' +
                '<span style="color: #94a3b8; font-size: 12px;">' + stat.total_plays + ' plays</span>' +
                '<span style="color: #10b981; font-size: 12px;">' + stat.total_viewers + ' viewers</span>' +
                '</div>';
            
            list.appendChild(item);
        });
    } catch (e) {
        document.getElementById('videoStatsList').innerHTML = '<p class="no-data">Imeshindikana kupakia takwimu</p>';
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
    
    document.getElementById('addVideoBtn').addEventListener('click', function() {
        document.getElementById('addVideoModal').style.display = 'flex';
    });
    
    document.getElementById('addVideoClose').addEventListener('click', function() {
        document.getElementById('addVideoModal').style.display = 'none';
    });
    
    // Add time button
    document.getElementById('addTimeBtn').addEventListener('click', function() {
        const container = document.getElementById('playTimesContainer');
        const div = document.createElement('div');
        div.style.cssText = 'display: flex; gap: 8px; margin-bottom: 8px;';
        div.innerHTML = 
            '<input type="time" class="play-time-input" required>' +
            '<button type="button" class="btn-remove-time" style="background: #ef4444; color: #fff; border: none; padding: 8px; border-radius: 6px; cursor: pointer;"><i class="fas fa-times"></i></button>';
        container.appendChild(div);
        
        div.querySelector('.btn-remove-time').addEventListener('click', function() {
            div.remove();
        });
    });
    
    // Remove time button (initial)
    document.querySelectorAll('.btn-remove-time').forEach(function(btn) {
        btn.addEventListener('click', function() {
            this.parentElement.remove();
        });
    });
    
    document.getElementById('addVideoForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const title = document.getElementById('videoTitle').value.trim();
        const description = document.getElementById('videoDescription').value.trim();
        const videoUrl = document.getElementById('videoUrl').value.trim();
        const videoDuration = parseInt(document.getElementById('videoDuration').value);
        const playbackDuration = parseInt(document.getElementById('playbackDuration').value);
        const repeatCount = parseInt(document.getElementById('repeatCount').value);
        
        if (!title || !videoUrl || !videoDuration || !playbackDuration) {
            alert('Jaza vipengele vyote vya lazima');
            return;
        }
        
        const playTimes = [];
        document.querySelectorAll('.play-time-input').forEach(function(input) {
            if (input.value) playTimes.push(input.value);
        });
        
        if (playTimes.length === 0) {
            alert('Weka angalau muda mmoja wa kuplay');
            return;
        }
        
        try {
            await supabaseClient.from('auto_play_videos').insert([{
                title: title,
                description: description || null,
                video_url: videoUrl,
                video_duration: videoDuration,
                playback_duration: playbackDuration,
                play_times: playTimes,
                repeat_count: repeatCount || 1,
                status: 'active',
                created_by: owner.id
            }]);
            
            alert('Video imehifadhiwa!');
            document.getElementById('addVideoModal').style.display = 'none';
            document.getElementById('addVideoForm').reset();
            loadStats();
            loadVideos();
        } catch (error) {
            alert('Imeshindikana: ' + error.message);
        }
    });
    
    document.querySelectorAll('.sidebar-item').forEach(function(item) {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            if (page === 'auto-play-video') return;
            window.location.href = page + '.html';
        });
    });
}

// ========== HELPER FUNCTIONS ==========
function addMinutes(timeString, minutes) {
    const [hours, mins, secs] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, mins + minutes, secs || 0);
    return date.toTimeString().slice(0, 8);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('sw-TZ', { day: 'numeric', month: 'short', year: 'numeric' });
}