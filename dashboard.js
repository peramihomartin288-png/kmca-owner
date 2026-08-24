// ============================================
// KMCA OWNER - DASHBOARD PRO
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const owner = requireOwnerAuth();
    if (!owner) return;
    
    loadWelcomeBanner(owner);
    loadStatsWithTrends();
    loadHostingMonitor();
    loadCharts();
    loadUserActivityFeed();
    loadOwnerActivity();
    setupEvents(owner);
});

// ========== WELCOME BANNER ==========
function loadWelcomeBanner(owner) {
    const firstName = owner.jina.split(' ')[0];
    document.getElementById('ownerFirstName').textContent = firstName;
    
    const today = new Date();
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    document.getElementById('currentDate').textContent = today.toLocaleDateString('sw-TZ', options);
}

// ========== STATS WITH TRENDS ==========
async function loadStatsWithTrends() {
    try {
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
        const prevMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString();
        const prevMonthEnd = new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString();
        
        // Posts
        const { count: totalPosts } = await supabaseClient.from('posts').select('*', { count: 'exact', head: true });
        const { count: monthPosts } = await supabaseClient.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', monthStart);
        const { count: prevMonthPosts } = await supabaseClient.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', prevMonthStart).lt('created_at', prevMonthEnd);
        
        document.getElementById('statsPosts').textContent = totalPosts || 0;
        document.getElementById('postsTrend').textContent = calculateTrend(monthPosts, prevMonthPosts);
        document.getElementById('postsTrend').className = 'stat-trend ' + getTrendClass(monthPosts, prevMonthPosts);
        
        // Users
        const { count: totalUsers } = await supabaseClient.from('users').select('*', { count: 'exact', head: true });
        const { count: monthUsers } = await supabaseClient.from('users').select('*', { count: 'exact', head: true }).gte('created_at', monthStart);
        const { count: prevMonthUsers } = await supabaseClient.from('users').select('*', { count: 'exact', head: true }).gte('created_at', prevMonthStart).lt('created_at', prevMonthEnd);
        
        document.getElementById('statsUsers').textContent = totalUsers || 0;
        document.getElementById('usersTrend').textContent = calculateTrend(monthUsers, prevMonthUsers);
        document.getElementById('usersTrend').className = 'stat-trend ' + getTrendClass(monthUsers, prevMonthUsers);
        
        // Likes
        const { count: totalLikes } = await supabaseClient.from('likes').select('*', { count: 'exact', head: true });
        const { count: monthLikes } = await supabaseClient.from('likes').select('*', { count: 'exact', head: true }).gte('created_at', monthStart);
        const { count: prevMonthLikes } = await supabaseClient.from('likes').select('*', { count: 'exact', head: true }).gte('created_at', prevMonthStart).lt('created_at', prevMonthEnd);
        
        document.getElementById('statsLikes').textContent = totalLikes || 0;
        document.getElementById('likesTrend').textContent = calculateTrend(monthLikes, prevMonthLikes);
        document.getElementById('likesTrend').className = 'stat-trend ' + getTrendClass(monthLikes, prevMonthLikes);
        
        // Comments
        const { count: totalComments } = await supabaseClient.from('comments').select('*', { count: 'exact', head: true });
        const { count: monthComments } = await supabaseClient.from('comments').select('*', { count: 'exact', head: true }).gte('created_at', monthStart);
        const { count: prevMonthComments } = await supabaseClient.from('comments').select('*', { count: 'exact', head: true }).gte('created_at', prevMonthStart).lt('created_at', prevMonthEnd);
        
        document.getElementById('statsComments').textContent = totalComments || 0;
        document.getElementById('commentsTrend').textContent = calculateTrend(monthComments, prevMonthComments);
        document.getElementById('commentsTrend').className = 'stat-trend ' + getTrendClass(monthComments, prevMonthComments);
    } catch (e) {
        console.error('Error loading stats:', e);
    }
}

function calculateTrend(current, previous) {
    if (!previous || previous === 0) return current > 0 ? '+100%' : '0%';
    const diff = ((current - previous) / previous) * 100;
    return (diff > 0 ? '+' : '') + diff.toFixed(1) + '%';
}

function getTrendClass(current, previous) {
    if (current > previous) return 'trend-up';
    if (current < previous) return 'trend-down';
    return 'trend-neutral';
}

