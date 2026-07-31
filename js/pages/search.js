import { apiFetch } from '../api/client.js';
import { API_BASE_URL } from '../utils/config.js';
import { escapeHTML } from '../utils/security.js';
import { InfiniteScroller } from '../utils/pagination.js';

let scroller;

function renderSearchResultCard(video) {
    let dateStr = '';
    if (video.created_at) {
        const parsedDate = new Date(video.created_at).toLocaleDateString();
        if (parsedDate !== 'Invalid Date' && parsedDate !== 'Invalid date') {
            dateStr = ` • ${parsedDate}`;
        }
    }
    
    const card = document.createElement('a');
    card.href = `/pages/watch/index.html?v=${video.id}`;
    card.className = 'search-result-card animate-fade-in';
    card.innerHTML = `
        <div class="search-result-thumbnail">
            <img src="${API_BASE_URL}/api/videos/${video.id}/thumbnail" alt="${escapeHTML(video.title)}">
            ${video.is_ad ? '<div class="ad-badge">Ad</div>' : ''}
        </div>
        <div class="search-result-info">
            <h3 class="search-result-title">${escapeHTML(video.title)}</h3>
            <div class="search-result-meta">
                <span>${video.views.toLocaleString()} views${dateStr}</span>
            </div>
            
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem;">
                <img src="${API_BASE_URL}/api/users/${video.owner_username}/avatar" onerror="this.src=''; this.style.display='none';" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover; background: var(--bg-primary);">
                <span style="color: var(--text-secondary); font-size: 0.875rem;">${escapeHTML(video.owner_username)}</span>
            </div>
            
            <p class="search-result-desc">${escapeHTML(video.description || '')}</p>
        </div>
    `;
    return card;
}

const emptyStateHTML = `
    <div style="text-align: center; margin-top: 4rem; color: var(--text-secondary);">
        <i data-lucide="search-x" style="width: 48px; height: 48px; margin-bottom: 1rem; opacity: 0.5;"></i>
        <h2 style="margin: 0 0 0.5rem 0;">No results found</h2>
        <p>Try different keywords or remove search filters</p>
    </div>
`;

async function loadSearchResults() {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    const titleEl = document.getElementById('search-title');
    const container = document.getElementById('search-results');
    
    if (!query) {
        titleEl.textContent = "Please enter a search term.";
        container.innerHTML = '';
        return;
    }
    
    titleEl.textContent = `Search Results for "${escapeHTML(query)}"`;
    
    // Also prepopulate the search bar input so it matches the query
    const searchInputs = document.querySelectorAll('.search-bar input');
    searchInputs.forEach(input => {
        input.value = query;
    });
    
    container.innerHTML = '';
    
    scroller = new InfiniteScroller({
        endpoint: `/api/videos/search?q=${encodeURIComponent(query)}`,
        container: container,
        emptyHTML: emptyStateHTML,
        renderCallback: (items, sentinel) => {
            items.forEach((video) => {
                const card = renderSearchResultCard(video);
                container.insertBefore(card, sentinel);
            });
            if (window.lucide) window.lucide.createIcons();
        }
    });
    
    await scroller.initialize();
}

document.addEventListener('DOMContentLoaded', loadSearchResults);
