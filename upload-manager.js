// ============================================================
// KMCA OWNER — UPLOAD MANAGER
// Version: 4.0
// Smart Upload: Cloudinary (Images/Videos) + Uploadcare (Audio/Files)
// CSS included
// ============================================================

(function() {
    'use strict';

    // ============================================
    // CSS INJECTION
    // ============================================
    const UPLOAD_CSS = `
        /* ============================================================
           UPLOAD PREVIEW
           ============================================================ */
        .owner-upload-preview {
            display: none;
            margin-top: 12px;
            padding: 16px;
            background: var(--owner-bg-input, #1e293b);
            border: 1px solid var(--owner-border, #334155);
            border-radius: var(--owner-radius-md, 12px);
            animation: ownerUploadFadeIn 0.3s ease-out;
        }

        .owner-upload-preview.show {
            display: block;
        }

        @keyframes ownerUploadFadeIn {
            from { 
                opacity: 0; 
                transform: translateY(-8px); 
            }
            to { 
                opacity: 1; 
                transform: translateY(0); 
            }
        }

        .owner-upload-preview-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            gap: 12px;
        }

        .owner-upload-preview-name {
            font-size: 13px;
            font-weight: 600;
            color: var(--owner-text-light, #f8fafc);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            flex: 1;
            min-width: 0;
        }

        .owner-upload-preview-size {
            font-size: 11px;
            color: var(--owner-text-muted, #94a3b8);
            font-weight: 600;
            flex-shrink: 0;
        }

        /* Image Preview */
        .owner-upload-preview img {
            width: 100%;
            max-height: 240px;
            object-fit: contain;
            border-radius: var(--owner-radius-sm, 8px);
            background: #000;
            display: block;
        }

        /* Video Preview */
        .owner-upload-preview video {
            width: 100%;
            max-height: 240px;
            border-radius: var(--owner-radius-sm, 8px);
            background: #000;
            display: block;
        }

        /* Audio Preview */
        .owner-upload-preview audio {
            width: 100%;
            border-radius: var(--owner-radius-sm, 8px);
        }

        /* File Preview */
        .owner-upload-file-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            background: var(--owner-bg-card, #0f172a);
            border-radius: var(--owner-radius-sm, 8px);
        }

        .owner-upload-file-icon i {
            font-size: 48px;
            color: var(--owner-primary, #d4af37);
        }

        /* ============================================================
           UPLOAD PROGRESS BAR
           ============================================================ */
        .owner-upload-progress {
            display: none;
            margin-top: 12px;
        }

        .owner-upload-progress.show {
            display: block;
        }

        .owner-upload-progress-bar {
            width: 100%;
            height: 6px;
            background: var(--owner-bg-card, #0f172a);
            border-radius: 3px;
            overflow: hidden;
            margin-bottom: 8px;
        }

        .owner-upload-progress-fill {
            height: 100%;
            background: linear-gradient(90deg, var(--owner-primary, #d4af37), var(--owner-primary-light, #f0d060));
            border-radius: 3px;
            width: 0%;
            transition: width 0.3s ease-out;
            position: relative;
        }

        .owner-upload-progress-fill::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            animation: ownerUploadShimmer 1.5s infinite;
        }

        @keyframes ownerUploadShimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }

        .owner-upload-progress-text {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            color: var(--owner-text-muted, #94a3b8);
            font-weight: 600;
        }

        /* ============================================================
           MULTIPLE IMAGES GRID
           ============================================================ */
        .owner-upload-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
            gap: 8px;
            margin-top: 12px;
        }

        .owner-upload-grid-item {
            position: relative;
            aspect-ratio: 1;
            border-radius: var(--owner-radius-sm, 8px);
            overflow: hidden;
            background: #000;
            animation: ownerUploadFadeIn 0.3s ease-out;
        }

        .owner-upload-grid-item img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        }

        .owner-upload-grid-remove {
            position: absolute;
            top: 4px;
            right: 4px;
            width: 24px;
            height: 24px;
            background: rgba(239, 68, 68, 0.9);
            backdrop-filter: blur(4px);
            border: none;
            border-radius: 50%;
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            transition: all 0.2s;
            z-index: 2;
        }

        .owner-upload-grid-remove:hover {
            transform: scale(1.15);
            background: #ef4444;
        }

        .owner-upload-grid-loading {
            position: absolute;
            inset: 0;
            background: rgba(0,0,0,0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--owner-primary, #d4af37);
            font-size: 20px;
        }

        /* ============================================================
           UPLOAD ERROR
           ============================================================ */
        .owner-upload-error {
            display: none;
            align-items: flex-start;
            gap: 8px;
            margin-top: 12px;
            padding: 10px 14px;
            background: rgba(239, 68, 68, 0.1);
            border-left: 3px solid #ef4444;
            border-radius: var(--owner-radius-sm, 8px);
            font-size: 12px;
            color: #fca5a5;
            line-height: 1.5;
            animation: ownerUploadFadeIn 0.3s ease-out;
        }

        .owner-upload-error.show {
            display: flex;
        }

        .owner-upload-error i {
            font-size: 14px;
            flex-shrink: 0;
            margin-top: 1px;
            color: #ef4444;
        }
    `;

    // ============================================
    // INJECT CSS
    // ============================================
    function injectUploadCSS() {
        if (document.getElementById('owner-upload-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'owner-upload-styles';
        style.textContent = UPLOAD_CSS;
        document.head.appendChild(style);
        
        console.log('✅ Owner Upload CSS injected');
    }

    // ============================================
    // GET CONFIG
    // ============================================
    function getConfig() {
        return window.HOSTING_CONFIG || {};
    }

    // ============================================
    // FILE VALIDATION
    // ============================================
    function validateFile(file) {
        const config = getConfig();
        const limits = config.limits || {};
        const type = file.type;
        const size = file.size;
        
        // Determine category
        let category = 'file';
        if (type.startsWith('image/')) category = 'image';
        else if (type.startsWith('video/')) category = 'video';
        else if (type.startsWith('audio/')) category = 'audio';
        
        const maxSize = limits[category] || (50 * 1024 * 1024);
        
        // Check size
        if (size > maxSize) {
            return {
                valid: false,
                error: `File ni kubwa mno. Max: ${formatBytes(maxSize)}`,
                category
            };
        }
        
        // Specific type checks
        if (category === 'image') {
            const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
            if (!allowed.includes(type)) {
                return {
                    valid: false,
                    error: `Aina ya picha haikubaliwi. Tumia: JPG, PNG, WEBP, GIF, SVG`,
                    category
                };
            }
        }
        
        if (category === 'video') {
            const allowed = ['video/mp4', 'video/webm', 'video/quicktime'];
            if (!allowed.includes(type)) {
                return {
                    valid: false,
                    error: `Aina ya video haikubaliwi. Tumia: MP4, WEBM, MOV`,
                    category
                };
            }
        }
        
        if (category === 'audio') {
            const allowed = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/mp4', 'audio/aac', 'audio/ogg'];
            if (!allowed.includes(type)) {
                return {
                    valid: false,
                    error: `Aina ya sauti haikubaliwi. Tumia: MP3, WAV, M4A, AAC, OGG`,
                    category
                };
            }
        }
        
        return { valid: true, category };
    }

    // ============================================
    // GET API FOR FILE
    // ============================================
    function getApiForFile(file) {
        const type = file.type;
        
        if (type.startsWith('image/')) return 'cloudinary.image';
        if (type.startsWith('video/')) return 'cloudinary.video';
        return 'uploadcare';
    }

    // ============================================
    // MAIN UPLOAD FUNCTION
    // ============================================
    async function uploadFileSmart(file, options = {}) {
        const {
            onProgress = null,
            compress = false,
            maxRetries = 3,
            forceApi = null
        } = options;
        
        try {
            // Validate
            const validation = validateFile(file);
            if (!validation.valid) {
                return { success: false, error: validation.error };
            }
            
            console.log('📤 Uploading:', file.name, '| Size:', formatBytes(file.size), '| Type:', file.type);
            
            // Compress (optional)
            let processedFile = file;
            if (compress && file.type.startsWith('image/')) {
                processedFile = await compressImage(file);
            }
            
            // Determine API
            const api = forceApi || getApiForFile(file);
            console.log('🎯 Target API:', api);
            
            let result = null;
            
            if (api === 'cloudinary.image') {
                result = await uploadToCloudinaryImage(processedFile, onProgress, maxRetries);
            } else if (api === 'cloudinary.video') {
                result = await uploadToCloudinaryVideo(processedFile, onProgress, maxRetries);
            } else {
                result = await uploadToUploadcare(processedFile, onProgress, maxRetries);
            }
            
            if (result.success) {
                console.log('✅ Upload successful:', result.url);
            }
            
            return result;
            
        } catch (error) {
            console.error('❌ Upload error:', error);
            return { success: false, error: error.message };
        }
    }

    // ============================================
    // UPLOAD TO CLOUDINARY — IMAGE
    // ============================================
    async function uploadToCloudinaryImage(file, onProgress, maxRetries = 3) {
        const config = getConfig();
        const primary = config.cloudinary?.image;
        const emergencies = config.cloudinary?.emergency || [];
        
        if (!primary) {
            return { success: false, error: 'Cloudinary config haipo' };
        }
        
        // 1. Try primary
        try {
            console.log('📷 Trying primary image:', primary.name);
            const result = await uploadToCloudinary(file, primary, onProgress, maxRetries);
            if (result.success) return result;
        } catch (e) {
            console.warn('⚠️ Primary image failed:', e.message);
        }
        
        // 2. Try emergencies
        for (let i = 0; i < emergencies.length; i++) {
            const emergency = emergencies[i];
            try {
                console.log(`🚨 Trying emergency [${i + 1}]:`, emergency.name);
                const result = await uploadToCloudinary(file, emergency, onProgress, maxRetries);
                if (result.success) return result;
            } catch (e) {
                console.warn(`⚠️ Emergency [${i + 1}] failed:`, e.message);
            }
        }
        
        // 3. Fallback to Uploadcare
        try {
            console.log('📦 Fallback to Uploadcare');
            return await uploadToUploadcare(file, onProgress, maxRetries);
        } catch (e) {
            return { success: false, error: 'All image upload methods failed' };
        }
    }

    // ============================================
    // UPLOAD TO CLOUDINARY — VIDEO
    // ============================================
    async function uploadToCloudinaryVideo(file, onProgress, maxRetries = 3) {
        const config = getConfig();
        const primary = config.cloudinary?.video;
        const emergencies = config.cloudinary?.emergency || [];
        
        if (!primary) {
            return { success: false, error: 'Cloudinary video config haipo' };
        }
        
        // 1. Try primary
        try {
            console.log('🎥 Trying primary video:', primary.name);
            const result = await uploadToCloudinary(file, primary, onProgress, maxRetries);
            if (result.success) return result;
        } catch (e) {
            console.warn('⚠️ Primary video failed:', e.message);
        }
        
        // 2. Try emergencies
        for (let i = 0; i < emergencies.length; i++) {
            const emergency = emergencies[i];
            try {
                console.log(`🚨 Trying emergency [${i + 1}]:`, emergency.name);
                const result = await uploadToCloudinary(file, emergency, onProgress, maxRetries);
                if (result.success) return result;
            } catch (e) {
                console.warn(`⚠️ Emergency [${i + 1}] failed:`, e.message);
            }
        }
        
        // 3. Fallback
        try {
            console.log('📦 Fallback to Uploadcare');
            return await uploadToUploadcare(file, onProgress, maxRetries);
        } catch (e) {
            return { success: false, error: 'All video upload methods failed' };
        }
    }

    // ============================================
    // CLOUDINARY RAW UPLOAD
    // ============================================
    async function uploadToCloudinary(file, account, onProgress, maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await uploadToCloudinaryRaw(file, account, onProgress);
            } catch (error) {
                console.warn(`Cloudinary attempt ${attempt}/${maxRetries}:`, error.message);
                if (attempt === maxRetries) throw error;
                await delay(1000 * attempt);
            }
        }
    }

    function uploadToCloudinaryRaw(file, account, onProgress) {
        return new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', account.uploadPreset);
            
            if (account.folder) {
                formData.append('folder', account.folder);
            }
            
            const xhr = new XMLHttpRequest();
            
            // Progress
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable && onProgress) {
                    const percent = Math.round((e.loaded / e.total) * 100);
                    onProgress(percent);
                }
            });
            
            // Success
            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const data = JSON.parse(xhr.responseText);
                        if (data.secure_url) {
                            resolve({
                                success: true,
                                url: data.secure_url,
                                host: 'cloudinary',
                                account: account.name,
                                publicId: data.public_id,
                                format: data.format,
                                size: data.bytes,
                                width: data.width,
                                height: data.height,
                                duration: data.duration
                            });
                        } else {
                            reject(new Error(data.error?.message || 'Upload failed'));
                        }
                    } catch (e) {
                        reject(e);
                    }
                } else {
                    reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
                }
            });
            
            xhr.addEventListener('error', () => reject(new Error('Network error')));
            xhr.addEventListener('timeout', () => reject(new Error('Timeout')));
            
            const endpoint = `https://api.cloudinary.com/v1_1/${account.cloudName}/auto/upload`;
            xhr.open('POST', endpoint);
            xhr.timeout = 300000; // 5 min
            xhr.send(formData);
        });
    }

    // ============================================
    // UPLOADCARE UPLOAD
    // ============================================
    async function uploadToUploadcare(file, onProgress, maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await uploadToUploadcareRaw(file, onProgress);
            } catch (error) {
                console.warn(`Uploadcare attempt ${attempt}/${maxRetries}:`, error.message);
                if (attempt === maxRetries) throw error;
                await delay(1000 * attempt);
            }
        }
    }

    function uploadToUploadcareRaw(file, onProgress) {
        return new Promise((resolve, reject) => {
            const config = getConfig();
            const uploadcare = config.uploadcare || {};
            
            if (!uploadcare.publicKey) {
                reject(new Error('Uploadcare public key haipo'));
                return;
            }
            
            const formData = new FormData();
            formData.append('file', file);
            formData.append('UPLOADCARE_PUB_KEY', uploadcare.publicKey);
            formData.append('UPLOADCARE_STORE', 'auto');
            
            const xhr = new XMLHttpRequest();
            
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable && onProgress) {
                    const percent = Math.round((e.loaded / e.total) * 100);
                    onProgress(percent);
                }
            });
            
            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const data = JSON.parse(xhr.responseText);
                        if (data.file) {
                            resolve({
                                success: true,
                                url: `${uploadcare.cdnBase}${data.file}/`,
                                host: 'uploadcare',
                                uuid: data.file
                            });
                        } else {
                            reject(new Error('Upload failed'));
                        }
                    } catch (e) {
                        reject(e);
                    }
                } else {
                    reject(new Error(`HTTP ${xhr.status}`));
                }
            });
            
            xhr.addEventListener('error', () => reject(new Error('Network error')));
            xhr.addEventListener('timeout', () => reject(new Error('Timeout')));
            
            xhr.open('POST', 'https://upload.uploadcare.com/base/');
            xhr.timeout = 300000;
            xhr.send(formData);
        });
    }

    // ============================================
    // COMPRESS IMAGE
    // ============================================
    async function compressImage(file, maxWidth = 1920, quality = 0.85) {
        return new Promise((resolve) => {
            if (file.size < 500 * 1024) {
                resolve(file);
                return;
            }
            
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const img = new Image();
                
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    canvas.toBlob(
                        (blob) => {
                            const compressed = new File([blob], file.name, { 
                                type: 'image/jpeg' 
                            });
                            console.log('🗜️ Compressed:', formatBytes(file.size), '→', formatBytes(compressed.size));
                            resolve(compressed);
                        },
                        'image/jpeg',
                        quality
                    );
                };
                
                img.onerror = () => resolve(file);
                img.src = e.target.result;
            };
            
            reader.onerror = () => resolve(file);
            reader.readAsDataURL(file);
        });
    }

    // ============================================
    // UPLOAD MULTIPLE FILES
    // ============================================
    async function uploadMultipleFiles(files, options = {}) {
        const results = [];
        const total = files.length;
        
        for (let i = 0; i < total; i++) {
            const file = files[i];
            
            if (options.onProgress) {
                options.onProgress({
                    fileIndex: i,
                    totalFiles: total,
                    fileName: file.name,
                    percent: 0
                });
            }
            
            const result = await uploadFileSmart(file, {
                ...options,
                onProgress: (percent) => {
                    if (options.onProgress) {
                        options.onProgress({
                            fileIndex: i,
                            totalFiles: total,
                            fileName: file.name,
                            percent
                        });
                    }
                }
            });
            
            results.push(result);
            
            if (!result.success && options.stopOnError) break;
        }
        
        return results;
    }

    // ============================================
    // UI HELPERS — Preview
    // ============================================
    
    // Show preview kwa file
    function showUploadPreview(previewElementId, file, url = null) {
        const preview = document.getElementById(previewElementId);
        if (!preview) return;
        
        preview.innerHTML = `
            <div class="owner-upload-preview-header">
                <span class="owner-upload-preview-name">${escapeHtml(file.name)}</span>
                <span class="owner-upload-preview-size">${formatBytes(file.size)}</span>
            </div>
            <div class="owner-upload-preview-body"></div>
        `;
        
        const body = preview.querySelector('.owner-upload-preview-body');
        const fileUrl = url || URL.createObjectURL(file);
        
        if (file.type.startsWith('image/')) {
            body.innerHTML = `<img src="${fileUrl}" alt="Preview">`;
        } else if (file.type.startsWith('video/')) {
            body.innerHTML = `<video src="${fileUrl}" controls></video>`;
        } else if (file.type.startsWith('audio/')) {
            body.innerHTML = `<audio src="${fileUrl}" controls></audio>`;
        } else {
            // File icon
            const ext = file.name.split('.').pop().toLowerCase();
            const iconMap = {
                pdf: 'fa-file-pdf',
                doc: 'fa-file-word',
                docx: 'fa-file-word',
                xls: 'fa-file-excel',
                xlsx: 'fa-file-excel',
                zip: 'fa-file-archive',
                rar: 'fa-file-archive',
                apk: 'fa-android'
            };
            const icon = iconMap[ext] || 'fa-file';
            
            body.innerHTML = `
                <div class="owner-upload-file-icon">
                    <i class="fas ${icon}"></i>
                </div>
            `;
        }
        
        preview.classList.add('show');
    }

    // Hide preview
    function hideUploadPreview(previewElementId) {
        const preview = document.getElementById(previewElementId);
        if (preview) {
            preview.classList.remove('show');
            preview.innerHTML = '';
        }
    }

    // Show progress
    function showUploadProgress(progressElementId, percent, text = null) {
        const progress = document.getElementById(progressElementId);
        if (!progress) return;
        
        progress.classList.add('show');
        
        const fill = progress.querySelector('.owner-upload-progress-fill');
        if (fill) fill.style.width = percent + '%';
        
        const progressText = progress.querySelector('.owner-upload-progress-percent');
        if (progressText) progressText.textContent = percent + '%';
        
        const statusText = progress.querySelector('.owner-upload-progress-status');
        if (statusText && text) statusText.textContent = text;
    }

    // Hide progress
    function hideUploadProgress(progressElementId) {
        const progress = document.getElementById(progressElementId);
        if (progress) {
            progress.classList.remove('show');
            const fill = progress.querySelector('.owner-upload-progress-fill');
            if (fill) fill.style.width = '0%';
        }
    }

    // Show error
    function showUploadError(errorElementId, message) {
        const el = document.getElementById(errorElementId);
        if (!el) return;
        
        el.innerHTML = `<i class="fas fa-exclamation-circle"></i><span>${escapeHtml(message)}</span>`;
        el.classList.add('show');
    }

    // Hide error
    function hideUploadError(errorElementId) {
        const el = document.getElementById(errorElementId);
        if (el) el.classList.remove('show');
    }

    // ============================================
    // HELPERS
    // ============================================
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function formatBytes(bytes) {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function getFileExtension(filename) {
        return filename.split('.').pop().toLowerCase();
    }

    function getFileCategory(file) {
        if (file.type.startsWith('image/')) return 'image';
        if (file.type.startsWith('video/')) return 'video';
        if (file.type.startsWith('audio/')) return 'audio';
        return 'file';
    }

    // ============================================
    // CLOUDINARY URL TRANSFORMATIONS
    // ============================================
    function getCloudinaryThumbnail(publicId, account = null) {
        const config = getConfig();
        const acc = account || config.cloudinary?.image;
        if (!acc) return publicId;
        return `https://res.cloudinary.com/${acc.cloudName}/image/upload/w_400,h_300,c_fill,q_auto,f_auto/${publicId}`;
    }

    function getCloudinarySmall(publicId, account = null) {
        const config = getConfig();
        const acc = account || config.cloudinary?.image;
        if (!acc) return publicId;
        return `https://res.cloudinary.com/${acc.cloudName}/image/upload/w_800,q_auto,f_auto/${publicId}`;
    }

    function getCloudinaryMedium(publicId, account = null) {
        const config = getConfig();
        const acc = account || config.cloudinary?.image;
        if (!acc) return publicId;
        return `https://res.cloudinary.com/${acc.cloudName}/image/upload/w_1200,q_auto,f_auto/${publicId}`;
    }

    function getCloudinaryLarge(publicId, account = null) {
        const config = getConfig();
        const acc = account || config.cloudinary?.image;
        if (!acc) return publicId;
        return `https://res.cloudinary.com/${acc.cloudName}/image/upload/w_1920,q_auto,f_auto/${publicId}`;
    }

    // ============================================
    // MULTIPLE IMAGE GRID HELPER
    // ============================================
    function renderImageGrid(containerId, urls, onRemove = null) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = urls.map((url, index) => `
            <div class="owner-upload-grid-item" data-index="${index}">
                <img src="${url}" alt="Image ${index + 1}" loading="lazy">
                ${onRemove ? `
                    <button class="owner-upload-grid-remove" data-index="${index}" type="button">
                        <i class="fas fa-times"></i>
                    </button>
                ` : ''}
            </div>
        `).join('');
        
        if (onRemove) {
            container.querySelectorAll('.owner-upload-grid-remove').forEach(btn => {
                btn.addEventListener('click', function() {
                    const idx = parseInt(this.getAttribute('data-index'));
                    onRemove(idx);
                });
            });
        }
    }

    // ============================================
    // EXPORT GLOBAL
    // ============================================
    window.uploadFileSmart = uploadFileSmart;
    window.uploadMultipleFiles = uploadMultipleFiles;
    window.validateFile = validateFile;
    window.getApiForFile = getApiForFile;
    window.compressImage = compressImage;
    
    // Cloudinary direct uploads
    window.uploadToCloudinaryImage = uploadToCloudinaryImage;
    window.uploadToCloudinaryVideo = uploadToCloudinaryVideo;
    window.uploadToUploadcare = uploadToUploadcare;
    
    // UI Helpers
    window.showUploadPreview = showUploadPreview;
    window.hideUploadPreview = hideUploadPreview;
    window.showUploadProgress = showUploadProgress;
    window.hideUploadProgress = hideUploadProgress;
    window.showUploadError = showUploadError;
    window.hideUploadError = hideUploadError;
    window.renderImageGrid = renderImageGrid;
    
    // URL transformations
    window.getCloudinaryThumbnail = getCloudinaryThumbnail;
    window.getCloudinarySmall = getCloudinarySmall;
    window.getCloudinaryMedium = getCloudinaryMedium;
    window.getCloudinaryLarge = getCloudinaryLarge;
    
    // Utils
    window.formatBytes = formatBytes;
    window.getFileCategory = getFileCategory;

    // ============================================
    // AUTO-INIT
    // ============================================
    function ready(fn) {
        if (document.readyState !== 'loading') {
            fn();
        } else {
            document.addEventListener('DOMContentLoaded', fn);
        }
    }

    ready(() => {
        injectUploadCSS();
        console.log('✅ OWNER_UPLOAD v4.0 ready');
    });

    console.log('✅ UPLOAD_MANAGER v4.0 loaded (with CSS)');
    console.log('   • uploadFileSmart()');
    console.log('   • uploadMultipleFiles()');
    console.log('   • validateFile()');
    console.log('   • compressImage()');
    console.log('   • showUploadPreview()');
    console.log('   • showUploadProgress()');
    console.log('   • renderImageGrid()');

})();