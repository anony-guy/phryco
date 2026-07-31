import { apiFetch } from '../../api/client.js';
import { API_BASE_URL } from '../../utils/config.js';

let videoId = null;
let currentTags = [];
let currentChapters = [];

document.addEventListener('DOMContentLoaded', async () => {

    
    // Get video ID from URL
    const params = new URLSearchParams(window.location.search);
    videoId = params.get('id');
    if (!videoId) {
        window.location.href = 'content.html';
        return;
    }
    
    lucide.createIcons();
    
    setupTabs();
    setupTagEditor();
    
    document.getElementById('discard-btn').addEventListener('click', () => {
        if (confirm("Are you sure you want to discard your changes?")) {
            window.location.href = 'content.html';
        }
    });
    
    document.getElementById('add-chapter-btn').addEventListener('click', () => {
        currentChapters.push({ title: 'New Chapter', start: 0 });
        // sort by start time
        currentChapters.sort((a,b) => a.start - b.start);
        renderChapters();
    });
    
    document.getElementById('save-btn').addEventListener('click', saveChanges);
    
    await loadVideoData();
});

function setupTabs() {
    const tabs = document.querySelectorAll('.edit-sidebar-btn');
    const panels = document.querySelectorAll('.tab-panel');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            // Remove active from all
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            
            // Add active to clicked
            tab.classList.add('active');
            const targetId = tab.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });
}

function setupTagEditor() {
    const input = document.getElementById('tag-input');
    const container = document.getElementById('tag-container');
    
    // Focus styling
    input.addEventListener('focus', () => container.classList.add('focused'));
    input.addEventListener('blur', () => container.classList.remove('focused'));
    
    // Keydown for enter/comma
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const tagText = input.value.trim().replace(/^,+|,+$/g, '');
            if (tagText && !currentTags.includes(tagText)) {
                currentTags.push(tagText);
                renderTags();
            }
            input.value = '';
        } else if (e.key === 'Backspace' && input.value === '' && currentTags.length > 0) {
            currentTags.pop();
            renderTags();
        }
    });
}

function renderTags() {
    const container = document.getElementById('tag-container');
    const input = document.getElementById('tag-input');
    
    // Remove all existing pills
    const pills = container.querySelectorAll('.tag-pill');
    pills.forEach(p => p.remove());
    
    // Insert new pills before input
    currentTags.forEach((tag, index) => {
        const pill = document.createElement('div');
        pill.className = 'tag-pill';
        pill.innerHTML = `
            ${tag}
            <button type="button" data-index="${index}"><i data-lucide="x" style="width:14px; height:14px;"></i></button>
        `;
        container.insertBefore(pill, input);
        
        pill.querySelector('button').addEventListener('click', (e) => {
            e.preventDefault();
            currentTags.splice(index, 1);
            renderTags();
        });
    });
    
    lucide.createIcons();
}

function renderChapters() {
    const list = document.getElementById('chapters-list');
    list.innerHTML = '';
    
    currentChapters.forEach((chapter, index) => {
        const div = document.createElement('div');
        div.style = 'display: flex; gap: 1rem; align-items: center; background: var(--bg-primary); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);';
        
        div.innerHTML = `
            <div style="flex: 1;">
                <label style="display: block; font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.25rem;">Title</label>
                <input type="text" class="form-control" value="${chapter.title}" onchange="updateChapterTitle(${index}, this.value)" style="width: 100%;">
            </div>
            <div style="width: 100px;">
                <label style="display: block; font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.25rem;">Start (sec)</label>
                <input type="number" class="form-control" value="${chapter.start}" min="0" onchange="updateChapterStart(${index}, this.value)" style="width: 100%;">
            </div>
            <button type="button" onclick="deleteChapter(${index})" style="background: none; border: none; color: var(--error); cursor: pointer; padding: 0.5rem; margin-top: 1rem;">
                <i data-lucide="trash-2"></i>
            </button>
        `;
        list.appendChild(div);
    });
    
    lucide.createIcons();
}

window.updateChapterTitle = (index, value) => {
    currentChapters[index].title = value;
};
window.updateChapterStart = (index, value) => {
    currentChapters[index].start = parseInt(value) || 0;
};
window.deleteChapter = (index) => {
    currentChapters.splice(index, 1);
    renderChapters();
};