// ========== HOSTING MONITOR ==========
async function loadHostingMonitor() {
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
        document.getElementById('supabaseStorage').textContent = supabaseMB + ' MB / 1 GB';
        document.getElementById('supabaseFill').style.width = Math.min((supabaseMB / 1024) * 100, 100) + '%';
        
        const { count: supabaseDownloads } = await supabaseClient.from('downloads').select('*', { count: 'exact', head: true });
        const supabaseBandwidthMB = (parseFloat(supabaseMB) + (supabaseDownloads || 0)).toFixed(2);
        document.getElementById('supabaseBandwidth').textContent = supabaseBandwidthMB + ' MB / 2 GB';
        
        const { count: usersCount } = await supabaseClient.from('users').select('*', { count: 'exact', head: true });
        document.getElementById('supabaseUsers').textContent = (usersCount || 0) + ' / 50,000';
        
        const tables = ['users', 'posts', 'likes', 'comments', 'shares', 'downloads', 'notifications', 'bible_verses', 'matukio', 'polls', 'watakatifu', 'questions', 'user_activities', 'activity_logs', 'announcements', 'nyimbo_za_siku', 'masomo_dominica', 'history_archives', 'pwa_downloads', 'owner_chats', 'question_answers', 'media_library', 'ai_schedules', 'auto_play_videos'];
        let totalRows = 0;
        
        for (const table of tables) {
            try {
                const { count } = await supabaseClient.from(table).select('*', { count: 'exact', head: true });
                totalRows += count || 0;
            } catch (e) {}
        }
        
        const dbMB = (totalRows * 0.001).toFixed(2);
        document.getElementById('supabaseDb').textContent = dbMB + ' MB / 500 MB';
        
        // Cloudinary
        let cloudinaryCount = 0;
        try {
            const { data: posts } = await supabaseClient.from('posts').select('media_files');
            if (posts) {
                posts.forEach(function(post) {
                    if (post.media_files) {
                        post.media_files.forEach(function(url) {
                            if (url.includes('cloudinary.com')) cloudinaryCount++;
                        });
                    }
                });
            }
        } catch (e) {}
        
        const cloudinaryMB = (cloudinaryCount * 5).toFixed(2);
        document.getElementById('cloudinaryStorage').textContent = cloudinaryMB + ' MB / 25 GB';
        document.getElementById('cloudinaryFill').style.width = Math.min((cloudinaryMB / 25600) * 100, 100) + '%';
        document.getElementById('cloudinaryBandwidth').textContent = (cloudinaryCount * 10).toFixed(2) + ' MB / 25 GB';
        
        // Uploadcare
        let uploadcareCount = 0;
        try {
            const { data: posts } = await supabaseClient.from('posts').select('media_files');
            if (posts) {
                posts.forEach(function(post) {
                    if (post.media_files) {
                        post.media_files.forEach(function(url) {
                            if (url.includes('ucarecdn.com')) uploadcareCount++;
                        });
                    }
                });
            }
        } catch (e) {}
        
        const uploadcareMB = (uploadcareCount * 2).toFixed(2);
        document.getElementById('uploadcareStorage').textContent = uploadcareMB + ' MB / 3 GB';
        document.getElementById('uploadcareFill').style.width = Math.min((uploadcareMB / 3072) * 100, 100) + '%';
        document.getElementById('uploadcareBandwidth').textContent = (uploadcareCount * 4).toFixed(2) + ' MB / 10 GB';
    } catch (e) {
        console.error('Error loading hosting monitor:', e);
    }
}

// ========== CHARTS ==========
async function loadCharts() {
    loadUserActivityChart();
    loadUsersGrowthChart();
    loadStorageChart();
    loadPostsChart();
}

