// ============================================
// KMCA OWNER - AI SCHEDULES + AI CONTENT FETCHER
// COMPLETE VERSION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const owner = requireOwnerAuth();
    if (!owner) return;
    
    loadStats();
    loadContentStats();
    loadSchedules();
    loadContentLog();
    loadReports();
    setupEvents(owner);
    startAIAutomation(owner);
});

// ============================================
// AI AUTOMATION SYSTEM
// ============================================

let aiRunning = false;

async function startAIAutomation(owner) {
    console.log('🤖 AI Automation System inaanza...');
    
    // Run mara moja wakati page inafunguliwa
    await runAICycle(owner);
    
    // Check kila dakika
    setInterval(async () => {
        await runAICycle(owner);
    }, 60000); // Kila dakika 1
}

async function runAICycle(owner) {
    if (aiRunning) return;
    aiRunning = true;
    
    try {
        const now = new Date();
        const currentTime = now.toTimeString().slice(0, 5); // HH:MM
        
        // Get active schedules
        const { data: schedules } = await supabaseClient
            .from('ai_schedules')
            .select('*')
            .eq('status', 'active');
        
        if (!schedules || schedules.length === 0) {
            aiRunning = false;
            return;
        }
        
        for (const schedule of schedules) {
            // Check kama ni wakati wa kupost
            if (schedule.posting_time && schedule.posting_time.slice(0, 5) !== currentTime) {
                continue;
            }
            
            // Check kama tayari imepostwa leo
            const today = now.toISOString().split('T')[0];
            if (schedule.last_run_date === today) {
                continue;
            }
            
            // Check tarehe
            if (today < schedule.start_date || today > schedule.end_date) {
                continue;
            }
            
            // Run schedule
            await runSchedule(schedule, owner, today);
        }
    } catch (e) {
        console.error('AI cycle error:', e);
    }
    
    aiRunning = false;
}

async function runSchedule(schedule, owner, today) {
    console.log('📅 Running schedule:', schedule.name);
    
    const results = {
        posted: 0,
        failed: 0,
        skipped: 0
    };
    
    // Process each content type
    for (const contentType of schedule.content_types) {
        try {
            if (contentType === 'watakatifu') {
                const saint = await fetchSaintOfTheDay();
                if (saint) {
                    await postSaint(saint, schedule, owner);
                    results.posted++;
                    await logContent(schedule.id, 'watakatifu', saint.jina, 'posted');
                } else {
                    results.skipped++;
                    await logContent(schedule.id, 'watakatifu', 'No saint found', 'skipped');
                }
            }
            
            if (contentType === 'bible_verses') {
                const verse = await fetchDailyBibleVerse();
                if (verse) {
                    await postBibleVerse(verse, schedule, owner);
                    results.posted++;
                    await logContent(schedule.id, 'bible_verses', verse.reference, 'posted');
                } else {
                    results.skipped++;
                    await logContent(schedule.id, 'bible_verses', 'No verse found', 'skipped');
                }
            }
            
            if (contentType === 'masomo') {
                const masomo = await fetchMasomoYaDominica();
                if (masomo) {
                    await postMasomo(masomo, schedule, owner);
                    results.posted++;
                    await logContent(schedule.id, 'masomo', masomo.jina_dominika, 'posted');
                } else {
                    results.skipped++;
                    await logContent(schedule.id, 'masomo', 'No masomo found', 'skipped');
                }
            }
            
            if (contentType === 'nyimbo') {
                const wimbo = await fetchWimboWaSiku();
                if (wimbo) {
                    await postWimbo(wimbo, schedule, owner);
                    results.posted++;
                    await logContent(schedule.id, 'nyimbo', wimbo.jina, 'posted');
                } else {
                    results.skipped++;
                    await logContent(schedule.id, 'nyimbo', 'No wimbo found', 'skipped');
                }
            }
        } catch (error) {
            results.failed++;
            await logContent(schedule.id, contentType, 'Error: ' + error.message, 'failed');
        }
    }
    
    // Update schedule
    await supabaseClient
        .from('ai_schedules')
        .update({
            last_run_date: today,
            last_run_status: 'completed'
        })
        .eq('id', schedule.id);
    
    // Create report
    await supabaseClient.from('ai_reports').insert([{
        schedule_id: schedule.id,
        report_date: today,
        content_posted: results.posted,
        content_failed: results.failed,
        content_skipped: results.skipped,
        details: { schedule: schedule.name }
    }]);
    
    // Notify owner
    await supabaseClient.from('owner_notifications').insert([{
        owner_id: owner.id,
        type: 'daily_report',
        title: '📊 AI Report: ' + schedule.name,
        content: '✅ Posted: ' + results.posted + '\n❌ Failed: ' + results.failed + '\n⏭️ Skipped: ' + results.skipped,
        is_read: false
    }]);
    
    console.log('✅ Schedule completed:', schedule.name, results);
    
    // Reload data
    loadReports();
    loadContentLog();
    loadContentStats();
}

