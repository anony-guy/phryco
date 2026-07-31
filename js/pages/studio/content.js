import { apiFetch } from '../../api/client.js';
import { escapeHTML } from '../../utils/security.js';
import { API_BASE_URL } from '../../utils/config.js';
import { InfiniteScroller } from '../../utils/pagination.js';

let currentVideos = [];
let scroller;

function getStatusBadge(status) {
    const s = status.toLowerCase();
    switch(s) {
        case 'draft': return `<span class="status-badge status-draft">Draft</span>`;
        case 'pending_review': return `<span class="status-badge status-pending">Pending Review</span>`;
        case 'public': return `<span class="status-badge status-public">Public</span>`;
        case 'private': return `<span class="status-badge" style="background: rgba(168, 85, 247, 0.2); color: #c084fc;">Private</span>`;
        case 'removed': return `<span class="status-badge status-removed">Removed</span>`;
        default: return `<span class="status-badge">${status}</span>`;
    }
}

function renderVideoRow(v) {
    const tr = document.createElement('tr');
    const safeTitle = escapeHTML(v.title);
    let actionHtml = '';
    
    if (v.status === 'REMOVED') {
        actionHtml = `<button class="btn-primary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="restoreVideo(${v.id})">Restore</button>`;
    } else {
        actionHtml = `<button style="background: transparent; border: 1px solid var(--border-color); color: var(--text-primary); padding: 0.25rem 0.5rem; font-size: 0.75rem; border-radius: var(--radius-md); margin-right: 0.5rem; cursor: pointer;" onclick="openEditModal(${v.id})">Edit</button>`;
        
        // Add a submit button if the video is still a draft
        if (v.status === 'DRAFT') {
            actionHtml += `<button class="btn-primary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; margin-right: 0.5rem;" onclick="submitForReview(${v.id})">Submit for Review</button>`;
        } else if (v.status === 'PUBLIC') {
            actionHtml += `<a href="../../../pages/watch/index.html?v=${v.id}" target="_blank" style="color: var(--accent-primary); font-size: 0.875rem; margin-left: 0.5rem; margin-right: 0.5rem;">Watch</a>`;
        }
        
        actionHtml += `<button style="background: transparent; border: 1px solid #ef4444; color: #ef4444; padding: 0.25rem 0.5rem; font-size: 0.75rem; border-radius: var(--radius-md); cursor: pointer;" onclick="deleteVideo(${v.id})">Delete</button>`;
    }

    tr.innerHTML = `
        <td>
            <strong>${safeTitle}</strong>
            ${v.status === 'REMOVED' ? `<div style="font-size: 0.75rem; color: #ef4444; margin-top: 0.25rem;">Deletes permanently on ${new Date(v.scheduled_deletion_date).toLocaleString()}</div>` : ''}
        </td>
        <td>${getStatusBadge(v.status)}</td>
        <td>${v.views.toLocaleString()}</td>
        <td>${v.likes.toLocaleString()}</td>
        <td style="display: flex; align-items: center;">${actionHtml}</td>
    `;
    return tr;
}

async function loadContent() {
    const tbody = document.getElementById('content-table-body');
    tbody.innerHTML = '';
    
    // reset currentVideos array to match pagination
    currentVideos = [];
    
    scroller = new InfiniteScroller({
        endpoint: '/api/studio/videos',
        container: tbody,
        emptyHTML: `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">No videos uploaded yet.</td></tr>`,
        sentinelTagName: 'tr',
        renderCallback: (items, sentinel) => {
            items.forEach(v => {
                currentVideos.push(v);
                const tr = renderVideoRow(v);
                tbody.insertBefore(tr, sentinel);
            });
        }
    });
    
    try {
        await scroller.initialize();
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="5" style="color: #ef4444; text-align: center;">Failed to load content: ${error.message}</td></tr>`;
    }
}

// Make functions global for inline onclick handlers
window.submitForReview = async function(videoId) {
    if(!confirm("Are you sure you want to submit this video for review?")) return;
    
    try {
        await apiFetch(`/api/videos/${videoId}/submit`, { method: 'POST' });
        alert("Video submitted for review!");
        loadContent(); // reload table
    } catch (error) {
        alert("Failed to submit: " + error.message);
    }
};

window.deleteVideo = async function(videoId) {
    if(!confirm("Are you sure you want to move this video to trash? It will be permanently deleted in 1 hour.")) return;
    
    try {
        await apiFetch(`/api/studio/videos/${videoId}`, { method: 'DELETE' });
        loadContent();
    } catch (error) {
        alert("Failed to delete video: " + error.message);
    }
};

window.restoreVideo = async function(videoId) {
    try {
        await apiFetch(`/api/studio/videos/${videoId}/restore`, { method: 'POST' });
        loadContent();
    } catch (error) {
        alert("Failed to restore video: " + error.message);
    }
};

window.openEditModal = function(videoId) {
    window.location.href = `edit_video.html?id=${videoId}`;
};

document.addEventListener('DOMContentLoaded', () => {
    loadContent();
});
