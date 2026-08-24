// ============================================
// KMCA OWNER - SETTINGS + INTRO MANAGEMENT
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const owner = requireOwnerAuth();
    if (!owner) return;
    
    loadSettings(owner);
    loadIntroSettings();
    loadAISettings();
    loadChatMessages();
    subscribeToChat();
    setupEvents(owner);
    setupIntroEvents(owner);
});

// ============================================
// INTRO SETTINGS MANAGEMENT
// ============================================

// Load Intro Settings
async function loadIntroSettings() {
    try {
        const { data: settings } = await supabaseClient
            .from('app_settings')
            .select('*')
            .like('setting_key', 'intro_%');
        
        if (settings) {
            settings.forEach(function(setting) {
                if (setting.setting_key === 'intro_logo_1' && setting.setting_value) {
                    document.getElementById('introLogo1Url').value = setting.setting_value;
                    showLogoPreview('introLogo1Preview', setting.setting_value);
                }
                if (setting.setting_key === 'intro_logo_2' && setting.setting_value) {
                    document.getElementById('introLogo2Url').value = setting.setting_value;
                    showLogoPreview('introLogo2Preview', setting.setting_value);
                }
                if (setting.setting_key === 'intro_logo_1_duration') {
                    document.getElementById('introLogo1Duration').value = setting.setting_value;
                }
                if (setting.setting_key === 'intro_logo_2_duration') {
                    document.getElementById('introLogo2Duration').value = setting.setting_value;
                }
                if (setting.setting_key === 'intro_text_1') {
                    document.getElementById('introText1').value = setting.setting_value;
                }
                if (setting.setting_key === 'intro_text_2') {
                    document.getElementById('introText2').value = setting.setting_value;
                }
                if (setting.setting_key === 'intro_duration') {
                    document.getElementById('introTotalDuration').value = setting.setting_value;
                }
                if (setting.setting_key === 'intro_dots_count') {
                    document.getElementById('introDotsCount').value = setting.setting_value;
                }
                if (setting.setting_key === 'intro_dots_speed') {
                    document.getElementById('introDotsSpeed').value = setting.setting_value;
                }
                if (setting.setting_key === 'intro_typewriter_speed') {
                    document.getElementById('introTypewriterSpeed').value = setting.setting_value;
                }
                if (setting.setting_key === 'intro_background_color') {
                    document.getElementById('introBackgroundColor').value = setting.setting_value;
                }
            });
        }
    } catch (e) {
        console.log('No intro settings found');
    }
}

// Show logo preview
function showLogoPreview(previewId, url) {
    const preview = document.getElementById(previewId);
    const img = preview.querySelector('img');
    img.src = url;
    preview.style.display = 'block';
}

// Setup Intro Events
function setupIntroEvents(owner) {
    // Logo 1 file upload
    document.getElementById('introLogo1File').addEventListener('change', async function() {
        const file = this.files[0];
        if (!file) return;
        
        const result = await uploadToCloudinary(file);
        if (result.success) {
            document.getElementById('introLogo1Url').value = result.url;
            showLogoPreview('introLogo1Preview', result.url);
        } else {
            alert('Upload imeshindikana: ' + result.error);
        }
    });
    
    // Logo 2 file upload
    document.getElementById('introLogo2File').addEventListener('change', async function() {
        const file = this.files[0];
        if (!file) return;
        
        const result = await uploadToCloudinary(file);
        if (result.success) {
            document.getElementById('introLogo2Url').value = result.url;
            showLogoPreview('introLogo2Preview', result.url);
        } else {
            alert('Upload imeshindikana: ' + result.error);
        }
    });
    
    // Save Intro Settings
    document.getElementById('saveIntroBtn').addEventListener('click', async function() {
        const logo1Url = document.getElementById('introLogo1Url').value;
        const logo2Url = document.getElementById('introLogo2Url').value;
        const logo1Duration = document.getElementById('introLogo1Duration').value;
        const logo2Duration = document.getElementById('introLogo2Duration').value;
        const text1 = document.getElementById('introText1').value.trim();
        const text2 = document.getElementById('introText2').value.trim();
        const totalDuration = document.getElementById('introTotalDuration').value;
        const dotsCount = document.getElementById('introDotsCount').value;
        const dotsSpeed = document.getElementById('introDotsSpeed').value;
        const typewriterSpeed = document.getElementById('introTypewriterSpeed').value;
        const backgroundColor = document.getElementById('introBackgroundColor').value;
        
        if (!text1 || !text2) {
            alert('Weka maneno yote mawili');
            return;
        }
        
        if (!logo1Url) {
            alert('Pakia logo ya kwanza');
            return;
        }
        
        const btn = this;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Inahifadhi...';
        
        try {
            const introSettings = [
                { key: 'intro_logo_1', value: logo1Url },
                { key: 'intro_logo_2', value: logo2Url || null },
                { key: 'intro_logo_1_duration', value: logo1Duration },
                { key: 'intro_logo_2_duration', value: logo2Duration },
                { key: 'intro_text_1', value: text1 },
                { key: 'intro_text_2', value: text2 },
                { key: 'intro_duration', value: totalDuration },
                { key: 'intro_dots_count', value: dotsCount },
                { key: 'intro_dots_speed', value: dotsSpeed },
                { key: 'intro_typewriter_speed', value: typewriterSpeed },
                { key: 'intro_background_color', value: backgroundColor }
            ];
            
            for (const setting of introSettings) {
                await supabaseClient
                    .from('app_settings')
                    .upsert({
                        setting_key: setting.key,
                        setting_value: setting.value,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'setting_key' });
            }
            
            alert('Intro settings zimehifadhiwa!');
        } catch (error) {
            alert('Imeshindikana: ' + error.message);
        }
        
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-save"></i> Hifadhi Intro Settings';
    });
}

