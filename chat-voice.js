// ═══════════════════════════════════════════════════════════════
// KMCA OWNER CHAT — VOICE NOTES MODULE
// Version: 1.0
// Record + Play + Waveform + Upload
// ═══════════════════════════════════════════════════════════════

(function() {
    'use strict';
    
    // ═══════════════════════════════════════════════════════════════
    // CONFIG
    // ═══════════════════════════════════════════════════════════════
    
    const CONFIG = window.HOSTING_CONFIG || {};
    const SUPABASE_URL = CONFIG.supabase?.url;
    const SUPABASE_ANON_KEY = CONFIG.supabase?.anonKey;
    
    const VOICE_CONFIG = {
        maxDuration: 300,           // Dakika 5 max
        minDuration: 1,             // Sekunde 1 min
        sampleRate: 44100,
        audioBitsPerSecond: 128000,
        mimeType: 'audio/webm;codecs=opus',
        chunkInterval: 100,         // Millisekunde
        waveformBars: 40,
        cancelSwipeThreshold: 100   // Pixels juu kwa cancel
    };
    
    // ═══════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════
    
    const state = {
        // Recording
        mediaRecorder: null,
        audioContext: null,
        analyser: null,
        stream: null,
        chunks: [],
        startTime: null,
        timerInterval: null,
        waveformInterval: null,
        isRecording: false,
        isCancelling: false,
        recordingDuration: 0,
        startY: 0,
        currentY: 0,
        
        // Playback
        currentAudio: null,
        currentPlayingId: null,
        playbackRate: 1,
        allVoiceElements: new Map(),
        
        // Callbacks
        onSend: null,
        onError: null
    };
    
    // ═══════════════════════════════════════════════════════════════
    // INIT
    // ═══════════════════════════════════════════════════════════════
    
    function init(options = {}) {
        console.log('🎤 Voice notes module initializing...');
        
        state.onSend = options.onSend || null;
        state.onError = options.onError || null;
        
        // Check support
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.warn('⚠️ MediaDevices haitumiki kwenye browser hii');
        }
        
        if (!window.MediaRecorder) {
            console.warn('⚠️ MediaRecorder haitumiki kwenye browser hii');
        }
        
        console.log('✅ Voice notes ready');
        
        return {
            startRecording,
            stopRecording,
            cancelRecording,
            playVoice,
            pauseVoice,
            togglePlayback,
            seekVoice,
            setPlaybackRate,
            attachToAllVoiceElements,
            cleanup
        };
    }
    
    // ═══════════════════════════════════════════════════════════════
    // START RECORDING
    // ═══════════════════════════════════════════════════════════════
    
    async function startRecording() {
        if (state.isRecording) {
            console.warn('⚠️ Tayari inarekodi');
            return { success: false, error: 'Already recording' };
        }
        
        try {
            console.log('🎤 Starting recording...');
            
            // Get media stream
            state.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: VOICE_CONFIG.sampleRate
                }
            });
            
            // Check mime type support
            let mimeType = VOICE_CONFIG.mimeType;
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = 'audio/webm';
                if (!MediaRecorder.isTypeSupported(mimeType)) {
                    mimeType = 'audio/mp4';
                }
            }
            
            console.log('📼 Mime type:', mimeType);
            
            // Create MediaRecorder
            state.mediaRecorder = new MediaRecorder(state.stream, {
                mimeType: mimeType,
                audioBitsPerSecond: VOICE_CONFIG.audioBitsPerSecond
            });
            
            state.chunks = [];
            
            // Handle data
            state.mediaRecorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                    state.chunks.push(e.data);
                }
            };
            
            // Handle stop
            state.mediaRecorder.onstop = async () => {
                await handleRecordingStop();
            };
            
            // Handle errors
            state.mediaRecorder.onerror = (e) => {
                console.error('❌ MediaRecorder error:', e);
                handleError('Imeshindikana kurekodi');
            };
            
            // Setup audio context kwa waveform
            setupWaveform();
            
            // Start recording
            state.mediaRecorder.start(VOICE_CONFIG.chunkInterval);
            state.startTime = Date.now();
            state.isRecording = true;
            state.isCancelling = false;
            state.recordingDuration = 0;
            
            // Start timer
            startTimer();
            
            // Haptic
            if (navigator.vibrate) navigator.vibrate(20);
            
            console.log('✅ Recording started');
            
            // Auto-stop baada ya maxDuration
            setTimeout(() => {
                if (state.isRecording) {
                    console.log('⏰ Max duration reached');
                    stopRecording();
                }
            }, VOICE_CONFIG.maxDuration * 1000);
            
            return { success: true };
            
        } catch (error) {
            console.error('❌ Start recording error:', error);
            
            let message = 'Imeshindikana kurekodi';
            if (error.name === 'NotAllowedError') {
                message = 'Ruhusu microphone kwenye browser';
            } else if (error.name === 'NotFoundError') {
                message = 'Hakuna microphone';
            }
            
            handleError(message);
            return { success: false, error: message };
        }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // STOP RECORDING
    // ═══════════════════════════════════════════════════════════════
    
    function stopRecording() {
        if (!state.isRecording || !state.mediaRecorder) return;
        
        console.log('⏹️ Stopping recording...');
        
        try {
            state.mediaRecorder.stop();
        } catch (e) {
            console.warn('Stop error:', e);
        }
        
        state.isRecording = false;
        
        // Haptic
        if (navigator.vibrate) navigator.vibrate(20);
    }
    
    // ═══════════════════════════════════════════════════════════════
    // CANCEL RECORDING
    // ═══════════════════════════════════════════════════════════════
    
    function cancelRecording() {
        if (!state.isRecording) return;
        
        console.log('🚫 Cancelling recording...');
        
        state.isCancelling = true;
        
        // Stop recorder bila ku-save
        if (state.mediaRecorder && state.mediaRecorder.state !== 'inactive') {
            state.mediaRecorder.onstop = null; // Prevent onSend
            state.mediaRecorder.stop();
        }
        
        // Clear chunks
        state.chunks = [];
        
        // Cleanup
        cleanupRecording();
        
        // Haptic
        if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
    }
    
    // ═══════════════════════════════════════════════════════════════
    // HANDLE RECORDING STOP
    // ═══════════════════════════════════════════════════════════════
    
    async function handleRecordingStop() {
        const duration = Math.floor((Date.now() - state.startTime) / 1000);
        
        console.log(`📼 Recording stopped — duration: ${duration}s`);
        
        // Check kama cancelled
        if (state.isCancelling) {
            console.log('🚫 Recording cancelled — no upload');
            cleanupRecording();
            return;
        }
        
        // Check minimum duration
        if (duration < VOICE_CONFIG.minDuration) {
            console.log('⚠️ Recording too short');
            handleError('Rekodi ni fupi mno');
            cleanupRecording();
            return;
        }
        
        // Check kama kuna chunks
        if (state.chunks.length === 0) {
            console.log('⚠️ No audio data');
            handleError('Hakuna sauti iliyorekodiwa');
            cleanupRecording();
            return;
        }
        
        // Create blob
        const mimeType = state.mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(state.chunks, { type: mimeType });
        
        // Create file
        const extension = mimeType.includes('webm') ? 'webm' : 'm4a';
        const file = new File([blob], `voice-${Date.now()}.${extension}`, {
            type: mimeType
        });
        
        console.log(`📦 Blob size: ${formatBytes(blob.size)}`);
        
        // Cleanup recorder
        cleanupRecording();
        
        // Call onSend callback
        if (state.onSend) {
            try {
                await state.onSend(file, duration);
            } catch (error) {
                console.error('onSend error:', error);
                handleError('Imeshindikana kutuma');
            }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // SETUP WAVEFORM
    // ═══════════════════════════════════════════════════════════════
    
    function setupWaveform() {
        try {
            state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            state.analyser = state.audioContext.createAnalyser();
            state.analyser.fftSize = 256;
            
            const source = state.audioContext.createMediaStreamSource(state.stream);
            source.connect(state.analyser);
            
            console.log('✅ Waveform analyser ready');
        } catch (e) {
            console.warn('⚠️ Waveform setup failed:', e);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // GET WAVEFORM DATA
    // ═══════════════════════════════════════════════════════════════
    
    function getWaveformData() {
        if (!state.analyser) return null;
        
        const dataArray = new Uint8Array(state.analyser.frequencyBinCount);
        state.analyser.getByteFrequencyData(dataArray);
        
        // Downsample kwa bars
        const bars = VOICE_CONFIG.waveformBars;
        const step = Math.floor(dataArray.length / bars);
        const result = [];
        
        for (let i = 0; i < bars; i++) {
            let sum = 0;
            for (let j = 0; j < step; j++) {
                sum += dataArray[i * step + j];
            }
            const avg = sum / step;
            // Normalize kwa 0-1
            result.push(avg / 255);
        }
        
        return result;
    }
    
    // ═══════════════════════════════════════════════════════════════
    // TIMER
    // ═══════════════════════════════════════════════════════════════
    
    function startTimer() {
        if (state.timerInterval) clearInterval(state.timerInterval);
        
        state.timerInterval = setInterval(() => {
            state.recordingDuration = Math.floor((Date.now() - state.startTime) / 1000);
            
            // Callback kwa UI
            if (state.onTick) {
                state.onTick(state.recordingDuration);
            }
            
            // Auto-stop at max
            if (state.recordingDuration >= VOICE_CONFIG.maxDuration) {
                stopRecording();
            }
        }, 1000);
    }
    
    function stopTimer() {
        if (state.timerInterval) {
            clearInterval(state.timerInterval);
            state.timerInterval = null;
        }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // CLEANUP RECORDING
    // ═══════════════════════════════════════════════════════════════
    
    function cleanupRecording() {
        // Stop timer
        stopTimer();
        
        // Stop waveform
        if (state.waveformInterval) {
            clearInterval(state.waveformInterval);
            state.waveformInterval = null;
        }
        
        // Stop stream
        if (state.stream) {
            state.stream.getTracks().forEach(track => track.stop());
            state.stream = null;
        }
        
        // Close audio context
        if (state.audioContext) {
            try {
                state.audioContext.close();
            } catch (e) {}
            state.audioContext = null;
            state.analyser = null;
        }
        
        // Reset state
        state.mediaRecorder = null;
        state.chunks = [];
        state.isRecording = false;
        state.isCancelling = false;
        state.startTime = null;
        state.recordingDuration = 0;
        state.startY = 0;
        state.currentY = 0;
        
        console.log('🧹 Recording cleanup complete');
    }
    
    // ═══════════════════════════════════════════════════════════════
    // PLAY VOICE NOTE
    // ═══════════════════════════════════════════════════════════════
    
    async function playVoice(voiceId, audioUrl, options = {}) {
        try {
            // Pause current kama ipo
            if (state.currentAudio && state.currentPlayingId !== voiceId) {
                pauseVoice();
            }
            
            // Kama ni yetu hiyohiyo, resume
            if (state.currentPlayingId === voiceId && state.currentAudio) {
                if (state.currentAudio.paused) {
                    await state.currentAudio.play();
                    return { success: true, action: 'resume' };
                } else {
                    pauseVoice();
                    return { success: true, action: 'pause' };
                }
            }
            
            // Create new audio
            const audio = new Audio(audioUrl);
            audio.playbackRate = state.playbackRate;
            audio.preload = 'auto';
            
            state.currentAudio = audio;
            state.currentPlayingId = voiceId;
            
            // Callbacks
            if (options.onProgress) {
                audio.addEventListener('timeupdate', () => {
                    const progress = audio.duration > 0 ? audio.currentTime / audio.duration : 0;
                    options.onProgress(progress, audio.currentTime, audio.duration);
                });
            }
            
            if (options.onEnd) {
                audio.addEventListener('ended', () => {
                    state.currentPlayingId = null;
                    state.currentAudio = null;
                    options.onEnd();
                    
                    // Auto-play next
                    if (options.autoPlayNext) {
                        const nextVoice = findNextVoice(voiceId);
                        if (nextVoice) {
                            playVoice(nextVoice.id, nextVoice.url, options);
                        }
                    }
                });
            }
            
            if (options.onPlay) {
                audio.addEventListener('play', options.onPlay);
            }
            
            if (options.onPause) {
                audio.addEventListener('pause', options.onPause);
            }
            
            if (options.onError) {
                audio.addEventListener('error', () => {
                    options.onError('Imeshindikana kucheza voice');
                });
            }
            
            // Play
            await audio.play();
            
            return { success: true, action: 'play' };
            
        } catch (error) {
            console.error('❌ Play voice error:', error);
            return { success: false, error: error.message };
        }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // PAUSE VOICE
    // ═══════════════════════════════════════════════════════════════
    
    function pauseVoice() {
        if (state.currentAudio) {
            state.currentAudio.pause();
            return { success: true };
        }
        return { success: false };
    }
    
    // ═══════════════════════════════════════════════════════════════
    // TOGGLE PLAYBACK
    // ═══════════════════════════════════════════════════════════════
    
    async function togglePlayback(voiceId, audioUrl, options = {}) {
        if (state.currentPlayingId === voiceId && state.currentAudio) {
            if (state.currentAudio.paused) {
                await state.currentAudio.play();
                return { success: true, action: 'resume' };
            } else {
                pauseVoice();
                return { success: true, action: 'pause' };
            }
        } else {
            return await playVoice(voiceId, audioUrl, options);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // SEEK VOICE
    // ═══════════════════════════════════════════════════════════════
    
    function seekVoice(percent) {
        if (!state.currentAudio || !state.currentAudio.duration) {
            return { success: false };
        }
        
        const newTime = percent * state.currentAudio.duration;
        state.currentAudio.currentTime = newTime;
        
        return { success: true, currentTime: newTime };
    }
    
    // ═══════════════════════════════════════════════════════════════
    // SET PLAYBACK RATE
    // ═══════════════════════════════════════════════════════════════
    
    function setPlaybackRate(rate) {
        const validRates = [0.5, 1, 1.5, 2];
        if (!validRates.includes(rate)) rate = 1;
        
        state.playbackRate = rate;
        
        if (state.currentAudio) {
            state.currentAudio.playbackRate = rate;
        }
        
        console.log(`⚡ Playback rate: ${rate}x`);
        
        return { success: true, rate };
    }
    
    // ═══════════════════════════════════════════════════════════════
    // FIND NEXT VOICE NOTE
    // ═══════════════════════════════════════════════════════════════
    
    function findNextVoice(currentId) {
        const voices = Array.from(state.allVoiceElements.entries());
        const currentIndex = voices.findIndex(([id]) => id === currentId);
        
        if (currentIndex !== -1 && currentIndex < voices.length - 1) {
            const [nextId, nextData] = voices[currentIndex + 1];
            return { id: nextId, ...nextData };
        }
        
        return null;
    }
    
    // ═══════════════════════════════════════════════════════════════
    // REGISTER VOICE ELEMENT
    // ═══════════════════════════════════════════════════════════════
    
    function registerVoiceElement(id, url, element) {
        state.allVoiceElements.set(id, { url, element });
    }
    
    // ═══════════════════════════════════════════════════════════════
    // ATTACH TO ALL VOICE ELEMENTS (Auto-setup)
    // ═══════════════════════════════════════════════════════════════
    
    function attachToAllVoiceElements() {
        document.querySelectorAll('.message-voice').forEach(el => {
            attachToVoiceElement(el);
        });
    }
    
    // ═══════════════════════════════════════════════════════════════
    // ATTACH TO VOICE ELEMENT
    // ═══════════════════════════════════════════════════════════════
    
    function attachToVoiceElement(voiceEl) {
        if (voiceEl.dataset.voiceAttached) return;
        voiceEl.dataset.voiceAttached = 'true';
        
        const playBtn = voiceEl.querySelector('.voice-play-btn');
        const waveform = voiceEl.querySelector('.voice-waveform');
        const durationEl = voiceEl.querySelector('.voice-duration');
        const audioUrl = voiceEl.dataset.audioUrl;
        const voiceId = voiceEl.dataset.voiceId || generateUUID();
        
        if (!audioUrl || !playBtn) return;
        
        let audio = null;
        let isPlaying = false;
        
        // Register
        registerVoiceElement(voiceId, audioUrl, voiceEl);
        
        // Play button click
        playBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            
            if (!audio) {
                audio = new Audio(audioUrl);
                audio.preload = 'auto';
                audio.playbackRate = state.playbackRate;
                
                audio.addEventListener('ended', () => {
                    isPlaying = false;
                    playBtn.classList.remove('playing');
                    playBtn.innerHTML = '<i class="fas fa-play"></i>';
                    
                    // Reset waveform
                    if (waveform) {
                        waveform.querySelectorAll('.voice-bar').forEach(b => {
                            b.classList.remove('active');
                        });
                    }
                    
                    // Reset duration
                    if (durationEl) {
                        durationEl.textContent = formatDuration(audio.duration);
                    }
                });
                
                audio.addEventListener('timeupdate', () => {
                    if (!audio.duration) return;
                    
                    const progress = audio.currentTime / audio.duration;
                    const activeCount = Math.floor(progress * VOICE_CONFIG.waveformBars);
                    
                    if (waveform) {
                        waveform.querySelectorAll('.voice-bar').forEach((b, i) => {
                            b.classList.toggle('active', i < activeCount);
                        });
                    }
                    
                    if (durationEl) {
                        durationEl.textContent = formatDuration(audio.currentTime);
                    }
                });
                
                audio.addEventListener('error', () => {
                    showError('Imeshindikana kucheza voice');
                });
            }
            
            if (isPlaying) {
                audio.pause();
                isPlaying = false;
                playBtn.classList.remove('playing');
                playBtn.innerHTML = '<i class="fas fa-play"></i>';
            } else {
                // Pause other playing audio
                if (state.currentAudio && state.currentAudio !== audio) {
                    state.currentAudio.pause();
                    
                    // Update other button
                    const otherBtn = document.querySelector('.voice-play-btn.playing');
                    if (otherBtn) {
                        otherBtn.classList.remove('playing');
                        otherBtn.innerHTML = '<i class="fas fa-play"></i>';
                    }
                }
                
                await audio.play();
                isPlaying = true;
                state.currentAudio = audio;
                state.currentPlayingId = voiceId;
                playBtn.classList.add('playing');
                playBtn.innerHTML = '<i class="fas fa-pause"></i>';
            }
        });
        
        // Seek on waveform click
        if (waveform) {
            waveform.addEventListener('click', (e) => {
                if (!audio || !audio.duration) return;
                
                e.stopPropagation();
                
                const rect = waveform.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const percent = Math.max(0, Math.min(1, clickX / rect.width));
                
                audio.currentTime = percent * audio.duration;
            });
        }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // CREATE WAVEFORM BARS
    // ═══════════════════════════════════════════════════════════════
    
    function createWaveformBars(count = VOICE_CONFIG.waveformBars) {
        let html = '';
        for (let i = 0; i < count; i++) {
            const height = 20 + Math.random() * 60;
            html += `<div class="voice-bar" style="height: ${height}%;"></div>`;
        }
        return html;
    }
    
    // ═══════════════════════════════════════════════════════════════
    // CREATE VOICE ELEMENT
    // ═══════════════════════════════════════════════════════════════
    
    function createVoiceElement(options) {
        const {
            voiceId,
            audioUrl,
            duration,
            isSent = false
        } = options;
        
        const div = document.createElement('div');
        div.className = 'message-voice';
        div.dataset.audioUrl = audioUrl;
        div.dataset.voiceId = voiceId || generateUUID();
        
        div.innerHTML = `
            <button class="voice-play-btn" type="button">
                <i class="fas fa-play"></i>
            </button>
            <div class="voice-waveform">
                ${createWaveformBars()}
            </div>
            <div class="voice-duration">${formatDuration(duration)}</div>
        `;
        
        // Attach events
        setTimeout(() => attachToVoiceElement(div), 0);
        
        return div;
    }
    
    // ═══════════════════════════════════════════════════════════════
    // ERROR HANDLING
    // ═══════════════════════════════════════════════════════════════
    
    function handleError(message) {
        console.error('❌ Voice error:', message);
        
        if (state.onError) {
            state.onError(message);
        } else {
            showError(message);
        }
    }
    
    function showError(message) {
        // Use existing toast kama ipo
        if (typeof showToast === 'function') {
            showToast(message, 'error');
        } else if (window.showToast) {
            window.showToast(message, 'error');
        } else {
            console.error(message);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // FORMAT HELPERS
    // ═══════════════════════════════════════════════════════════════
    
    function formatDuration(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${String(s).padStart(2, '0')}`;
    }
    
    function formatBytes(bytes) {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    // ═══════════════════════════════════════════════════════════════
    // CLEANUP
    // ═══════════════════════════════════════════════════════════════
    
    function cleanup() {
        pauseVoice();
        cleanupRecording();
        state.allVoiceElements.clear();
        state.currentAudio = null;
        state.currentPlayingId = null;
    }
    
    // ═══════════════════════════════════════════════════════════════
    // EXPORT GLOBAL API
    // ═══════════════════════════════════════════════════════════════
    
    window.ChatVoice = {
        init,
        startRecording,
        stopRecording,
        cancelRecording,
        playVoice,
        pauseVoice,
        togglePlayback,
        seekVoice,
        setPlaybackRate,
        createVoiceElement,
        attachToVoiceElement,
        attachToAllVoiceElements,
        cleanup,
        getWaveformData,
        // Utils
        formatDuration,
        VOICE_CONFIG
    };
    
    console.log('✅ OWNER_CHAT_VOICE loaded');
    console.log('   • ChatVoice.startRecording()');
    console.log('   • ChatVoice.stopRecording()');
    console.log('   • ChatVoice.cancelRecording()');
    console.log('   • ChatVoice.createVoiceElement({ voiceId, audioUrl, duration })');
    console.log('   • ChatVoice.attachToAllVoiceElements()');
    
})();