async function loadUserActivityChart() {
    try {
        const { data: activities } = await supabaseClient
            .from('user_activities')
            .select('activity_type, created_at')
            .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());
        
        const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
        const days = [];
        const likes = [];
        const comments = [];
        const shares = [];
        
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i.toString());
            likes.push(0);
            comments.push(0);
            shares.push(0);
        }
        
        if (activities) {
            activities.forEach(function(a) {
                const day = new Date(a.created_at).getDate() - 1;
                if (a.activity_type === 'like_post') likes[day]++;
                if (a.activity_type === 'comment_post') comments[day]++;
                if (a.activity_type === 'share_post') shares[day]++;
            });
        }
        
        const options = {
            series: [
                { name: 'Likes', data: likes },
                { name: 'Comments', data: comments },
                { name: 'Shares', data: shares }
            ],
            chart: { type: 'line', height: 250, background: 'transparent', foreColor: '#cbd5e1' },
            colors: ['#2563eb', '#10b981', '#d4af37'],
            stroke: { curve: 'smooth', width: 2 },
            xaxis: { categories: days },
            theme: { mode: 'dark' },
            legend: { labels: { colors: '#cbd5e1' } }
        };
        
        const chart = new ApexCharts(document.getElementById('userActivityChart'), options);
        chart.render();
    } catch (e) {}
}

async function loadUsersGrowthChart() {
    try {
        const monthLabels = [];
        const monthData = [];
        
        for (let i = 2; i >= 0; i--) {
            const month = new Date(new Date().getFullYear(), new Date().getMonth() - i, 1);
            const nextMonth = new Date(new Date().getFullYear(), new Date().getMonth() - i + 1, 1);
            monthLabels.push(month.toLocaleDateString('sw-TZ', { month: 'short' }));
            
            const { count } = await supabaseClient
                .from('users')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', month.toISOString())
                .lt('created_at', nextMonth.toISOString());
            
            monthData.push(count || 0);
        }
        
        const options = {
            series: [{ name: 'Users', data: monthData }],
            chart: { type: 'area', height: 250, background: 'transparent', foreColor: '#cbd5e1' },
            colors: ['#d4af37'],
            fill: { type: 'gradient', gradient: { opacityFrom: 0.7, opacityTo: 0.1 } },
            stroke: { curve: 'smooth', width: 2 },
            xaxis: { categories: monthLabels },
            theme: { mode: 'dark' }
        };
        
        const chart = new ApexCharts(document.getElementById('usersGrowthChart'), options);
        chart.render();
    } catch (e) {}
}

async function loadStorageChart() {
    let supabaseBytes = 0;
    try {
        const buckets = ['music', 'posts', 'videos', 'thumbnails', 'logos', 'pdfs'];
        for (const bucket of buckets) {
            try {
                const { data: files } = await supabaseClient.storage.from(bucket).list();
                if (files) {
                    files.forEach(function(file) { supabaseBytes += file.metadata?.size || 0; });
                }
            } catch (e) {}
        }
    } catch (e) {}
    
    const supabaseMB = parseFloat((supabaseBytes / (1024 * 1024)).toFixed(2));
    
    let cloudinaryCount = 0;
    let uploadcareCount = 0;
    try {
        const { data: posts } = await supabaseClient.from('posts').select('media_files');
        if (posts) {
            posts.forEach(function(post) {
                if (post.media_files) {
                    post.media_files.forEach(function(url) {
                        if (url.includes('cloudinary.com')) cloudinaryCount++;
                        if (url.includes('ucarecdn.com')) uploadcareCount++;
                    });
                }
            });
        }
    } catch (e) {}
    
    const options = {
        series: [supabaseMB, cloudinaryCount * 5, uploadcareCount * 2],
        labels: ['Supabase', 'Cloudinary', 'Uploadcare'],
        chart: { type: 'donut', height: 250, background: 'transparent' },
        colors: ['#2563eb', '#d4af37', '#10b981'],
        legend: { labels: { colors: '#cbd5e1' } },
        theme: { mode: 'dark' }
    };
    
    const chart = new ApexCharts(document.getElementById('storageChart'), options);
    chart.render();
}

async function loadPostsChart() {
    try {
        const postData = [0, 0, 0, 0, 0, 0, 0];
        const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
        weekStart.setHours(0, 0, 0, 0);
        
        const { data: posts } = await supabaseClient
            .from('posts')
            .select('created_at')
            .gte('created_at', weekStart.toISOString());
        
        if (posts) {
            posts.forEach(function(post) {
                const day = new Date(post.created_at).getDay();
                const index = day === 0 ? 6 : day - 1;
                postData[index]++;
            });
        }
        
        const options = {
            series: [{ name: 'Posts', data: postData }],
            chart: { type: 'bar', height: 250, background: 'transparent', foreColor: '#cbd5e1' },
            colors: ['#d4af37'],
            xaxis: { categories: dayLabels },
            plotOptions: { bar: { borderRadius: 5, columnWidth: '50%' } },
            theme: { mode: 'dark' }
        };
        
        const chart = new ApexCharts(document.getElementById('postsChart'), options);
        chart.render();
    } catch (e) {}
}