// ============================================
// LOAD OTHER SETTINGS
// ============================================

async function loadSettings(owner) {
    document.getElementById('ownerJina').value = owner.jina || '';
    document.getElementById('ownerPhone').value = owner.phone || '';
    
    try {
        const { data } = await supabaseClient.from('app_settings').select('*');
        
        if (data) {
            data.forEach(function(setting) {
                if (setting.setting_key === 'app_name') document.getElementById('appName').value = setting.setting_value;
                if (setting.setting_key === 'app_subtitle') document.getElementById('appSubtitle').value = setting.setting_value;
                if (setting.setting_key === 'share_link') document.getElementById('shareLink').value = setting.setting_value;
            });
        }
    } catch (e) {}
    
    try {
        const { data: footer } = await supabaseClient.from('footer').select('*').limit(1);
        
        if (footer && footer.length > 0) {
            document.getElementById('footerMawasiliano').value = footer[0].mawasiliano || '';
            document.getElementById('footerEmail').value = footer[0].email || '';
            document.getElementById('footerPhone').value = footer[0].phone || '';
            document.getElementById('footerCopyright').value = footer[0].copyright || '';
        }
    } catch (e) {}
}

async function loadAISettings() {
    try {
        const { data } = await supabaseClient.from('ai_settings').select('*');
        
        if (data) {
            data.forEach(function(setting) {
                if (setting.setting_key === 'auto_extend_days') document.getElementById('aiAutoExtendDays').value = setting.setting_value;
                if (setting.setting_key === 'extension_trigger_days') document.getElementById('aiTriggerDays').value = setting.setting_value;
                if (setting.setting_key === 'storage_alert_percent') document.getElementById('aiStorageAlert').value = setting.setting_value;
                if (setting.setting_key === 'cleanup_days') document.getElementById('aiCleanupDays').value = setting.setting_value;
            });
        }
    } catch (e) {}
}

// ============================================
// OWNER CHAT
// ============================================

