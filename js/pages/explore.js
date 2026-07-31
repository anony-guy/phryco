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

function renderCategorySection(categoryName, videos) {
    const section = document.createElement('div');
    section.className = 'category-section';
    
    const title = document.createElement('h2');
    title.className = 'category-title';
    title.textContent = categoryName;
    section.appendChild(title);
    
    const grid = document.createElement('div');
    grid.className = 'video-grid';
    
    videos.forEach(video => {
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
                <div class="thumbnail-fallback" style="display:none; width:100%; height:100%; background:linear-gradient(45deg, #1e293b, #334155); align-items:center; justify-content:center;">
                    <i data-lucide="play" style="color: rgba(255,255,255,0.2); width: 48px; height: 48px;"></i>
                </div>
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
            }, 500);
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
        
        grid.appendChild(card);
    });
    
    section.appendChild(grid);
    return section;
}

function renderSkeletonSection() {
    const section = document.createElement('div');
    section.className = 'category-section skeleton-section';
    
    const title = document.createElement('div');
    title.className = 'skeleton';
    title.style.cssText = 'width:200px; height:2rem; border-radius:4px; margin-bottom:1rem;';
    section.appendChild(title);
    
    const grid = document.createElement('div');
    grid.className = 'video-grid';
    
    for(let i=0; i<4; i++) {
        const card = document.createElement('div');
        card.className = 'video-card';
        card.innerHTML = `
            <div class="video-thumbnail skeleton" style="width:100%; aspect-ratio:16/9;"></div>
            <div class="video-info" style="display:flex; flex-direction:column; gap:0.5rem;">
                <div class="skeleton" style="width:80%; height:1rem; border-radius:4px;"></div>
                <div class="skeleton" style="width:60%; height:0.875rem; border-radius:4px;"></div>
            </div>
        `;
        grid.appendChild(card);
    }
    section.appendChild(grid);
    return section;
}

async function loadVideos() {
    const container = document.getElementById('explore-container');
    container.innerHTML = '';
    
    for(let i=0; i<3; i++) {
        container.appendChild(renderSkeletonSection());
    }
    
    scroller = new InfiniteScroller({
        endpoint: '/api/videos/explore',
        container: container,
        emptyHTML: '<p style="color: var(--text-secondary); text-align: center; width: 100%;">No videos found.</p>',
        renderCallback: (items, sentinel) => {
            const skeletons = container.querySelectorAll('.skeleton-section');
            skeletons.forEach(s => s.remove());
            
            for (const [categoryName, videos] of Object.entries(items)) {
                if (videos.length === 0) continue;
                const section = renderCategorySection(categoryName, videos);
                container.insertBefore(section, sentinel);
            }
            if (window.lucide) window.lucide.createIcons();
        }
    });
    
    await scroller.initialize();
}

document.addEventListener('DOMContentLoaded', loadVideos);