// ============================================
// AI CONTENT FETCHER - WATAKATIFU
// ============================================

async function fetchSaintOfTheDay() {
    try {
        const now = new Date();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        
        const response = await fetch(
            'https://catholic-saints-api.herokuapp.com/api/saints/' + month + '/' + day
        );
        
        if (response.ok) {
            const data = await response.json();
            
            if (data && data.length > 0) {
                const saint = data[0];
                
                return {
                    jina: saint.name || 'Mtakatifu wa leo',
                    sikukuu: now.toISOString().split('T')[0],
                    historia: saint.history || '',
                    sala: saint.prayer || '',
                    miujiza: saint.miracles || '',
                    picha: saint.image_url || null
                };
            }
        }
        
        return await fetchSaintFromWikipedia(month, day);
    } catch (e) {
        console.error('Error fetching saint:', e);
        return null;
    }
}

async function fetchSaintFromWikipedia(month, day) {
    try {
        const response = await fetch(
            'https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=saint%20of%20the%20day%20' + month + '%20' + day + '&format=json&origin=*'
        );
        
        const data = await response.json();
        
        if (data.query && data.query.search && data.query.search.length > 0) {
            const title = data.query.search[0].title;
            
            const detailsResponse = await fetch(
                'https://en.wikipedia.org/w/api.php?action=query&titles=' + encodeURIComponent(title) + '&prop=extracts&exintro=1&format=json&origin=*'
            );
            
            const detailsData = await detailsResponse.json();
            const pages = detailsData.query.pages;
            const pageId = Object.keys(pages)[0];
            const extract = pages[pageId].extract || '';
            
            return {
                jina: title.replace('Saint ', 'Mtakatifu '),
                sikukuu: new Date().toISOString().split('T')[0],
                historia: stripHtml(extract).substring(0, 500),
                sala: '',
                miujiza: '',
                picha: null
            };
        }
        
        return null;
    } catch (e) {
        console.error('Error fetching from Wikipedia:', e);
        return null;
    }
}

// ============================================
// AI CONTENT FETCHER - BIBLE VERSES
// ============================================

async function fetchDailyBibleVerse() {
    try {
        const response = await fetch(
            'https://bible.usccb.org/bible/readings/' + 
            new Date().toISOString().split('T')[0] + '.json',
            { headers: { 'Accept': 'application/json' } }
        );
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.readings && data.readings.length > 0) {
                const firstReading = data.readings[0];
                
                return {
                    kichwa: firstReading.title || 'Somo la Leo',
                    tarehe: new Date().toISOString().split('T')[0],
                    verse_text: firstReading.text || '',
                    reference: firstReading.reference || '',
                    funzo: firstReading.reflection || ''
                };
            }
        }
        
        return await fetchVerseFromDailyGospel();
    } catch (e) {
        console.error('Error fetching verse:', e);
        return null;
    }
}

async function fetchVerseFromDailyGospel() {
    try {
        const response = await fetch('https://dailygospel.org/');
        const text = await response.text();
        
        const verseMatch = text.match(/"verse_text":"([^"]+)"/);
        const refMatch = text.match(/"reference":"([^"]+)"/);
        
        if (verseMatch && refMatch) {
            return {
                kichwa: 'Neno la Leo',
                tarehe: new Date().toISOString().split('T')[0],
                verse_text: verseMatch[1],
                reference: refMatch[1],
                funzo: ''
            };
        }
        
        return null;
    } catch (e) {
        console.error('Error fetching from Daily Gospel:', e);
        return null;
    }
}

// ============================================
// AI CONTENT FETCHER - MASOMO YA DOMINICA
// ============================================

