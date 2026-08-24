// ============================================
// SMART UPLOAD MANAGER
// ============================================

async function uploadFileSmart(file) {
    const fileSize = file.size;
    const fileType = file.type;
    const fileSizeMB = fileSize / (1024 * 1024);
    
    console.log('Uploading:', file.name, fileSizeMB.toFixed(2) + 'MB');
    
    // VIDEO → Cloudinary
    if (fileType.startsWith('video/')) {
        console.log('→ Cloudinary (video)');
        return await uploadToCloudinary(file);
    }
    
    // PICHA → Cloudinary
    if (fileType.startsWith('image/')) {
        console.log('→ Cloudinary (picha)');
        return await uploadToCloudinary(file);
    }
    
    // AUDIO → Supabase
    if (fileType.startsWith('audio/')) {
        console.log('→ Supabase (audio)');
        return await uploadToSupabase(file, 'music');
    }
    
    // PDF/DOC/APK/ZIP → Uploadcare
    if (fileType === 'application/pdf' || 
        fileType.includes('word') || 
        fileType.includes('apk') || 
        fileType.includes('zip') ||
        fileType.includes('rar') ||
        fileType.includes('excel') ||
        fileType.includes('powerpoint')) {
        console.log('→ Uploadcare (file)');
        return await uploadToUploadcare(file);
    }
    
    // FALLBACK → Supabase
    console.log('→ Supabase (fallback)');
    return await uploadToSupabase(file, 'posts');
}

// Cloudinary Upload (bila apiSecret)
async function uploadToCloudinary(file) {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', HOSTING_CONFIG.cloudinary.uploadPreset);
        
        const response = await fetch(
            'https://api.cloudinary.com/v1_1/' + HOSTING_CONFIG.cloudinary.cloudName + '/auto/upload',
            { method: 'POST', body: formData }
        );
        
        const data = await response.json();
        
        if (data.secure_url) {
            return { success: true, url: data.secure_url, host: 'cloudinary' };
        }
        
        return { success: false, error: data.error?.message || 'Upload failed' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Supabase Upload
async function uploadToSupabase(file, bucket) {
    try {
        const fileName = Date.now() + '-' + file.name.replace(/[^a-zA-Z0-9.]/g, '_');
        
        const { error } = await supabaseClient.storage.from(bucket).upload(fileName, file);
        
        if (error) throw error;
        
        const url = HOSTING_CONFIG.supabase.url + '/storage/v1/object/public/' + bucket + '/' + fileName;
        
        return { success: true, url: url, host: 'supabase' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Uploadcare Upload
async function uploadToUploadcare(file) {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('UPLOADCARE_PUB_KEY', HOSTING_CONFIG.uploadcare.publicKey);
        formData.append('UPLOADCARE_STORE', 'auto');
        
        const response = await fetch('https://upload.uploadcare.com/base/', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.file) {
            const url = 'https://ucarecdn.com/' + data.file + '/';
            return { success: true, url: url, host: 'uploadcare' };
        }
        
        return { success: false, error: 'Upload failed' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}