import { apiFetch } from '../api/client.js';
import { API_BASE_URL } from '../utils/config.js';
import { escapeHTML, renderCreatorBadges } from '../utils/security.js';
import { InfiniteScroller } from '../utils/pagination.js';
import { setupVideoCardPreview } from '../utils/preview_player.js';

function formatDuration(seconds) {
    if(!seconds) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}

let scroller;

function renderVideoCard(video, rank) {
    const card = document.createElement('div');
    card.className = 'video-card animate-fade-in';
    card.onclick = () => window.location.href = `/pages/watch/index.html?v=${video.id}`;
    
    let dateHtml = '';
    if (video.created_at) {
        const dateStr = new Date(video.created_at).toLocaleDateString();
        if (dateStr !== 'Invalid Date' && dateStr !== 'Invalid date') {
            dateHtml = ` • ${dateStr}`;
        }
    }
    
    card.innerHTML = `
        <div class="video-thumbnail" style="position: relative; overflow: hidden;">
            <div style="position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.8); color: white; padding: 4px 8px; border-radius: 4px; font-size: 1rem; font-weight: 700; z-index: 2;">
                #${rank}
            </div>
            ${video.is_ad ? `<div style="position: absolute; top: 8px; left: 8px; background: rgba(0,0,0,0.8); color: var(--phrybucks-gold); padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; border: 1px solid var(--phrybucks-gold); z-index: 2; display: flex; align-items: center; gap: 4px;"><i data-lucide="megaphone" style="width:12px; height:12px;"></i> Includes Paid Promotion</div>` : ''}
            <img src="${API_BASE_URL}/api/videos/${video.id}/thumbnail" loading="lazy" class="thumbnail-img" style="width:100%; height:100%; object-fit:cover; transition: opacity 0.3s;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div class="thumbnail-fallback" style="display:none; width:100%; height:100%; background:linear-gradient(45deg, #1e293b, #334155); align-items:center; justify-content:center;">
                <i data-lucide="play" style="color: rgba(255,255,255,0.2); width: 48px; height: 48px;"></i>
            </div>
            <video class="video-preview" muted playsinline loop style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; opacity:0; transition: opacity 0.3s; pointer-events:none;"></video>
        ${video.duration_seconds ? `<div class="video-duration">${formatDuration(video.duration_seconds)}</div>` : ""}</div>
        <div class="video-info">
            <div class="video-title">${escapeHTML(video.title)}</div>
            <div class="video-meta">
                <span>${escapeHTML(video.owner_username)}${renderCreatorBadges(video)}</span>
                <span>${video.views} views • ${video.likes} likes${dateHtml}</span>
            </div>
        </div>
    `;
    
    setupVideoCardPreview(card, video.id);
    
    return card;
}

function renderSkeletonCard() {
    const card = document.createElement('div');
    card.className = 'video-card skeleton-card';
    card.innerHTML = `
        <div class="video-thumbnail skeleton" style="width:100%; aspect-ratio:16/9;"></div>
        <div class="video-info" style="display:flex; flex-direction:column; gap:0.5rem;">
            <div class="skeleton" style="width:80%; height:1rem; border-radius:4px;"></div>
            <div class="skeleton" style="width:60%; height:0.875rem; border-radius:4px;"></div>
        </div>
    `;
    return card;
}

async function loadVideos() {
    const container = document.getElementById('video-container');
    container.innerHTML = '';
    
    for(let i=0; i<8; i++) {
        container.appendChild(renderSkeletonCard());
    }
    
    scroller = new InfiniteScroller({
        endpoint: '/api/videos/trending',
        container: container,
        emptyHTML: '<p style="color: var(--text-secondary); grid-column: 1 / -1; text-align: center;">No trending videos found.</p>',
        renderCallback: (items, sentinel) => {
            const skeletons = container.querySelectorAll('.skeleton-card');
            skeletons.forEach(s => s.remove());
            
            items.forEach((video, index) => {
                const rank = scroller.skip + index + 1;
                const card = renderVideoCard(video, rank);
                container.insertBefore(card, sentinel);
            });
        }
    });
    
    await scroller.initialize();
}

document.addEventListener('DOMContentLoaded', loadVideos);
