// ═══════════════════════════════════════════════════════════════
// KMCA OWNER CHAT — WEBRTC MODULE
// Version: 1.0
// Video + Audio Calls (Google STUN + Metered TURN fallback)
// ═══════════════════════════════════════════════════════════════

(function() {
    'use strict';
    
    // ═══════════════════════════════════════════════════════════════
    // CONFIG
    // ═══════════════════════════════════════════════════════════════
    
    const CONFIG = window.HOSTING_CONFIG || {};
    const SUPABASE_URL = CONFIG.supabase?.url;
    const SUPABASE_ANON_KEY = CONFIG.supabase?.anonKey;
    
    const METERED_TURN_URL = `${SUPABASE_URL}/functions/v1/Metered-turn`;
    const NOTIFY_URL = `${SUPABASE_URL}/functions/v1/send-call-notification`;
    
    // Google STUN servers (bure)
    const GOOGLE_STUN = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' }
    ];
    
    // ═══════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════
    
    const state = {
        // Call state
        currentCall: null,          // Call object
        peerConnection: null,       // RTCPeerConnection
        localStream: null,          // Local media stream
        remoteStream: null,         // Remote media stream
        callChannel: null,          // Supabase channel kwa signaling
        callStartTime: null,        // Wakati call ilianza
        callDurationInterval: null, // Interval ya ku-update duration
        isMuted: false,             // Mic muted?
        isCameraOff: false,         // Camera off?
        iceServersUsed: 'google',   // 'google' | 'metered'
        
        // Owner info
        owner: null,
        
        // UI elements
        ui: {}
    };
    
    // ═══════════════════════════════════════════════════════════════
    // INIT
    // ═══════════════════════════════════════════════════════════════
    
    function init() {
        console.log('📞 WebRTC module initializing...');
        
        state.owner = getOwnerSession();
        if (!state.owner) {
            console.warn('⚠️ No owner session — WebRTC disabled');
            return;
        }
        
        injectWebRTCCSS();
        createCallUI();
        setupBroadcastListener();
        
        console.log('✅ WebRTC ready');
    }
    
    // ═══════════════════════════════════════════════════════════════
    // GET OWNER SESSION
    // ═══════════════════════════════════════════════════════════════
    
    function getOwnerSession() {
        try {
            const d = sessionStorage.getItem('kmca_owner');
            if (!d) {
                const b = localStorage.getItem('kmca_owner_backup');
                return b ? JSON.parse(b) : null;
            }
            return JSON.parse(d);
        } catch (e) { return null; }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // INJECT CSS
    // ═══════════════════════════════════════════════════════════════
    
    function injectWebRTCCSS() {
        if (document.getElementById('webrtc-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'webrtc-styles';
        style.textContent = `
            /* ═══════════════════════════════════════════════════════════
               CALL OVERLAY (Full screen)
               ═══════════════════════════════════════════════════════════ */
            .webrtc-overlay {
                position: fixed;
                inset: 0;
                background: linear-gradient(135deg, #020617 0%, #0f172a 100%);
                z-index: 99999;
                display: none;
                flex-direction: column;
                color: white;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            .webrtc-overlay.active {
                display: flex;
                animation: callFadeIn 0.3s ease-out;
            }
            
            @keyframes callFadeIn {
                from { opacity: 0; transform: scale(0.95); }
                to { opacity: 1; transform: scale(1); }
            }
            
            /* Video containers */
            .webrtc-videos {
                flex: 1;
                position: relative;
                overflow: hidden;
                background: #000;
            }
            
            .webrtc-remote-video {
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
                background: #000;
            }
            
            .webrtc-local-video {
                position: absolute;
                top: 20px;
                right: 20px;
                width: 100px;
                height: 150px;
                object-fit: cover;
                border-radius: 12px;
                border: 2px solid rgba(212, 175, 55, 0.6);
                box-shadow: 0 4px 20px rgba(0,0,0,0.5);
                background: #000;
                z-index: 10;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .webrtc-local-video:hover {
                transform: scale(1.05);
                border-color: #d4af37;
            }
            
            /* Info overlay */
            .webrtc-info {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                padding: 20px;
                background: linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%);
                z-index: 5;
                pointer-events: none;
            }
            
            .webrtc-name {
                font-size: 24px;
                font-weight: 800;
                margin-bottom: 4px;
                text-shadow: 0 2px 8px rgba(0,0,0,0.5);
            }
            
            .webrtc-status {
                font-size: 14px;
                color: rgba(255,255,255,0.8);
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .webrtc-status-dot {
                width: 8px;
                height: 8px;
                background: #10b981;
                border-radius: 50%;
                animation: statusPulse 2s ease-in-out infinite;
            }
            
            @keyframes statusPulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
            
            /* Audio-only mode */
            .webrtc-audio-only {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                gap: 20px;
                padding: 20px;
            }
            
            .webrtc-avatar-lg {
                width: 140px;
                height: 140px;
                border-radius: 50%;
                background: linear-gradient(135deg, #d4af37, #f0d060);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 52px;
                font-weight: 900;
                color: #020617;
                box-shadow: 0 12px 48px rgba(212, 175, 55, 0.5);
                letter-spacing: 3px;
                animation: avatarPulse 2s ease-in-out infinite;
            }
            
            @keyframes avatarPulse {
                0%, 100% {
                    box-shadow: 0 12px 48px rgba(212, 175, 55, 0.5);
                }
                50% {
                    box-shadow: 0 12px 64px rgba(212, 175, 55, 0.8);
                }
            }
            
            /* Controls */
            .webrtc-controls {
                padding: 24px 20px calc(24px + env(safe-area-inset-bottom, 0));
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 16px;
                background: rgba(2, 6, 23, 0.95);
                backdrop-filter: blur(20px);
                z-index: 20;
                position: relative;
            }
            
            .webrtc-btn {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                border: none;
                background: rgba(30, 41, 59, 0.9);
                color: white;
                font-size: 22px;
                cursor: pointer;
                transition: all 0.3s;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                -webkit-tap-highlight-color: transparent;
            }
            
            .webrtc-btn:hover {
                background: rgba(51, 65, 85, 0.9);
                transform: scale(1.05);
            }
            
            .webrtc-btn:active {
                transform: scale(0.92);
            }
            
            .webrtc-btn.active {
                background: #ef4444;
                color: white;
            }
            
            .webrtc-btn.end-call {
                background: linear-gradient(135deg, #ef4444, #dc2626);
                width: 70px;
                height: 70px;
                font-size: 26px;
                box-shadow: 0 8px 24px rgba(239, 68, 68, 0.5);
            }
            
            .webrtc-btn.end-call:hover {
                background: linear-gradient(135deg, #dc2626, #b91c1c);
                box-shadow: 0 8px 32px rgba(239, 68, 68, 0.7);
            }
            
            .webrtc-btn.accept {
                background: linear-gradient(135deg, #10b981, #059669);
                box-shadow: 0 8px 24px rgba(16, 185, 129, 0.5);
                animation: acceptPulse 1.5s ease-in-out infinite;
            }
            
            @keyframes acceptPulse {
                0%, 100% { 
                    transform: scale(1);
                    box-shadow: 0 8px 24px rgba(16, 185, 129, 0.5);
                }
                50% { 
                    transform: scale(1.05);
                    box-shadow: 0 12px 32px rgba(16, 185, 129, 0.8);
                }
            }
            
            /* Call duration timer */
            .webrtc-duration {
                font-size: 14px;
                color: rgba(255,255,255,0.9);
                font-family: 'Courier New', monospace;
                font-weight: 700;
                letter-spacing: 1px;
                padding: 4px 12px;
                background: rgba(212, 175, 55, 0.15);
                border-radius: 12px;
                display: inline-block;
                margin-top: 8px;
            }
            
            /* Incoming call specific */
            .webrtc-incoming-actions {
                display: flex;
                gap: 40px;
                justify-content: center;
                padding: 24px 20px calc(24px + env(safe-area-inset-bottom, 0));
                background: rgba(2, 6, 23, 0.95);
                backdrop-filter: blur(20px);
            }
            
            .webrtc-incoming-actions .webrtc-btn {
                width: 72px;
                height: 72px;
                font-size: 26px;
            }
            
            /* Rings animation */
            .webrtc-rings {
                position: absolute;
                inset: 0;
                pointer-events: none;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1;
            }
            
            .webrtc-ring {
                position: absolute;
                border: 2px solid rgba(212, 175, 55, 0.3);
                border-radius: 50%;
                animation: ringExpand 3s ease-out infinite;
            }
            
            .webrtc-ring:nth-child(1) { animation-delay: 0s; }
            .webrtc-ring:nth-child(2) { animation-delay: 1s; }
            .webrtc-ring:nth-child(3) { animation-delay: 2s; }
            
            @keyframes ringExpand {
                0% {
                    width: 100px;
                    height: 100px;
                    opacity: 0.8;
                }
                100% {
                    width: 500px;
                    height: 500px;
                    opacity: 0;
                }
            }
            
            /* Connection quality */
            .webrtc-quality {
                position: absolute;
                bottom: 100px;
                left: 20px;
                font-size: 11px;
                color: rgba(255,255,255,0.6);
                display: flex;
                align-items: center;
                gap: 4px;
                z-index: 5;
            }
            
            .webrtc-quality i {
                font-size: 10px;
            }
            
            /* Toast notification kwa incoming call (kama app iko background) */
            .webrtc-toast-call {
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%) translateY(-100px);
                background: linear-gradient(135deg, #10b981, #059669);
                color: white;
                padding: 16px 24px;
                border-radius: 16px;
                box-shadow: 0 12px 48px rgba(16, 185, 129, 0.5);
                z-index: 100000;
                display: flex;
                align-items: center;
                gap: 12px;
                font-size: 15px;
                font-weight: 700;
                opacity: 0;
                transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                max-width: 90%;
                cursor: pointer;
            }
            
            .webrtc-toast-call.show {
                transform: translateX(-50%) translateY(0);
                opacity: 1;
            }
            
            .webrtc-toast-call i {
                font-size: 24px;
                animation: phoneRing 1s ease-in-out infinite;
            }
            
            @keyframes phoneRing {
                0%, 100% { transform: rotate(0deg); }
                20%, 60% { transform: rotate(-15deg); }
                40%, 80% { transform: rotate(15deg); }
            }
            
            /* Responsive */
            @media (max-width: 480px) {
                .webrtc-local-video {
                    width: 80px;
                    height: 120px;
                    top: 16px;
                    right: 16px;
                }
                
                .webrtc-avatar-lg {
                    width: 110px;
                    height: 110px;
                    font-size: 42px;
                }
                
                .webrtc-name {
                    font-size: 20px;
                }
                
                .webrtc-btn {
                    width: 52px;
                    height: 52px;
                    font-size: 20px;
                }
                
                .webrtc-btn.end-call {
                    width: 62px;
                    height: 62px;
                    font-size: 22px;
                }
                
                .webrtc-controls {
                    gap: 12px;
                    padding: 20px 12px calc(20px + env(safe-area-inset-bottom, 0));
                }
                
                .webrtc-incoming-actions .webrtc-btn {
                    width: 64px;
                    height: 64px;
                    font-size: 24px;
                }
            }
            
            @media (prefers-reduced-motion: reduce) {
                *, *::before, *::after {
                    animation-duration: 0.01ms !important;
                    transition-duration: 0.01ms !important;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
    
    // ═══════════════════════════════════════════════════════════════
    // CREATE CALL UI
    // ═══════════════════════════════════════════════════════════════
    
    function createCallUI() {
        if (document.getElementById('webrtcOverlay')) return;
        
        const overlay = document.createElement('div');
        overlay.id = 'webrtcOverlay';
        overlay.className = 'webrtc-overlay';
        overlay.innerHTML = `
            <!-- Info -->
            <div class="webrtc-info">
                <div class="webrtc-name" id="webrtcName">—</div>
                <div class="webrtc-status" id="webrtcStatus">
                    <span class="webrtc-status-dot"></span>
                    <span id="webrtcStatusText">Inaunganisha...</span>
                </div>
                <div class="webrtc-duration" id="webrtcDuration" style="display: none;">00:00</div>
            </div>
            
            <!-- Rings animation -->
            <div class="webrtc-rings" id="webrtcRings">
                <div class="webrtc-ring"></div>
                <div class="webrtc-ring"></div>
                <div class="webrtc-ring"></div>
            </div>
            
            <!-- Videos area -->
            <div class="webrtc-videos" id="webrtcVideos">
                <!-- Remote video -->
                <video id="webrtcRemoteVideo" class="webrtc-remote-video" autoplay playsinline></video>
                
                <!-- Local video -->
                <video id="webrtcLocalVideo" class="webrtc-local-video" autoplay playsinline muted></video>
                
                <!-- Audio-only avatar (inabaki hidden kwa video) -->
                <div class="webrtc-audio-only" id="webrtcAudioOnly" style="display: none;">
                    <div class="webrtc-avatar-lg" id="webrtcAvatar">?</div>
                </div>
                
                <!-- Connection quality -->
                <div class="webrtc-quality" id="webrtcQuality" style="display: none;">
                    <i class="fas fa-signal"></i>
                    <span id="webrtcQualityText">Google STUN</span>
                </div>
            </div>
            
            <!-- Controls (active call) -->
            <div class="webrtc-controls" id="webrtcControls">
                <button class="webrtc-btn" id="webrtcMuteBtn" title="Mute">
                    <i class="fas fa-microphone"></i>
                </button>
                
                <button class="webrtc-btn" id="webrtcVideoBtn" title="Camera">
                    <i class="fas fa-video"></i>
                </button>
                
                <button class="webrtc-btn" id="webrtcSpeakerBtn" title="Speaker">
                    <i class="fas fa-volume-up"></i>
                </button>
                
                <button class="webrtc-btn end-call" id="webrtcEndBtn" title="End Call">
                    <i class="fas fa-phone-slash"></i>
                </button>
            </div>
            
            <!-- Incoming call actions -->
            <div class="webrtc-incoming-actions" id="webrtcIncomingActions" style="display: none;">
                <button class="webrtc-btn end-call" id="webrtcDeclineBtn" title="Decline">
                    <i class="fas fa-phone-slash"></i>
                </button>
                
                <button class="webrtc-btn accept" id="webrtcAcceptBtn" title="Accept">
                    <i class="fas fa-phone"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Cache UI elements
        state.ui = {
            overlay: overlay,
            name: document.getElementById('webrtcName'),
            status: document.getElementById('webrtcStatus'),
            statusText: document.getElementById('webrtcStatusText'),
            duration: document.getElementById('webrtcDuration'),
            rings: document.getElementById('webrtcRings'),
            videos: document.getElementById('webrtcVideos'),
            remoteVideo: document.getElementById('webrtcRemoteVideo'),
            localVideo: document.getElementById('webrtcLocalVideo'),
            audioOnly: document.getElementById('webrtcAudioOnly'),
            avatar: document.getElementById('webrtcAvatar'),
            quality: document.getElementById('webrtcQuality'),
            qualityText: document.getElementById('webrtcQualityText'),
            controls: document.getElementById('webrtcControls'),
            incomingActions: document.getElementById('webrtcIncomingActions'),
            muteBtn: document.getElementById('webrtcMuteBtn'),
            videoBtn: document.getElementById('webrtcVideoBtn'),
            speakerBtn: document.getElementById('webrtcSpeakerBtn'),
            endBtn: document.getElementById('webrtcEndBtn'),
            acceptBtn: document.getElementById('webrtcAcceptBtn'),
            declineBtn: document.getElementById('webrtcDeclineBtn')
        };
        
        setupUIControls();
    }
    
    // ═══════════════════════════════════════════════════════════════
    // SETUP UI CONTROLS
    // ═══════════════════════════════════════════════════════════════
    
    function setupUIControls() {
        // Mute button
        state.ui.muteBtn.addEventListener('click', toggleMute);
        
        // Video button
        state.ui.videoBtn.addEventListener('click', toggleCamera);
        
        // Speaker button
        state.ui.speakerBtn.addEventListener('click', toggleSpeaker);
        
        // End call
        state.ui.endBtn.addEventListener('click', () => endCall('ended'));
        
        // Accept call
        state.ui.acceptBtn.addEventListener('click', acceptCall);
        
        // Decline call
        state.ui.declineBtn.addEventListener('click', () => declineCall());
        
        // Local video click → swap
        state.ui.localVideo.addEventListener('click', swapVideos);
    }
    
    // ═══════════════════════════════════════════════════════════════
    // ICE SERVERS — Google STUN + Metered TURN fallback
    // ═══════════════════════════════════════════════════════════════
    
    async function getIceServers() {
        console.log('🌐 Fetching ICE servers...');
        
        // 1. Jaribu Metered TURN kwanza (kwa reliability)
        try {
            const response = await fetch(METERED_TURN_URL, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.iceServers && data.iceServers.length > 0) {
                    console.log('✅ Using Metered TURN + Google STUN');
                    state.iceServersUsed = 'metered';
                    return data.iceServers;
                }
            }
        } catch (e) {
            console.warn('⚠️ Metered TURN failed:', e.message);
        }
        
        // 2. Fallback: Google STUN pekee
        console.log('⚠️ Falling back to Google STUN only');
        state.iceServersUsed = 'google';
        return GOOGLE_STUN;
    }
    
    // ═══════════════════════════════════════════════════════════════
    // START CALL (Outgoing)
    // ═══════════════════════════════════════════════════════════════
    
    async function startCall(recipientId, recipientName, callType = 'video') {
        try {
            console.log(`📞 Starting ${callType} call to ${recipientName}...`);
            
            if (state.currentCall) {
                console.warn('⚠️ Call already in progress');
                return { success: false, error: 'Call in progress' };
            }
            
            // Validate
            if (!recipientId || recipientId === state.owner.id) {
                return { success: false, error: 'Recipient si sahihi' };
            }
            
            // Create call ID
            const callId = generateUUID();
            
            // Create call object
            state.currentCall = {
                id: callId,
                type: callType,
                direction: 'outgoing',
                recipientId: recipientId,
                recipientName: recipientName,
                status: 'calling',
                startedAt: new Date().toISOString()
            };
            
            // Show call UI
            showCallUI('outgoing', recipientName, callType);
            
            // Get user media
            const stream = await getUserMedia(callType);
            if (!stream) {
                endCall('failed');
                return { success: false, error: 'Imeshindikana kupata camera/mic' };
            }
            
            state.localStream = stream;
            state.ui.localVideo.srcObject = stream;
            
            // Save call kwenye database
            await saveCallToDatabase('calling');
            
            // Send notification kwa recipient
            await sendCallNotification(recipientId, recipientName, callType, callId);
            
            // Setup signaling
            await setupSignaling(callId, recipientId);
            
            // Create peer connection
            await createPeerConnection();
            
            // Create offer
            const offer = await state.peerConnection.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: callType === 'video'
            });
            
            await state.peerConnection.setLocalDescription(offer);
            
            // Send offer via broadcast
            await broadcastSignal('offer', {
                callId: callId,
                from: state.owner.id,
                fromName: state.owner.jina,
                to: recipientId,
                callType: callType,
                offer: offer
            });
            
            console.log('✅ Call initiated:', callId);
            
            // Listen kwa call status change
            startCallTimeout(60); // Sekunde 60 → auto-end kama hakuna jibu
            
            return { success: true, callId: callId };
            
        } catch (error) {
            console.error('❌ Start call error:', error);
            await endCall('failed');
            return { success: false, error: error.message };
        }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // ACCEPT CALL (Incoming)
    // ═══════════════════════════════════════════════════════════════
    
    async function acceptCall() {
        try {
            if (!state.currentCall || state.currentCall.direction !== 'incoming') {
                console.warn('⚠️ No incoming call to accept');
                return;
            }
            
            console.log('✅ Accepting call...');
            
            state.currentCall.status = 'accepted';
            
            // Update UI
            state.ui.incomingActions.style.display = 'none';
            state.ui.controls.style.display = 'flex';
            state.ui.statusText.textContent = 'Inaunganisha...';
            state.ui.rings.style.display = 'none';
            
            // Get user media
            const stream = await getUserMedia(state.currentCall.type);
            if (!stream) {
                await declineCall();
                return;
            }
            
            state.localStream = stream;
            state.ui.localVideo.srcObject = stream;
            
            // Setup signaling
            await setupSignaling(state.currentCall.id, state.currentCall.callerId);
            
            // Create peer connection
            await createPeerConnection();
            
            // Add tracks
            stream.getTracks().forEach(track => {
                state.peerConnection.addTrack(track, stream);
            });
            
            // Set remote description (offer)
            if (state.currentCall.pendingOffer) {
                await state.peerConnection.setRemoteDescription(
                    new RTCSessionDescription(state.currentCall.pendingOffer)
                );
                
                // Create answer
                const answer = await state.peerConnection.createAnswer();
                await state.peerConnection.setLocalDescription(answer);
                
                // Send answer
                await broadcastSignal('answer', {
                    callId: state.currentCall.id,
                    from: state.owner.id,
                    to: state.currentCall.callerId,
                    answer: answer
                });
            }
            
            // Update database
            await updateCallInDatabase('answered');
            
            console.log('✅ Call accepted');
            
        } catch (error) {
            console.error('❌ Accept call error:', error);
            await endCall('failed');
        }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // DECLINE CALL
    // ═══════════════════════════════════════════════════════════════
    
    async function declineCall() {
        try {
            if (!state.currentCall) return;
            
            console.log('❌ Declining call...');
            
            // Notify caller
            await broadcastSignal('decline', {
                callId: state.currentCall.id,
                from: state.owner.id,
                to: state.currentCall.callerId
            });
            
            // Update database
            await updateCallInDatabase('declined');
            
            // Hide UI
            hideCallUI();
            
            // Cleanup
            cleanupCall();
            
        } catch (error) {
            console.error('Decline error:', error);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // END CALL
    // ═══════════════════════════════════════════════════════════════
    
    async function endCall(reason = 'ended') {
        try {
            if (!state.currentCall) {
                hideCallUI();
                return;
            }
            
            console.log(`📴 Ending call (${reason})...`);
            
            const callId = state.currentCall.id;
            const recipientId = state.currentCall.direction === 'outgoing' 
                ? state.currentCall.recipientId 
                : state.currentCall.callerId;
            
            // Notify other party
            if (recipientId) {
                await broadcastSignal('end', {
                    callId: callId,
                    from: state.owner.id,
                    to: recipientId,
                    reason: reason
                });
            }
            
            // Update database
            await updateCallInDatabase(reason);
            
            // Hide UI
            hideCallUI();
            
            // Cleanup
            cleanupCall();
            
            console.log('✅ Call ended');
            
        } catch (error) {
            console.error('End call error:', error);
            hideCallUI();
            cleanupCall();
        }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // GET USER MEDIA
    // ═══════════════════════════════════════════════════════════════
    
    async function getUserMedia(callType) {
        try {
            const constraints = {
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                },
                video: callType === 'video' ? {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                } : false
            };
            
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log('✅ Got user media:', stream.getTracks().map(t => t.kind));
            return stream;
            
        } catch (error) {
            console.error('❌ getUserMedia error:', error);
            
            // Show user-friendly error
            let message = 'Imeshindikana kupata camera/mic';
            if (error.name === 'NotAllowedError') {
                message = 'Ruhusu camera na microphone kwenye browser';
            } else if (error.name === 'NotFoundError') {
                message = 'Hakuna camera au microphone';
            } else if (error.name === 'NotReadableError') {
                message = 'Camera/mic inatumika na app nyingine';
            }
            
            showCallError(message);
            return null;
        }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // CREATE PEER CONNECTION
    // ═══════════════════════════════════════════════════════════════
    
    async function createPeerConnection() {
        // Cleanup old
        if (state.peerConnection) {
            state.peerConnection.close();
            state.peerConnection = null;
        }
        
        // Get ICE servers
        const iceServers = await getIceServers();
        
        // Create peer connection
        state.peerConnection = new RTCPeerConnection({
            iceServers: iceServers,
            iceCandidatePoolSize: 10
        });
        
        // Setup event handlers
        state.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                broadcastSignal('ice-candidate', {
                    callId: state.currentCall.id,
                    from: state.owner.id,
                    to: state.currentCall.direction === 'outgoing' 
                        ? state.currentCall.recipientId 
                        : state.currentCall.callerId,
                    candidate: event.candidate
                });
            }
        };
        
        state.peerConnection.ontrack = (event) => {
            console.log('📹 Got remote track:', event.track.kind);
            
            if (!state.remoteStream) {
                state.remoteStream = new MediaStream();
            }
            
            state.remoteStream.addTrack(event.track);
            state.ui.remoteVideo.srcObject = state.remoteStream;
        };
        
        state.peerConnection.onconnectionstatechange = () => {
            const connectionState = state.peerConnection.connectionState;
            console.log('🔗 Connection state:', connectionState);
            
            if (connectionState === 'connected') {
                onCallConnected();
            } else if (connectionState === 'disconnected' || connectionState === 'failed') {
                console.warn('⚠️ Connection lost');
                setTimeout(() => {
                    if (state.peerConnection && 
                        state.peerConnection.connectionState !== 'connected') {
                        endCall('disconnected');
                    }
                }, 5000);
            }
        };
        
        state.peerConnection.oniceconnectionstatechange = () => {
            console.log('🧊 ICE state:', state.peerConnection.iceConnectionState);
        };
        
        // Add local tracks
        if (state.localStream) {
            state.localStream.getTracks().forEach(track => {
                state.peerConnection.addTrack(track, state.localStream);
            });
        }
        
        // Show which ICE server is used
        state.ui.qualityText.textContent = state.iceServersUsed === 'metered' 
            ? '🌐 Metered TURN' 
            : '📡 Google STUN';
        state.ui.quality.style.display = 'flex';
        
        return state.peerConnection;
    }
    
    // ═══════════════════════════════════════════════════════════════
    // SIGNALING (Supabase Realtime Broadcast)
    // ═══════════════════════════════════════════════════════════════
    
    async function setupSignaling(callId, otherOwnerId) {
        // Cleanup old channel
        if (state.callChannel) {
            await supabaseClient.removeChannel(state.callChannel);
        }
        
        // Create channel
        state.callChannel = supabaseClient.channel(`call-${callId}`, {
            config: {
                broadcast: { self: false }
            }
        });
        
        // Listen kwa signals
        state.callChannel
            .on('broadcast', { event: 'offer' }, handleSignal)
            .on('broadcast', { event: 'answer' }, handleSignal)
            .on('broadcast', { event: 'ice-candidate' }, handleSignal)
            .on('broadcast', { event: 'end' }, handleSignal)
            .on('broadcast', { event: 'decline' }, handleSignal)
            .subscribe((status) => {
                console.log('📡 Signaling channel status:', status);
            });
    }
    
    async function broadcastSignal(event, payload) {
        try {
            if (!state.callChannel) {
                console.warn('⚠️ No signaling channel');
                return;
            }
            
            await state.callChannel.send({
                type: 'broadcast',
                event: event,
                payload: payload
            });
            
            console.log(`📡 Sent signal: ${event}`);
        } catch (error) {
            console.error('❌ Broadcast error:', error);
        }
    }
    
    async function handleSignal({ payload }) {
        try {
            if (!payload || payload.to !== state.owner.id) return;
            
            console.log('📡 Received signal:', payload.callId ? 'signal' : 'unknown');
            
            // Handle based on state
            if (state.currentCall && state.currentCall.id === payload.callId) {
                // Existing call
                if (payload.offer) {
                    // Handle offer (kwa incoming call)
                    await handleOffer(payload);
                } else if (payload.answer) {
                    // Handle answer (kwa outgoing call)
                    await handleAnswer(payload);
                } else if (payload.candidate) {
                    // Handle ICE candidate
                    await handleIceCandidate(payload);
                } else if (payload.reason) {
                    // Call ended
                    console.log('📴 Other party ended call:', payload.reason);
                    await endCall(payload.reason);
                }
            } else if (payload.offer && !state.currentCall) {
                // New incoming call
                await handleIncomingCall(payload);
            }
            
        } catch (error) {
            console.error('❌ Handle signal error:', error);
        }
    }
    
    async function handleOffer(payload) {
        if (!state.peerConnection) {
            console.warn('⚠️ No peer connection');
            return;
        }
        
        await state.peerConnection.setRemoteDescription(
            new RTCSessionDescription(payload.offer)
        );
    }
    
    async function handleAnswer(payload) {
        if (!state.peerConnection) return;
        
        await state.peerConnection.setRemoteDescription(
            new RTCSessionDescription(payload.answer)
        );
    }
    
    async function handleIceCandidate(payload) {
        if (!state.peerConnection) return;
        
        try {
            await state.peerConnection.addIceCandidate(
                new RTCIceCandidate(payload.candidate)
            );
        } catch (error) {
            console.warn('⚠️ ICE candidate error:', error.message);
        }
    }
    
    async function handleIncomingCall(payload) {
        // Ignore kama tayari kwenye call
        if (state.currentCall) {
            console.log('⚠️ Already in call — ignoring');
            return;
        }
        
        console.log('📞 Incoming call from:', payload.fromName);
        
        // Create call object
        state.currentCall = {
            id: payload.callId,
            type: payload.callType,
            direction: 'incoming',
            callerId: payload.from,
            callerName: payload.fromName,
            status: 'ringing',
            pendingOffer: payload.offer,
            startedAt: new Date().toISOString()
        };
        
        // Show UI
        showCallUI('incoming', payload.fromName, payload.callType);
        
        // Play ringtone (optional)
        playRingtone();
        
        // Auto-decline baada ya sekunde 60
        startCallTimeout(60);
    }
    
    // ═══════════════════════════════════════════════════════════════
    // SETUP BROADCAST LISTENER (Kwa incoming calls)
    // ═══════════════════════════════════════════════════════════════
    
    function setupBroadcastListener() {
        // Listen kwa signals zote (global)
        const globalChannel = supabaseClient.channel('call-global', {
            config: { broadcast: { self: false } }
        });
        
        globalChannel
            .on('broadcast', { event: 'incoming-call' }, ({ payload }) => {
                if (payload.to === state.owner.id) {
                    console.log('📞 Global incoming call signal');
                    // Just log — proper handling in setupSignaling
                }
            })
            .subscribe();
    }
    
    // ═══════════════════════════════════════════════════════════════
    // ON CALL CONNECTED
    // ═══════════════════════════════════════════════════════════════
    
    function onCallConnected() {
        console.log('✅ Call connected');
        
        if (!state.currentCall) return;
        
        state.currentCall.status = 'active';
        state.callStartTime = new Date();
        
        // Update UI
        state.ui.statusText.textContent = 'Imeunganishwa';
        state.ui.rings.style.display = 'none';
        state.ui.duration.style.display = 'inline-block';
        state.ui.audioOnly.style.display = 'none';
        state.ui.videos.style.display = 'flex';
        
        // Start duration timer
        startDurationTimer();
        
        // Stop ringtone
        stopRingtone();
        
        // Play connected sound
        playConnectedSound();
        
        // Update database
        updateCallInDatabase('active');
    }
    
    // ═══════════════════════════════════════════════════════════════
    // DURATION TIMER
    // ═══════════════════════════════════════════════════════════════
    
    function startDurationTimer() {
        if (state.callDurationInterval) return;
        
        state.callDurationInterval = setInterval(() => {
            if (!state.callStartTime) return;
            
            const duration = Math.floor((Date.now() - state.callStartTime.getTime()) / 1000);
            state.ui.duration.textContent = formatDuration(duration);
        }, 1000);
        
        // First update
        state.ui.duration.textContent = '00:00';
    }
    
    function stopDurationTimer() {
        if (state.callDurationInterval) {
            clearInterval(state.callDurationInterval);
            state.callDurationInterval = null;
        }
    }
    
    function formatDuration(seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    
    function getCallDuration() {
        if (!state.callStartTime) return 0;
        return Math.floor((Date.now() - state.callStartTime.getTime()) / 1000);
    }
    
    // ═══════════════════════════════════════════════════════════════
    // CALL TIMEOUT (Auto-end kama hakuna jibu)
    // ═══════════════════════════════════════════════════════════════
    
    function startCallTimeout(seconds) {
        setTimeout(() => {
            if (state.currentCall && state.currentCall.status !== 'active') {
                console.log('⏰ Call timeout');
                endCall('timeout');
            }
        }, seconds * 1000);
    }
    
    // ═══════════════════════════════════════════════════════════════
    // UI: SHOW / HIDE
    // ═══════════════════════════════════════════════════════════════
    
    function showCallUI(direction, name, callType) {
        // Update UI
        state.ui.name.textContent = name;
        state.ui.avatar.textContent = getInitials(name);
        
        // Reset
        state.ui.statusText.textContent = direction === 'outgoing' ? 'Inapiga...' : 'Inaita...';
        state.ui.duration.style.display = 'none';
        state.ui.quality.style.display = 'none';
        state.ui.controls.style.display = 'none';
        state.ui.incomingActions.style.display = 'none';
        state.ui.rings.style.display = 'flex';
        
        // For video call — show videos
        if (callType === 'video') {
            state.ui.videos.style.display = 'block';
            state.ui.remoteVideo.style.display = 'block';
            state.ui.localVideo.style.display = 'block';
            state.ui.audioOnly.style.display = 'none';
        } else {
            // For audio call — show avatar
            state.ui.videos.style.display = 'flex';
            state.ui.remoteVideo.style.display = 'none';
            state.ui.localVideo.style.display = 'none';
            state.ui.audioOnly.style.display = 'flex';
        }
        
        // Direction-specific
        if (direction === 'incoming') {
            state.ui.incomingActions.style.display = 'flex';
        } else {
            state.ui.controls.style.display = 'flex';
        }
        
        // Show overlay
        state.ui.overlay.classList.add('active');
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }
    
    function hideCallUI() {
        state.ui.overlay.classList.remove('active');
        document.body.style.overflow = '';
        stopRingtone();
    }
    
    // ═══════════════════════════════════════════════════════════════
    // UI: CONTROLS
    // ═══════════════════════════════════════════════════════════════
    
    function toggleMute() {
        if (!state.localStream) return;
        
        const audioTrack = state.localStream.getAudioTracks()[0];
        if (!audioTrack) return;
        
        state.isMuted = !state.isMuted;
        audioTrack.enabled = !state.isMuted;
        
        state.ui.muteBtn.classList.toggle('active', state.isMuted);
        state.ui.muteBtn.innerHTML = state.isMuted 
            ? '<i class="fas fa-microphone-slash"></i>' 
            : '<i class="fas fa-microphone"></i>';
        
        console.log(state.isMuted ? '🔇 Muted' : '🔊 Unmuted');
    }
    
    function toggleCamera() {
        if (!state.localStream) return;
        
        const videoTrack = state.localStream.getVideoTracks()[0];
        if (!videoTrack) return;
        
        state.isCameraOff = !state.isCameraOff;
        videoTrack.enabled = !state.isCameraOff;
        
        state.ui.videoBtn.classList.toggle('active', state.isCameraOff);
        state.ui.videoBtn.innerHTML = state.isCameraOff 
            ? '<i class="fas fa-video-slash"></i>' 
            : '<i class="fas fa-video"></i>';
        
        console.log(state.isCameraOff ? '📹 Camera off' : '📹 Camera on');
    }
    
    function toggleSpeaker() {
        // Simple toggle — visual pekee kwa sasa
        state.ui.speakerBtn.classList.toggle('active');
        console.log('🔊 Speaker toggled');
    }
    
    function swapVideos() {
        // Swap local and remote video
        const remoteVideo = state.ui.remoteVideo;
        const localVideo = state.ui.localVideo;
        
        // Simple swap kwa sasa — visual pekee
        console.log('🔄 Swap videos');
    }
    
    // ═══════════════════════════════════════════════════════════════
    // DATABASE: SAVE CALL
    // ═══════════════════════════════════════════════════════════════
    
    async function saveCallToDatabase(status) {
        if (!state.currentCall) return;
        
        try {
            const callData = {
                id: state.currentCall.id,
                chat_id: null, // tuta-update baadaye
                caller_id: state.currentCall.direction === 'outgoing' 
                    ? state.owner.id 
                    : state.currentCall.callerId,
                caller_name: state.currentCall.direction === 'outgoing' 
                    ? state.owner.jina 
                    : state.currentCall.callerName,
                recipient_id: state.currentCall.direction === 'outgoing' 
                    ? state.currentCall.recipientId 
                    : state.owner.id,
                recipient_name: state.currentCall.direction === 'outgoing' 
                    ? state.currentCall.recipientName 
                    : state.owner.jina,
                call_type: state.currentCall.type,
                status: status,
                ice_server_used: state.iceServersUsed,
                started_at: state.currentCall.startedAt
            };
            
            const { error } = await supabaseClient
                .from('owner_chat_calls')
                .insert([callData]);
            
            if (error) {
                console.error('Save call error:', error);
            } else {
                console.log('💾 Call saved');
            }
        } catch (error) {
            console.error('Save call exception:', error);
        }
    }
    
    async function updateCallInDatabase(status) {
        if (!state.currentCall) return;
        
        try {
            const updateData = {
                status: status,
                ended_at: new Date().toISOString(),
                duration: getCallDuration()
            };
            
            const { error } = await supabaseClient
                .from('owner_chat_calls')
                .update(updateData)
                .eq('id', state.currentCall.id);
            
            if (error) {
                console.error('Update call error:', error);
            } else {
                console.log(`💾 Call updated: ${status} (${getCallDuration()}s)`);
            }
        } catch (error) {
            console.error('Update call exception:', error);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // NOTIFICATIONS
    // ═══════════════════════════════════════════════════════════════
    
    async function sendCallNotification(recipientId, recipientName, callType, callId) {
        try {
            const response = await fetch(NOTIFY_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    call_id: callId,
                    recipient_id: recipientId,
                    caller_name: state.owner.jina,
                    call_type: callType
                })
            });
            
            if (response.ok) {
                console.log('📤 Call notification sent');
            }
        } catch (error) {
            console.warn('Notification send failed:', error.message);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // RINGTONE + SOUNDS
    // ═══════════════════════════════════════════════════════════════
    
    let ringtoneAudio = null;
    
    function playRingtone() {
        try {
            // Create simple tone kwa Web Audio API
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            gainNode.gain.value = 0.1;
            
            // Ring pattern
            const ringInterval = setInterval(() => {
                oscillator.start();
                setTimeout(() => oscillator.stop(), 400);
                setTimeout(() => oscillator.start(), 600);
                setTimeout(() => oscillator.stop(), 1000);
            }, 2000);
            
            ringtoneAudio = {
                stop: () => {
                    clearInterval(ringInterval);
                    try {
                        oscillator.stop();
                        audioContext.close();
                    } catch (e) {}
                }
            };
            
            console.log('🔔 Ringtone started');
        } catch (error) {
            console.warn('Ringtone error:', error);
        }
    }
    
    function stopRingtone() {
        if (ringtoneAudio) {
            ringtoneAudio.stop();
            ringtoneAudio = null;
            console.log('🔕 Ringtone stopped');
        }
    }
    
    function playConnectedSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 600;
            gainNode.gain.value = 0.05;
            
            oscillator.start();
            setTimeout(() => oscillator.stop(), 150);
            setTimeout(() => audioContext.close(), 200);
        } catch (e) {}
    }
    
    // ═══════════════════════════════════════════════════════════════
    // CLEANUP
    // ═══════════════════════════════════════════════════════════════
    
    function cleanupCall() {
        console.log('🧹 Cleaning up call...');
        
        // Stop duration timer
        stopDurationTimer();
        
        // Stop local stream
        if (state.localStream) {
            state.localStream.getTracks().forEach(track => track.stop());
            state.localStream = null;
        }
        
        // Close peer connection
        if (state.peerConnection) {
            state.peerConnection.close();
            state.peerConnection = null;
        }
        
        // Close signaling channel
        if (state.callChannel) {
            supabaseClient.removeChannel(state.callChannel);
            state.callChannel = null;
        }
        
        // Clear videos
        state.ui.localVideo.srcObject = null;
        state.ui.remoteVideo.srcObject = null;
        
        // Reset state
        state.currentCall = null;
        state.remoteStream = null;
        state.callStartTime = null;
        state.isMuted = false;
        state.isCameraOff = false;
        state.iceServersUsed = 'google';
        
        // Reset UI
        state.ui.muteBtn.classList.remove('active');
        state.ui.muteBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        state.ui.videoBtn.classList.remove('active');
        state.ui.videoBtn.innerHTML = '<i class="fas fa-video"></i>';
        state.ui.speakerBtn.classList.remove('active');
        
        console.log('✅ Cleanup complete');
    }
    
    // ═══════════════════════════════════════════════════════════════
    // ERROR DISPLAY
    // ═══════════════════════════════════════════════════════════════
    
    function showCallError(message) {
        if (typeof showToast === 'function') {
            showToast(message, 'error');
        } else {
            alert(message);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════
    
    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    function getInitials(name) {
        if (!name) return '??';
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return parts[0].substring(0, 2).toUpperCase();
    }
    
    // ═══════════════════════════════════════════════════════════════
    // EXPORT GLOBAL API
    // ═══════════════════════════════════════════════════════════════
    
    window.ChatWebRTC = {
        init,
        startCall,
        acceptCall,
        declineCall,
        endCall,
        // Helpers
        getCurrentCall: () => state.currentCall,
        isInCall: () => !!state.currentCall
    };
    
    // Auto-init kama document iko ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    console.log('✅ OWNER_CHAT_WEBRTC loaded');
    console.log('   • ChatWebRTC.startCall(recipientId, name, "video"|"audio")');
    console.log('   • ChatWebRTC.endCall()');
    console.log('   • ChatWebRTC.isInCall()');
    
})();