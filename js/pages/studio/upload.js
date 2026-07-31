import { apiFetch } from '../../api/client.js';
import { API_BASE_URL } from '../../utils/config.js';
import { showToast } from '../../utils/toast.js';

let currentFileSizeBytes = 0;
let currentDurationSeconds = 0;

// Calculate dynamic cost
function calculateCost() {
    let cost = 1.0; // Base cost for submitting an upload
    document.querySelectorAll('input[name="quality"]:checked').forEach(cb => {
        cost += parseFloat(cb.dataset.cost);
    });
    
    const isAd = document.getElementById('is-ad-checkbox').checked;
    if (isAd) {
        const audience = parseInt(document.getElementById('target-audience').value) || 0;
        const times = parseInt(document.getElementById('target-times').value) || 0;
        cost += (audience * times);
    }
    
    // Add size-based cost (Original + Estimated Compression)
    const sizeMb = currentFileSizeBytes / (1024 * 1024);
    const sizeMultipliers = { '1080p': 0.8, '720p': 0.5, '480p': 0.3, '360p': 0.2, '240p': 0.1, '144p': 0.05 };
    
    let totalSizeMb = sizeMb; // original file size
    document.querySelectorAll('input[name="quality"]:checked').forEach(cb => {
        totalSizeMb += sizeMb * (sizeMultipliers[cb.value] || 0.5);
    });

    if (totalSizeMb > 100) {
        cost += (totalSizeMb - 100) * 10;
    }
    
    document.getElementById('dynamic-cost').textContent = cost.toFixed(1);
    
    // Update displays
    document.getElementById('file-size-display').textContent = totalSizeMb.toFixed(2) + ' MB (estimated total)';
    
    const m = Math.floor(currentDurationSeconds / 60);
    const s = Math.floor(currentDurationSeconds % 60);
    document.getElementById('duration-display').textContent = `${m}:${s < 10 ? '0' : ''}${s}`;
}

document.querySelectorAll('input[name="quality"]').forEach(checkbox => {
    checkbox.addEventListener('change', calculateCost);
});
document.getElementById('is-ad-checkbox').addEventListener('change', (e) => {
    if (e.target.checked && currentDurationSeconds > 0) {
        if (currentDurationSeconds < 5 || currentDurationSeconds > 600) {
            showToast("Ads must be between 5 seconds and 10 minutes long.", "error");
            e.target.checked = false;
            return;
        }
    }
    document.getElementById('ad-settings').style.display = e.target.checked ? 'flex' : 'none';
    calculateCost();
});
document.getElementById('card-type').addEventListener('change', (e) => {
    document.getElementById('custom-card-settings').style.display = e.target.value === 'CUSTOM' ? 'flex' : 'none';
});
document.getElementById('target-audience').addEventListener('input', calculateCost);
document.getElementById('target-times').addEventListener('input', calculateCost);

const dropZone = document.getElementById('drag-drop-zone');
const videoInput = document.getElementById('video-file');
const dropTitle = document.getElementById('drag-drop-title');
const dropDesc = document.getElementById('drag-drop-desc');

dropZone.addEventListener('click', () => videoInput.click());

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
});
function preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }

['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.style.borderColor = 'var(--accent-primary)', false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.style.borderColor = 'var(--border-color)', false);
});

dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files && files.length > 0) {
        videoInput.files = files;
        videoInput.dispatchEvent(new Event('change'));
    }
});

videoInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        dropTitle.textContent = file.name;
        dropDesc.textContent = (file.size / (1024*1024)).toFixed(2) + " MB";
        currentFileSizeBytes = file.size;
        
        // Extract duration using a temporary video element
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = function() {
            window.URL.revokeObjectURL(video.src);
            currentDurationSeconds = video.duration || 0;
            
            const isAd = document.getElementById('is-ad-checkbox');
            if (isAd.checked) {
                if (currentDurationSeconds < 5 || currentDurationSeconds > 600) {
                    showToast("Ads must be between 5 seconds and 10 minutes long. Ad campaign has been disabled.", "error");
                    isAd.checked = false;
                    document.getElementById('ad-settings').style.display = 'none';
                }
            }
            
            calculateCost();
        }
        video.src = URL.createObjectURL(file);
    } else {
        dropTitle.textContent = "Drag & Drop Video Here";
        dropDesc.textContent = "Or click to browse files (MP4, M4V)";
        currentFileSizeBytes = 0;
        currentDurationSeconds = 0;
        calculateCost();
    }
});