async function loadChatMessages() {
    try {
        const { data, error } = await supabaseClient
            .from('owner_chats')
            .select('*, owners(jina)')
            .order('created_at', { ascending: true })
            .limit(50);
        
        if (error) throw error;
        
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = '';
        
        if (!data || data.length === 0) {
            chatMessages.innerHTML = '<p class="no-data">Hakuna messages bado</p>';
            return;
        }
        
        data.forEach(function(message) {
            const div = document.createElement('div');
            div.style.cssText = 'margin-bottom: 10px; padding: 10px; background: #0f172a; border-radius: 8px;';
            
            div.innerHTML = '<strong style="color: #d4af37;">' + (message.owners ? message.owners.jina : 'Unknown') + '</strong>' +
                '<p style="color: #cbd5e1; font-size: 14px; margin: 5px 0;">' + message.message + '</p>' +
                '<span style="color: #94a3b8; font-size: 11px;">' + formatDate(message.created_at) + '</span>';
            
            chatMessages.appendChild(div);
        });
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (e) {
        document.getElementById('chatMessages').innerHTML = '<p class="no-data">Imeshindikana kupakia messages</p>';
    }
}

function subscribeToChat() {
    supabaseClient
        .channel('owner-chat-realtime')
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'owner_chats'
        }, function() {
            loadChatMessages();
        })
        .subscribe();
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
    
    // Profile
    document.getElementById('profileForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const jina = document.getElementById('ownerJina').value.trim();
        const phone = document.getElementById('ownerPhone').value.trim();
        
        try {
            await supabaseClient.from('owners').update({ jina: jina, phone: phone }).eq('id', owner.id);
            owner.jina = jina;
            owner.phone = phone;
            saveOwner(owner);
            alert('Profile imehifadhiwa!');
        } catch (error) {
            alert('Imeshindikana: ' + error.message);
        }
    });
    
    // PIN
    document.getElementById('pinForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const currentPin = document.getElementById('currentPin').value.trim();
        const newPin = document.getElementById('newPin').value.trim();
        const confirmPin = document.getElementById('confirmPin').value.trim();
        
        if (currentPin !== owner.pin) {
            alert('PIN ya sasa si sahihi');
            return;
        }
        
        if (newPin !== confirmPin || newPin.length !== 4) {
            alert('PIN mpya hazifanani au siyo namba 4');
            return;
        }
        
        try {
            await supabaseClient.from('owners').update({ pin: newPin }).eq('id', owner.id);
            owner.pin = newPin;
            saveOwner(owner);
            alert('PIN imebadilishwa!');
            document.getElementById('pinForm').reset();
        } catch (error) {
            alert('Imeshindikana: ' + error.message);
        }
    });
    
    // App Settings
    document.getElementById('appSettingsForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const appName = document.getElementById('appName').value.trim();
        const appSubtitle = document.getElementById('appSubtitle').value.trim();
        
        try {
            await supabaseClient.from('app_settings').upsert({ setting_key: 'app_name', setting_value: appName }, { onConflict: 'setting_key' });
            await supabaseClient.from('app_settings').upsert({ setting_key: 'app_subtitle', setting_value: appSubtitle }, { onConflict: 'setting_key' });
            alert('Settings zimehifadhiwa!');
        } catch (error) {
            alert('Imeshindikana: ' + error.message);
        }
    });
    
    // Share Link
    document.getElementById('shareLinkForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const shareLink = document.getElementById('shareLink').value.trim();
        
        try {
            await supabaseClient.from('app_settings').upsert({ setting_key: 'share_link', setting_value: shareLink }, { onConflict: 'setting_key' });
            alert('Share link imehifadhiwa!');
        } catch (error) {
            alert('Imeshindikana: ' + error.message);
        }
    });
    
    // About
    document.getElementById('aboutForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const title = document.getElementById('aboutTitle').value.trim();
        const content = document.getElementById('aboutContent').value.trim();
        
        if (!title || !content) return;
        
        try {
            await supabaseClient.from('about').insert([{ title: title, content: content }]);
            alert('About imehifadhiwa!');
            document.getElementById('aboutForm').reset();
        } catch (error) {
            alert('Imeshindikana: ' + error.message);
        }
    });
    
    // Footer
    document.getElementById('footerForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const mawasiliano = document.getElementById('footerMawasiliano').value.trim();
        const email = document.getElementById('footerEmail').value.trim();
        const phone = document.getElementById('footerPhone').value.trim();
        const copyright = document.getElementById('footerCopyright').value.trim();
        
        try {
            const { data: existingFooter } = await supabaseClient.from('footer').select('id').limit(1);
            
            if (existingFooter && existingFooter.length > 0) {
                await supabaseClient.from('footer').update({
                    mawasiliano: mawasiliano,
                    email: email,
                    phone: phone,
                    copyright: copyright
                }).eq('id', existingFooter[0].id);
            } else {
                await supabaseClient.from('footer').insert([{
                    mawasiliano: mawasiliano,
                    email: email,
                    phone: phone,
                    copyright: copyright
                }]);
            }
            
            alert('Footer imehifadhiwa!');
        } catch (error) {
            alert('Imeshindikana: ' + error.message);
        }
    });
    
    // AI Settings
    document.getElementById('aiSettingsForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const autoExtendDays = document.getElementById('aiAutoExtendDays').value;
        const triggerDays = document.getElementById('aiTriggerDays').value;
        const storageAlert = document.getElementById('aiStorageAlert').value;
        const cleanupDays = document.getElementById('aiCleanupDays').value;
        
        try {
            await supabaseClient.from('ai_settings').upsert({ setting_key: 'auto_extend_days', setting_value: autoExtendDays }, { onConflict: 'setting_key' });
            await supabaseClient.from('ai_settings').upsert({ setting_key: 'extension_trigger_days', setting_value: triggerDays }, { onConflict: 'setting_key' });
            await supabaseClient.from('ai_settings').upsert({ setting_key: 'storage_alert_percent', setting_value: storageAlert }, { onConflict: 'setting_key' });
            await supabaseClient.from('ai_settings').upsert({ setting_key: 'cleanup_days', setting_value: cleanupDays }, { onConflict: 'setting_key' });
            
            alert('AI Settings zimehifadhiwa!');
        } catch (error) {
            alert('Imeshindikana: ' + error.message);
        }
    });
    
    // Chat
    document.getElementById('chatForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const message = document.getElementById('chatInput').value.trim();
        
        if (!message) return;
        
        try {
            await supabaseClient.from('owner_chats').insert([{
                owner_id: owner.id,
                message: message
            }]);
            
            document.getElementById('chatInput').value = '';
        } catch (error) {
            alert('Imeshindikana: ' + error.message);
        }
    });
    
    document.querySelectorAll('.sidebar-item').forEach(function(item) {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            if (page === 'settings') return;
            window.location.href = page + '.html';
        });
    });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('sw-TZ', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}