async function fetchMasomoYaDominica() {
    try {
        const today = new Date();
        const dayOfWeek = today.getDay();
        
        if (dayOfWeek !== 0) {
            console.log('Sio Jumapili, hakuna masomo ya dominica');
            return null;
        }
        
        const response = await fetch(
            'https://bible.usccb.org/bible/readings/' + 
            today.toISOString().split('T')[0] + '.json',
            { headers: { 'Accept': 'application/json' } }
        );
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.readings && data.readings.length >= 3) {
                return {
                    jina_dominika: getDominikaName(today),
                    tarehe_jumapili: today.toISOString().split('T')[0],
                    somo_1: data.readings[0].text || '',
                    wimbo_katikati: data.readings[1]?.text || '',
                    somo_2: data.readings[1]?.text || '',
                    shangilio: data.readings[2]?.text || '',
                    injili: data.readings[2]?.text || ''
                };
            }
        }
        
        return await fetchMasomoFromCNA(today);
    } catch (e) {
        console.error('Error fetching masomo:', e);
        return null;
    }
}

async function fetchMasomoFromCNA(date) {
    try {
        const response = await fetch('https://www.catholicnewsagency.com/readings');
        const text = await response.text();
        
        const somo1Match = text.match(/first_reading":\s*"([^"]+)"/);
        const somo2Match = text.match(/second_reading":\s*"([^"]+)"/);
        const injiliMatch = text.match(/gospel":\s*"([^"]+)"/);
        
        if (somo1Match && injiliMatch) {
            return {
                jina_dominika: getDominikaName(date),
                tarehe_jumapili: date.toISOString().split('T')[0],
                somo_1: somo1Match[1],
                wimbo_katikati: '',
                somo_2: somo2Match ? somo2Match[1] : '',
                shangilio: '',
                injili: injiliMatch[1]
            };
        }
        
        return null;
    } catch (e) {
        console.error('Error fetching from CNA:', e);
        return null;
    }
}

function getDominikaName(date) {
    const year = date.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const dayOfYear = Math.floor((date - startOfYear) / (1000 * 60 * 60 * 24));
    const dominikaNumber = Math.floor(dayOfYear / 7) + 1;
    
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    if (month === 11 && day >= 27 || month === 12 && day <= 24) {
        const adventWeek = Math.floor((day - 27) / 7) + 1;
        return 'Dominika ya ' + adventWeek + ' ya Advent';
    }
    
    if (month === 12 && day >= 25 || month === 1 && day <= 10) {
        return 'Dominika ya Krismasi';
    }
    
    if (month >= 2 && month <= 4) {
        const lentWeek = Math.floor((day - 14) / 7) + 1;
        if (lentWeek > 0 && lentWeek <= 6) {
            return 'Dominika ya ' + lentWeek + ' ya Kwaresima';
        }
    }
    
    if (month >= 4 && month <= 5) {
        const easterWeek = Math.floor((day - 1) / 7) + 1;
        if (easterWeek <= 8) {
            return 'Dominika ya ' + easterWeek + ' ya Pasaka';
        }
    }
    
    return 'Dominika ya ' + dominikaNumber + ' ya Mwaka';
}

// ============================================
// AI CONTENT FETCHER - WIMBO WA SIKU
// ============================================

async function fetchWimboWaSiku() {
    try {
        const searchTerms = [
            'nyimbo za katoliki kiswahili',
            'catholic songs swahili',
            'tenzi za rohoni kiswahili'
        ];
        
        const randomTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
        
        const response = await fetch(
            'https://itunes.apple.com/search?term=' + encodeURIComponent(randomTerm) + '&entity=song&limit=25'
        );
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.results && data.results.length > 0) {
                const randomIndex = Math.floor(Math.random() * data.results.length);
                const song = data.results[randomIndex];
                
                return {
                    jina: song.trackName || 'Wimbo wa Siku',
                    maelezo: (song.artistName || '') + ' - ' + (song.collectionName || ''),
                    media_type: 'audio',
                    media_file: song.previewUrl || song.trackViewUrl || '',
                    tarehe: new Date().toISOString().split('T')[0]
                };
            }
        }
        
        return await fetchWimboFromDeezer();
    } catch (e) {
        console.error('Error fetching wimbo:', e);
        return null;
    }
}

async function fetchWimboFromDeezer() {
    try {
        const response = await fetch(
            'https://api.deezer.com/search?q=catholic%20swahili%20songs&limit=25'
        );
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.data && data.data.length > 0) {
                const randomIndex = Math.floor(Math.random() * data.data.length);
                const song = data.data[randomIndex];
                
                return {
                    jina: song.title || 'Wimbo wa Siku',
                    maelezo: song.artist ? song.artist.name : '',
                    media_type: 'audio',
                    media_file: song.preview || song.link || '',
                    tarehe: new Date().toISOString().split('T')[0]
                };
            }
        }
        
        return null;
    } catch (e) {
        console.error('Error fetching from Deezer:', e);
        return null;
    }
}

// ============================================
// AI TRANSLATOR
// ============================================

async function translateToKiswahili(text) {
    if (!text) return '';
    
    try {
        const response = await fetch(
            'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(text.substring(0, 450)) + '&langpair=en|sw'
        );
        
        const data = await response.json();
        
        if (data.responseData && data.responseData.translatedText) {
            return data.responseData.translatedText;
        }
        
        return text;
    } catch (e) {
        console.error('Translation error:', e);
        return text;
    }
}

// ============================================
// AI SUMMARIZER
// ============================================

function summarizeText(text, maxLength = 200) {
    if (!text) return '';
    
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    let summary = '';
    
    for (const sentence of sentences) {
        if (summary.length + sentence.length > maxLength) break;
        summary += sentence.trim() + '. ';
    }
    
    return summary.trim();
}

// ============================================
// AI POSTERS
// ============================================

async function postSaint(saint, schedule, owner) {
    try {
        const historiaSw = await translateToKiswahili(saint.historia);
        const historiaFupi = summarizeText(historiaSw, 200);
        
        await supabaseClient.from('posts').insert([{
            title: saint.jina,
            description: historiaFupi || 'Mtakatifu wa leo',
            type: 'picha_moja',
            media_files: saint.picha ? [saint.picha] : null,
            created_at: new Date().toISOString()
        }]);
        
        await supabaseClient.from('watakatifu').insert([{
            jina: saint.jina,
            sikukuu: saint.sikukuu,
            historia: historiaFupi || saint.historia,
            sala: saint.sala || null,
            miujiza: saint.miujiza || null,
            picha_file: saint.picha || null
        }]);
        
        console.log('✅ Mtakatifu posted:', saint.jina);
    } catch (e) {
        console.error('Error posting saint:', e);
        throw e;
    }
}

async function postBibleVerse(verse, schedule, owner) {
    try {
        const funzoSw = await translateToKiswahili(verse.funzo);
        
        await supabaseClient.from('posts').insert([{
            title: verse.kichwa,
            description: verse.verse_text + '\n\n' + verse.reference + '\n\n' + funzoSw,
            type: 'maneno',
            created_at: new Date().toISOString()
        }]);
        
        await supabaseClient.from('bible_verses').insert([{
            kichwa: verse.kichwa,
            tarehe: verse.tarehe,
            verse_text: verse.verse_text,
            reference: verse.reference,
            funzo: funzoSw || verse.funzo
        }]);
        
        console.log('✅ Bible verse posted:', verse.reference);
    } catch (e) {
        console.error('Error posting verse:', e);
        throw e;
    }
}

async function postMasomo(masomo, schedule, owner) {
    try {
        const somo1Sw = await translateToKiswahili(masomo.somo_1);
        const somo2Sw = await translateToKiswahili(masomo.somo_2);
        const injiliSw = await translateToKiswahili(masomo.injili);
        
        await supabaseClient.from('masomo_dominica').insert([{
            jina_dominika: masomo.jina_dominika,
            tarehe_jumapili: masomo.tarehe_jumapili,
            somo_1: somo1Sw || masomo.somo_1,
            wimbo_katikati: masomo.wimbo_katikati || null,
            somo_2: somo2Sw || masomo.somo_2,
            shangilio: masomo.shangilio || null,
            injili: injiliSw || masomo.injili
        }]);
        
        const postContent = 
            '📖 ' + masomo.jina_dominika + '\n\n' +
            'SOMO LA 1:\n' + (somo1Sw || masomo.somo_1) + '\n\n' +
            'SOMO LA 2:\n' + (somo2Sw || masomo.somo_2) + '\n\n' +
            'INJILI:\n' + (injiliSw || masomo.injili);
        
        await supabaseClient.from('posts').insert([{
            title: masomo.jina_dominika,
            description: postContent,
            type: 'maneno',
            created_at: new Date().toISOString()
        }]);
        
        console.log('✅ Masomo posted:', masomo.jina_dominika);
    } catch (e) {
        console.error('Error posting masomo:', e);
        throw e;
    }
}

async function postWimbo(wimbo, schedule, owner) {
    try {
        await supabaseClient.from('nyimbo_za_siku').insert([{
            jina: wimbo.jina,
            tarehe: wimbo.tarehe,
            maelezo: wimbo.maelezo || null,
            media_type: wimbo.media_type,
            media_file: wimbo.media_file
        }]);
        
        await supabaseClient.from('posts').insert([{
            title: '🎵 ' + wimbo.jina,
            description: wimbo.maelezo || 'Wimbo wa Siku',
            type: 'picha_music',
            media_files: null,
            audio_file: wimbo.media_file,
            created_at: new Date().toISOString()
        }]);
        
        console.log('✅ Wimbo posted:', wimbo.jina);
    } catch (e) {
        console.error('Error posting wimbo:', e);
        throw e;
    }
}

// ============================================
// LOGGING
// ============================================

async function logContent(scheduleId, contentType, title, status, errorMessage = null) {
    try {
        await supabaseClient.from('ai_content_log').insert([{
            schedule_id: scheduleId,
            content_type: contentType,
            content_title: title,
            content_date: new Date().toISOString().split('T')[0],
            status: status,
            error_message: errorMessage
        }]);
    } catch (e) {
        console.error('Error logging content:', e);
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function stripHtml(html) {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
}

// ============================================
// LOAD STATS
// ============================================

async function loadStats() {
    try {
        const { data: schedules } = await supabaseClient
            .from('ai_schedules')
            .select('status');
        
        const total = schedules.length;
        const active = schedules.filter(s => s.status === 'active').length;
        const paused = schedules.filter(s => s.status === 'paused').length;
        const completed = schedules.filter(s => s.status === 'completed').length;
        
        document.getElementById('totalSchedules').textContent = total;
        document.getElementById('activeSchedules').textContent = active;
        document.getElementById('pausedSchedules').textContent = paused;
        document.getElementById('completedSchedules').textContent = completed;
    } catch (e) {
        console.error('Error loading stats:', e);
    }
}

// ============================================
// LOAD CONTENT STATS
// ============================================

async function loadContentStats() {
    try {
        const { data: log } = await supabaseClient
            .from('ai_content_log')
            .select('content_type, status');
        
        const saints = log.filter(l => l.content_type === 'watakatifu' && l.status === 'posted').length;
        const verses = log.filter(l => l.content_type === 'bible_verses' && l.status === 'posted').length;
        const masomo = log.filter(l => l.content_type === 'masomo' && l.status === 'posted').length;
        const nyimbo = log.filter(l => l.content_type === 'nyimbo' && l.status === 'posted').length;
        
        document.getElementById('totalSaints').textContent = saints;
        document.getElementById('totalVerses').textContent = verses;
        document.getElementById('totalMasomo').textContent = masomo;
        document.getElementById('totalNyimbo').textContent = nyimbo;
    } catch (e) {
        console.error('Error loading content stats:', e);
    }
}

// ============================================
// LOAD SCHEDULES
// ============================================

async function loadSchedules() {
    try {
        const { data, error } = await supabaseClient
            .from('ai_schedules')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const list = document.getElementById('schedulesList');
        list.innerHTML = '';
        
        if (!data || data.length === 0) {
            list.innerHTML = '<p class="no-data">Hakuna ratiba bado. Bonyeza + kuweka ratiba mpya.</p>';
            return;
        }
        
        const statusColors = {
            'active': '#10b981',
            'paused': '#f59e0b',
            'pending': '#2563eb',
            'completed': '#94a3b8',
            'cancelled': '#ef4444'
        };
        
        data.forEach(function(schedule) {
            const item = document.createElement('div');
            item.style.cssText = 'padding: 15px; border-bottom: 1px solid #334155;';
            
            item.innerHTML = 
                '<div style="display: flex; justify-content: space-between; align-items: flex-start;">' +
                '<div style="flex: 1;">' +
                '<strong style="color: #d4af37;">' + schedule.name + '</strong>' +
                '<p style="color: #94a3b8; font-size: 12px;">' + 
                formatDate(schedule.start_date) + ' - ' + formatDate(schedule.end_date) + 
                '</p>' +
                '<p style="color: #94a3b8; font-size: 11px;">' + 
                'Content: ' + (schedule.content_types ? schedule.content_types.join(', ') : '') + 
                ' | Muda: ' + schedule.posting_time + 
                ' | Extensions: ' + schedule.extension_count + 
                '</p>' +
                '<span style="background: ' + (statusColors[schedule.status] || '#94a3b8') + '20; color: ' + (statusColors[schedule.status] || '#94a3b8') + '; padding: 3px 10px; border-radius: 15px; font-size: 11px;">' + 
                schedule.status + 
                '</span>' +
                '</div>' +
                '<div style="display: flex; gap: 5px;">' +
                (schedule.status === 'active' ? 
                    '<button type="button" class="btn-pause-schedule" data-id="' + schedule.id + '" style="background: #f59e0b; color: #fff; border: none; padding: 8px; border-radius: 5px; cursor: pointer;"><i class="fas fa-pause"></i></button>' : '') +
                (schedule.status === 'paused' ? 
                    '<button type="button" class="btn-resume-schedule" data-id="' + schedule.id + '" style="background: #10b981; color: #fff; border: none; padding: 8px; border-radius: 5px; cursor: pointer;"><i class="fas fa-play"></i></button>' : '') +
                '<button type="button" class="btn-delete-schedule" data-id="' + schedule.id + '" style="background: #ef4444; color: #fff; border: none; padding: 8px; border-radius: 5px; cursor: pointer;"><i class="fas fa-trash"></i></button>' +
                '</div>' +
                '</div>';
            
            list.appendChild(item);
        });
        
        document.querySelectorAll('.btn-pause-schedule').forEach(function(btn) {
            btn.addEventListener('click', async function() {
                if (confirm('Pause ratiba hii?')) {
                    await supabaseClient.from('ai_schedules').update({ status: 'paused' }).eq('id', this.getAttribute('data-id'));
                    loadStats();
                    loadSchedules();
                }
            });
        });
        
        document.querySelectorAll('.btn-resume-schedule').forEach(function(btn) {
            btn.addEventListener('click', async function() {
                if (confirm('Resume ratiba hii?')) {
                    await supabaseClient.from('ai_schedules').update({ status: 'active' }).eq('id', this.getAttribute('data-id'));
                    loadStats();
                    loadSchedules();
                }
            });
        });
        
        document.querySelectorAll('.btn-delete-schedule').forEach(function(btn) {
            btn.addEventListener('click', async function() {
                if (confirm('Futa ratiba hii?')) {
                    await supabaseClient.from('ai_schedules').delete().eq('id', this.getAttribute('data-id'));
                    loadStats();
                    loadSchedules();
                }
            });
        });
    } catch (e) {
        document.getElementById('schedulesList').innerHTML = '<p class="no-data">Imeshindikana kupakia ratiba</p>';
    }
}

// ============================================
// LOAD CONTENT LOG
// ============================================

async function loadContentLog() {
    try {
        const { data, error } = await supabaseClient
            .from('ai_content_log')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);
        
        if (error) throw error;
        
        const list = document.getElementById('contentLogList');
        list.innerHTML = '';
        
        if (!data || data.length === 0) {
            list.innerHTML = '<p class="no-data">Hakuna content log bado. AI itaonyesha hapa ikishapost content.</p>';
            return;
        }
        
        const typeIcons = {
            'watakatifu': 'fa-cross',
            'bible_verses': 'fa-bible',
            'masomo': 'fa-book-open',
            'nyimbo': 'fa-music'
        };
        
        const statusColors = {
            'posted': '#10b981',
            'failed': '#ef4444',
            'skipped': '#f59e0b',
            'duplicated': '#94a3b8'
        };
        
        data.forEach(function(log) {
            const item = document.createElement('div');
            item.style.cssText = 'display: flex; align-items: center; gap: 12px; padding: 12px; border-bottom: 1px solid #334155;';
            
            const icon = typeIcons[log.content_type] || 'fa-circle';
            const statusColor = statusColors[log.status] || '#94a3b8';
            
            item.innerHTML = 
                '<i class="fas ' + icon + '" style="color: #d4af37; font-size: 16px;"></i>' +
                '<div style="flex: 1;">' +
                '<strong style="color: #cbd5e1; font-size: 13px;">' + log.content_title + '</strong>' +
                '<p style="color: #94a3b8; font-size: 11px;">' + log.content_type + ' | ' + formatDate(log.content_date) + '</p>' +
                '</div>' +
                '<span style="color: ' + statusColor + '; font-size: 11px; font-weight: 600;">' + log.status + '</span>';
            
            list.appendChild(item);
        });
    } catch (e) {
        document.getElementById('contentLogList').innerHTML = '<p class="no-data">Imeshindikana kupakia log</p>';
    }
}

// ============================================
// LOAD REPORTS
// ============================================

async function loadReports() {
    try {
        const { data, error } = await supabaseClient
            .from('ai_reports')
            .select('*')
            .order('report_date', { ascending: false })
            .limit(10);
        
        if (error) throw error;
        
        const list = document.getElementById('reportsList');
        list.innerHTML = '';
        
        if (!data || data.length === 0) {
            list.innerHTML = '<p class="no-data">Hakuna ripoti bado</p>';
            return;
        }
        
        data.forEach(function(report) {
            const item = document.createElement('div');
            item.style.cssText = 'padding: 12px; border-bottom: 1px solid #334155;';
            
            item.innerHTML = 
                '<div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px;">' +
                '<span style="color: #cbd5e1; font-size: 13px;">' + formatDate(report.report_date) + '</span>' +
                '<span style="color: #10b981; font-size: 12px;">✅ ' + report.content_posted + ' posted</span>' +
                '<span style="color: #ef4444; font-size: 12px;">❌ ' + report.content_failed + ' failed</span>' +
                '<span style="color: #f59e0b; font-size: 12px;">⏭️ ' + report.content_skipped + ' skipped</span>' +
                '</div>';
            
            list.appendChild(item);
        });
    } catch (e) {
        document.getElementById('reportsList').innerHTML = '<p class="no-data">Imeshindikana kupakia ripoti</p>';
    }
}

// ============================================
// SETUP EVENTS
// ============================================

function setupEvents(owner) {
    document.getElementById('menuToggle').addEventListener('click', function() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('open');
    });
    
    document.getElementById('logoutBtn').addEventListener('click', function() {
        logoutOwner();
    });
    
    document.getElementById('refreshBtn').addEventListener('click', function() {
        loadStats();
        loadContentStats();
        loadSchedules();
        loadContentLog();
        loadReports();
        alert('Data imerefreshwa!');
    });
    
    document.getElementById('runNowBtn').addEventListener('click', async function() {
        if (confirm('Run AI sasa hivi?')) {
            await runAICycle(owner);
            loadStats();
            loadContentStats();
            loadSchedules();
            loadContentLog();
            loadReports();
        }
    });
    
    document.getElementById('addScheduleBtn').addEventListener('click', function() {
        document.getElementById('addScheduleModal').style.display = 'flex';
    });
    
    document.getElementById('addScheduleClose').addEventListener('click', function() {
        document.getElementById('addScheduleModal').style.display = 'none';
    });
    
    document.getElementById('addScheduleForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const name = document.getElementById('scheduleName').value.trim();
        const description = document.getElementById('scheduleDescription').value.trim();
        const startDate = document.getElementById('scheduleStartDate').value;
        const endDate = document.getElementById('scheduleEndDate').value;
        const postingTime = document.getElementById('schedulePostingTime').value;
        
        if (!name || !startDate || !endDate || !postingTime) {
            alert('Jaza vipengele vyote vya lazima');
            return;
        }
        
        const contentTypes = [];
        document.querySelectorAll('.content-type-checkbox:checked').forEach(function(cb) {
            contentTypes.push(cb.value);
        });
        
        if (contentTypes.length === 0) {
            alert('Chagua angalau content type moja');
            return;
        }
        
        try {
            await supabaseClient.from('ai_schedules').insert([{
                name: name,
                description: description || null,
                start_date: startDate,
                end_date: endDate,
                posting_time: postingTime,
                content_types: contentTypes,
                status: 'active',
                created_by: owner.id
            }]);
            
            alert('Ratiba imehifadhiwa!');
            document.getElementById('addScheduleModal').style.display = 'none';
            document.getElementById('addScheduleForm').reset();
            loadStats();
            loadSchedules();
        } catch (error) {
            alert('Imeshindikana: ' + error.message);
        }
    });
    
    document.querySelectorAll('.sidebar-item').forEach(function(item) {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            if (page === 'ai-schedules') return;
            window.location.href = page + '.html';
        });
    });
    
    document.querySelectorAll('.bottom-nav-item').forEach(function(item) {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            if (page === 'ai-schedules') return;
            window.location.href = page + '.html';
        });
    });
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('sw-TZ', { day: 'numeric', month: 'short', year: 'numeric' });
}