// ========== USER ACTIVITY FEED ==========
async function loadUserActivityFeed() {
    try {
        const { data: activities } = await supabaseClient
            .from('user_activities')
            .select('*, users(jina)')
            .order('created_at', { ascending: false })
            .limit(20);
        
        const feed = document.getElementById('userActivityFeed');
        feed.innerHTML = '';
        
        if (!activities || activities.length === 0) {
            feed.innerHTML = '<p class="no-data">Hakuna user activity bado</p>';
            return;
        }
        
        const activityIcons = {
            'like_post': 'fa-heart',
            'comment_post': 'fa-comment',
            'share_post': 'fa-share',
            'download_post': 'fa-download',
            'view_mtakatifu': 'fa-cross',
            'view_bible': 'fa-bible',
            'view_wimbo': 'fa-music',
            'vote_poll': 'fa-vote-yea',
            'register': 'fa-user-plus',
            'login': 'fa-sign-in-alt'
        };
        
        activities.forEach(function(activity) {
            const icon = activityIcons[activity.activity_type] || 'fa-circle';
            const userName = activity.users ? activity.users.jina : 'Unknown';
            
            const item = document.createElement('div');
            item.className = 'feed-item';
            item.innerHTML = '<i class="fas ' + icon + '"></i>' +
                '<div><strong>' + userName + '</strong>' +
                '<p>' + (activity.activity_details || activity.activity_type) + '</p>' +
                '<span>' + formatDate(activity.created_at) + '</span></div>';
            
            feed.appendChild(item);
        });
    } catch (e) {
        document.getElementById('userActivityFeed').innerHTML = '<p class="no-data">Imeshindikana kupakia</p>';
    }
}

// ========== OWNER ACTIVITY ==========
async function loadOwnerActivity() {
    try {
        const { data: activities } = await supabaseClient
            .from('activity_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);
        
        const list = document.getElementById('activityList');
        list.innerHTML = '';
        
        if (!activities || activities.length === 0) {
            list.innerHTML = '<p class="no-data">Hakuna activity bado</p>';
            return;
        }
        
        activities.forEach(function(activity) {
            const item = document.createElement('div');
            item.className = 'feed-item';
            item.innerHTML = '<i class="fas fa-circle"></i>' +
                '<div><strong>' + (activity.action || '') + '</strong>' +
                '<p>' + (activity.details || '') + '</p>' +
                '<span>' + formatDate(activity.created_at) + '</span></div>';
            
            list.appendChild(item);
        });
    } catch (e) {}
}

// ========== SETUP EVENTS ==========
function setupEvents(owner) {
    document.getElementById('logoutBtn').addEventListener('click', function() {
        logoutOwner();
    });
    
    document.getElementById('menuToggle').addEventListener('click', function() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('open');
    });
    
    document.getElementById('refreshBtn').addEventListener('click', function() {
        loadStatsWithTrends();
        loadHostingMonitor();
        loadUserActivityFeed();
        loadOwnerActivity();
    });
    
    document.querySelectorAll('.quick-action').forEach(function(btn) {
        btn.addEventListener('click', function() {
            window.location.href = this.getAttribute('data-page') + '.html';
        });
    });
    
    document.querySelectorAll('.sidebar-item').forEach(function(item) {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            if (page === 'dashboard') return;
            window.location.href = page + '.html';
        });
    });
    
    document.querySelectorAll('.bottom-nav-item').forEach(function(item) {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            if (page === 'dashboard') return;
            window.location.href = page + '.html';
        });
    });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
        return 'Leo ' + date.toLocaleTimeString('sw-TZ', { hour: '2-digit', minute: '2-digit' });
    }
    if (date.toDateString() === yesterday.toDateString()) {
        return 'Jana ' + date.toLocaleTimeString('sw-TZ', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('sw-TZ', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}