async function loadVideoData() {
    try {
        const videos = await apiFetch('/api/studio/videos?limit=100');
        const video = videos.find(v => v.id == videoId);
        
        if (!video) {
            alert("Video not found");
            window.location.href = 'content.html';
            return;
        }
        
        document.getElementById('video-title-header').textContent = `Edit: ${video.title}`;
        document.getElementById('edit-title').value = video.title;
        document.getElementById('edit-description').value = video.description || '';
        document.getElementById('edit-category').value = video.category || '';
        
        // Tags
        currentTags = (video.tags || '').split(',').map(t => t.trim()).filter(t => t);
        renderTags();
        
        // Chapters
        currentChapters = video.chapters || [];
        renderChapters();
        
        // Status & Schedule
        const statusSelect = document.getElementById('edit-status');
        const tierContainer = document.getElementById('tier-requirement-container');
        const tierSelect = document.getElementById('edit-required-tier');
        
        statusSelect.addEventListener('change', (e) => {
            if (e.target.value === 'MEMBER_ONLY') {
                tierContainer.style.display = 'block';
            } else {
                tierContainer.style.display = 'none';
            }
        });
        
        // Load tiers for dropdown
        try {
            const tiers = await apiFetch('/api/studio/memberships/tiers');
            tierSelect.innerHTML = '<option value="">All Members</option>';
            tiers.forEach(t => {
                tierSelect.innerHTML += `<option value="${t.id}">${t.name} (Level ${t.level})</option>`;
            });
            if (video.required_tier_id) {
                tierSelect.value = video.required_tier_id;
            }
        } catch (e) {
            console.error("Failed to load tiers", e);
        }
        
        // Load frames for dropdown
        try {
            const frames = await apiFetch('/api/studio/inventory/frames');
            const frameSelect = document.getElementById('edit-frame');
            if (frameSelect) {
                frames.forEach(f => {
                    frameSelect.innerHTML += `<option value="${f.id}">${f.name}</option>`;
                });
                if (video.frame_id) {
                    frameSelect.value = video.frame_id;
                }
            }
        } catch (e) {
            console.error("Failed to load frames", e);
        }

        if (video.status === 'PENDING_REVIEW') {
            statusSelect.value = 'PENDING_REVIEW';
            statusSelect.disabled = true;
        } else {
            statusSelect.value = video.status === 'REMOVED' ? 'PRIVATE' : video.status;
            statusSelect.disabled = false;
        }
        
        // Trigger change event to show/hide tier dropdown based on loaded status
        statusSelect.dispatchEvent(new Event('change'));
        
        if (video.scheduled_release_date) {
            // Format to YYYY-MM-DDThh:mm for datetime-local
            const dateObj = new Date(video.scheduled_release_date);
            const iso = dateObj.toISOString();
            document.getElementById('edit-schedule').value = iso.slice(0, 16);
        } else {
            document.getElementById('edit-schedule').value = '';
        }
        
        // Audience & Monetization
        document.getElementById('edit-kids').checked = video.made_for_kids || false;
        document.getElementById('edit-age').checked = video.age_restricted || false;
        document.getElementById('edit-monetization').checked = video.monetization_enabled !== false; // default true
        
        // Media Previews
        const thumbPreview = document.getElementById('thumbnail-preview');
        if (video.has_thumbnail) {
            thumbPreview.src = `${API_BASE_URL}/api/videos/${video.id}/thumbnail?t=${new Date().getTime()}`;
        }
        
        const scrubberPreview = document.getElementById('scrubber-preview');
        if (video.has_scrubber) {
            scrubberPreview.src = `${API_BASE_URL}/api/videos/${video.id}/scrubber?t=${new Date().getTime()}`;
            scrubberPreview.style.display = 'block';
        }
        
    } catch (error) {
        console.error(error);
        alert("Failed to load video data");
    }
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.style.padding = '1rem 1.5rem';
    toast.style.borderRadius = '8px';
    toast.style.marginBottom = '10px';
    toast.style.color = 'white';
    toast.style.backgroundColor = type === 'success' ? '#10b981' : '#ef4444';
    toast.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
    toast.style.transition = 'opacity 0.3s';
    toast.textContent = message;
    
    document.getElementById('toast-container').appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

async function saveChanges() {
    const btn = document.getElementById('save-btn');
    btn.textContent = 'Saving...';
    btn.disabled = true;
    
    try {
        // 1. Update text metadata
        const updatePayload = {
            title: document.getElementById('edit-title').value,
            description: document.getElementById('edit-description').value,
            tags: currentTags.join(','),
            category: document.getElementById('edit-category').value,
            made_for_kids: document.getElementById('edit-kids').checked,
            age_restricted: document.getElementById('edit-age').checked,
            monetization_enabled: document.getElementById('edit-monetization').checked
        };
        
        const statusSelect = document.getElementById('edit-status');
        if (!statusSelect.disabled) {
            updatePayload.status = statusSelect.value;
            if (updatePayload.status === 'MEMBER_ONLY') {
                const tierVal = document.getElementById('edit-required-tier').value;
                updatePayload.required_tier_id = tierVal ? parseInt(tierVal, 10) : null;
            } else {
                updatePayload.required_tier_id = null;
            }
        }
        
        const scheduleVal = document.getElementById('edit-schedule').value;
        if (scheduleVal) {
            updatePayload.scheduled_release_date = new Date(scheduleVal).toISOString();
        } else {
            updatePayload.scheduled_release_date = ""; // Server handles empty string as None
        }
        
        await apiFetch(`/api/studio/videos/${videoId}`, {
            method: 'PUT',
            body: updatePayload
        });
        
        // 1.5 Update Chapters
        // sort by start time before saving
        currentChapters.sort((a,b) => a.start - b.start);
        await apiFetch(`/api/studio/videos/${videoId}/chapters`, {
            method: 'PUT',
            body: { chapters: currentChapters }
        });
        
        // 1.6 Update Frame
        const frameSelect = document.getElementById('edit-frame');
        if (frameSelect) {
            const frameId = parseInt(frameSelect.value, 10) || 0;
            await apiFetch(`/api/studio/videos/${videoId}/frame?frame_id=${frameId}`, { method: 'PUT' });
        }
        
        // 2. Upload thumbnail if changed
        const thumbFile = document.getElementById('edit-thumbnail').files[0];
        if (thumbFile) {
            const formData = new FormData();
            formData.append('file', thumbFile);
            await apiFetch(`/api/studio/videos/${videoId}/thumbnail`, {
                method: 'POST',
                body: formData
            });
        }
        
        // 3. Upload scrubber if changed
        const scrubberFile = document.getElementById('edit-scrubber').files[0];
        if (scrubberFile) {
            const formData = new FormData();
            formData.append('file', scrubberFile);
            await apiFetch(`/api/studio/videos/${videoId}/scrubber`, {
                method: 'POST',
                body: formData
            });
        }
        
        showToast("Changes saved successfully!");
        
        // Reload data to reflect changes
        setTimeout(loadVideoData, 500);
        
    } catch (error) {
        console.error(error);
        showToast("Failed to save changes. " + (error.message || ""), 'error');
    } finally {
        btn.textContent = 'Save Changes';
        btn.disabled = false;
    }
}
