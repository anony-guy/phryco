import { apiFetch } from '../api/client.js';
import { API_BASE_URL } from '../utils/config.js';
import { escapeHTML } from '../utils/security.js';
import { InfiniteScroller } from '../utils/pagination.js';
import { setupVideoCardPreview } from '../utils/preview_player.js';

function formatDuration(seconds) {
    if(!seconds) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}

let scroller;

function renderVideoCard(video) {
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
            ${video.is_ad ? `<div style="position: absolute; top: 8px; left: 8px; background: rgba(0,0,0,0.8); color: var(--phrybucks-gold); padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; border: 1px solid var(--phrybucks-gold); z-index: 2; display: flex; align-items: center; gap: 4px;"><i data-lucide="megaphone" style="width:12px; height:12px;"></i> Includes Paid Promotion</div>` : ''}
            <img src="${API_BASE_URL}/api/videos/${video.id}/thumbnail" loading="lazy" class="thumbnail-img" style="width:100%; height:100%; object-fit:cover; transition: opacity 0.3s;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <!-- Placeholder thumbnail (fallback) -->
            <div class="thumbnail-fallback" style="display:none; width:100%; height:100%; background:linear-gradient(45deg, #1e293b, #334155); align-items:center; justify-content:center;">
                <i data-lucide="play" style="color: rgba(255,255,255,0.2); width: 48px; height: 48px;"></i>
            </div>
            <!-- Video preview element -->
            <video class="video-preview" muted playsinline loop style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; opacity:0; transition: opacity 0.3s; pointer-events:none;"></video>
        ${video.duration_seconds ? `<div class="video-duration">${formatDuration(video.duration_seconds)}</div>` : ""}</div>
        <div class="video-info">
            <div class="video-title">${escapeHTML(video.title)}</div>
            <div class="video-meta">
                <span>${escapeHTML(video.owner_username)}</span>
                <span>${video.views} views • ${video.likes} likes${dateHtml}</span>
            </div>
        </div>
    `;
    
    // Attach modular video preview logic
    setupVideoCardPreview(card, video.id);
    
    return card;
}

const emptyStateHTML = `
    <div style="text-align: center; padding: 5rem 2rem; background: var(--bg-glass); border-radius: var(--radius-xl); border: 1px solid var(--border-color); grid-column: 1 / -1; backdrop-filter: blur(20px); box-shadow: var(--shadow-lg); max-width: 720px; margin: 2rem auto;">
        <!-- Futuristic Radar / Space Discovery Vector -->
        <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" style="margin: 0 auto 1.5rem auto; filter: drop-shadow(0 0 16px var(--accent-glow));">
            <circle cx="12" cy="12" r="10"></circle>
            <circle cx="12" cy="12" r="6"></circle>
            <circle cx="12" cy="12" r="2"></circle>
            <path d="M12 2a10 10 0 0 1 10 10"></path>
            <path d="m19.07 4.93-7.07 7.07"></path>
        </svg>
        <h2 class="text-gradient" style="margin: 0 0 0.75rem 0; font-size: 1.6rem; font-family: 'Outfit', sans-serif;">Discover Cinematic Masterpieces</h2>
        <p style="color: var(--text-secondary); margin-bottom: 2rem; max-width: 480px; margin-left: auto; margin-right: auto;">Your personalized recommendation feed is currently calibrated for exploration. Watch videos or visit trending to shape your universe.</p>
        <a href="./pages/trending/index.html" class="btn-primary" style="display: inline-flex; align-items: center; gap: 0.6rem;">
            <i data-lucide="trending-up" style="width: 18px; height: 18px;"></i> Explore Trending Now
        </a>
    </div>
`;

function renderSkeletonCard() {
    const card = document.createElement('div');
    card.className = 'video-card skeleton-card';
    card.innerHTML = `
        <div class="video-thumbnail skeleton-shimmer" style="width:100%; aspect-ratio:16/9;"></div>
        <div class="video-info" style="display:flex; flex-direction:column; gap:0.6rem;">
            <div class="skeleton-shimmer" style="width:85%; height:1.1rem; border-radius:var(--radius-sm);"></div>
            <div class="skeleton-shimmer" style="width:50%; height:0.85rem; border-radius:var(--radius-sm);"></div>
        </div>
    `;
    return card;
}

async function loadVideos() {
    const container = document.getElementById('video-container');
    container.innerHTML = '';
    
    // Inject skeletons initially
    for(let i=0; i<8; i++) {
        container.appendChild(renderSkeletonCard());
    }
    
    scroller = new InfiniteScroller({
        endpoint: '/api/videos/recommended',
        container: container,
        emptyHTML: emptyStateHTML,
        renderCallback: (items, sentinel) => {
            // Remove skeletons on first render
            const skeletons = container.querySelectorAll('.skeleton-card');
            skeletons.forEach(s => s.remove());
            
            items.forEach(video => {
                const card = renderVideoCard(video);
                container.insertBefore(card, sentinel);
            });
        }
    });
    
    await scroller.initialize();
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', loadVideos);