// Run once on load to set initial state
calculateCost();

document.getElementById('upload-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btn = document.getElementById('upload-btn');
    const msg = document.getElementById('upload-msg');
    
    const isAdChecked = document.getElementById('is-ad-checkbox').checked;
    if (isAdChecked) {
        if (currentDurationSeconds < 5 || currentDurationSeconds > 600) {
            showToast("Ads must be between 5 seconds and 10 minutes long.", "error");
            return;
        }
    }
    
    btn.disabled = true;
    btn.textContent = 'Uploading...';
    msg.style.display = 'none';

    try {
        const formData = new FormData();
        formData.append('title', document.getElementById('title').value);
        formData.append('description', document.getElementById('description').value);
        
        const videoFile = document.getElementById('video-file').files[0];
        formData.append('file', videoFile);
        
        const thumbFile = document.getElementById('thumbnail-file').files[0];
        if (thumbFile) {
            formData.append('custom_thumbnail', thumbFile);
        }
        
        const subFile = document.getElementById('subtitles-file').files[0];
        if (subFile) {
            formData.append('subtitles', subFile);
        }
        
        const selectedQualities = Array.from(document.querySelectorAll('input[name="quality"]:checked')).map(cb => cb.value);
        if (selectedQualities.length === 0) {
            msg.style.color = '#ef4444';
            msg.textContent = 'Please select at least one video quality.';
            msg.style.display = 'block';
            btn.disabled = false;
            btn.textContent = 'Submit Upload';
            return;
        }
        formData.append('qualities', selectedQualities.join(','));
        
        const isAd = document.getElementById('is-ad-checkbox').checked;
        if (isAd) {
            formData.append('is_ad', 'true');
            formData.append('target_audience', document.getElementById('target-audience').value);
            formData.append('target_times', document.getElementById('target-times').value);
            
            const cardType = document.getElementById('card-type').value;
            formData.append('card_type', cardType);
            
            if (cardType === 'CUSTOM') {
                formData.append('promo_header', document.getElementById('promo-header').value);
                formData.append('promo_description', document.getElementById('promo-description').value);
                formData.append('promo_link', document.getElementById('promo-link').value);
                
                const bannerFile = document.getElementById('promo-banner').files[0];
                if (bannerFile) formData.append('promo_banner', bannerFile);
                
                const iconFile = document.getElementById('promo-icon').files[0];
                if (iconFile) formData.append('promo_icon', iconFile);
            }
        }
        
        formData.append('file_size_bytes', currentFileSizeBytes);
        formData.append('duration_seconds', Math.floor(currentDurationSeconds));

        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_BASE_URL}/api/videos/upload`);
        const token = localStorage.getItem('phryco_token');
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        
        document.getElementById('progress-container').style.display = 'block';
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');
        
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percent = Math.round((e.loaded / e.total) * 100);
                progressBar.style.width = percent + '%';
                progressText.textContent = percent + '%';
            }
        });
        
        xhr.onload = () => {
            document.getElementById('progress-container').style.display = 'none';
            btn.disabled = false;
            btn.textContent = 'Upload Video';
            
            if (xhr.status >= 200 && xhr.status < 300) {
                const data = JSON.parse(xhr.responseText);
                showToast(data.message || "Upload successful!", "success");
                document.getElementById('upload-form').reset();
                dropTitle.textContent = "Drag & Drop Video Here";
                dropDesc.textContent = "Or click to browse files (MP4, M4V)";
                currentFileSizeBytes = 0; 
                currentDurationSeconds = 0; 
                calculateCost();
            } else {
                let err = "Upload failed";
                try { err = JSON.parse(xhr.responseText).detail || err; } catch(e){}
                showToast(err, "error");
            }
        };
        
        xhr.onerror = () => {
            document.getElementById('progress-container').style.display = 'none';
            btn.disabled = false;
            btn.textContent = 'Upload Video';
            showToast("Network error occurred during upload", "error");
        };
        
        xhr.send(formData);
    } catch (error) {
        btn.disabled = false;
        btn.textContent = 'Upload Video';
        showToast(`Upload failed: ${error.message}`, "error");
    }
});
