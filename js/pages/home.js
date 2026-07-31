import { apiFetch } from '../api/client.js';
import { API_BASE_URL } from '../utils/config.js';
import { escapeHTML } from '../utils/security.js';
import { InfiniteScroller } from '../utils/pagination.js';

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
    
    // Video Hover Preview Logic
    let hoverTimer;
    card.addEventListener('mouseenter', () => {
        hoverTimer = setTimeout(() => {
            const preview = card.querySelector('.video-preview');
            const img = card.querySelector('.thumbnail-img');
            if (preview && !preview.src) {
                const token = localStorage.getItem('phryco_token');
                const tokenParam = token ? `?token=${token}` : '';
                preview.src = `${API_BASE_URL}/api/videos/${video.id}/stream${tokenParam}`;
            }
            if (preview) {
                preview.play().then(() => {
                    preview.style.opacity = '1';
                    if(img) img.style.opacity = '0';
                }).catch(e => console.log('Preview play blocked', e));
            }
        }, 500); // 500ms delay before preview
    });
    card.addEventListener('mouseleave', () => {
        clearTimeout(hoverTimer);
        const preview = card.querySelector('.video-preview');
        const img = card.querySelector('.thumbnail-img');
        if (preview) {
            preview.pause();
            preview.currentTime = 0;
            preview.style.opacity = '0';
        }
        if (img) img.style.opacity = '1';
    });
    
    return card;
}

const emptyStateHTML = `
    <div style="text-align: center; padding: 4rem 1rem; background: var(--bg-secondary); border-radius: var(--radius-lg); border: 1px dashed var(--border-color); grid-column: 1 / -1;">
        <i data-lucide="compass" style="width: 48px; height: 48px; color: var(--text-secondary); margin-bottom: 1rem;"></i>
        <h2 style="margin: 0 0 0.5rem 0; color: var(--text-primary);">Watch some videos to get personalized recommendations!</h2>
        <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">We need a little help figuring out what you like.</p>
        <a href="../../pages/trending/index.html" class="btn-primary" style="display: inline-flex; align-items: center; gap: 0.5rem;">
            <i data-lucide="trending-up" style="width: 18px; height: 18px;"></i> Go to Trending
        </a>
    </div>
`;

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

