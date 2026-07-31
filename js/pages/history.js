import { apiFetch } from '../api/client.js';
import { API_BASE_URL } from '../utils/config.js';
import { escapeHTML } from '../utils/security.js';
import { InfiniteScroller } from '../utils/pagination.js';

let scroller;

function renderHistoryCard(video) {
    const card = document.createElement('a');
    card.href = `/pages/watch/index.html?v=${video.id}`;
    card.className = 'history-card animate-fade-in';
    
    let dateHtml = '';
    if (video.created_at) {
        const dateStr = new Date(video.created_at).toLocaleDateString();
        if (dateStr !== 'Invalid Date' && dateStr !== 'Invalid date') {
            dateHtml = ` • ${dateStr}`;
        }
    }
    
    card.innerHTML = `
        <div class="history-thumbnail">
            ${video.is_ad ? `<div style="position: absolute; top: 8px; left: 8px; background: rgba(0,0,0,0.8); color: var(--phrybucks-gold); padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; border: 1px solid var(--phrybucks-gold); z-index: 2; display: flex; align-items: center; gap: 4px;"><i data-lucide="megaphone" style="width:12px; height:12px;"></i> Includes Paid Promotion</div>` : ''}
            <img src="${API_BASE_URL}/api/videos/${video.id}/thumbnail" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <!-- Placeholder thumbnail (fallback) -->
            <div style="display:none; width:100%; height:100%; background:linear-gradient(45deg, #1e293b, #334155); align-items:center; justify-content:center;">
                <i data-lucide="play" style="color: rgba(255,255,255,0.2); width: 48px; height: 48px;"></i>
            </div>
        </div>
        <div class="history-info">
            <h3 class="history-title">${escapeHTML(video.title)}</h3>
            <div class="history-meta">
                <span>${escapeHTML(video.owner_username)}</span>
                <span>${video.views} views</span>
            </div>
            <div class="history-desc">${escapeHTML(video.description || '')}</div>
        </div>
    `;
    return card;
}

async function loadHistory() {
    const container = document.getElementById('history-container');
    const clearBtn = document.getElementById('clear-history-btn');
    container.innerHTML = '';

    // Require login for history
    const token = localStorage.getItem('phryco_token');
    if (!token) {
        container.innerHTML = `
            <div style="text-align: center; padding: 4rem 1rem; background: var(--bg-secondary); border-radius: var(--radius-lg); border: 1px dashed var(--border-color);">
                <i data-lucide="history" style="width: 48px; height: 48px; color: var(--text-secondary); margin-bottom: 1rem;"></i>
                <h2 style="margin: 0 0 0.5rem 0; color: var(--text-primary);">Keep track of what you watch</h2>
                <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">Watch history isn't viewable when signed out.</p>
                <a href="../../pages/login/index.html" class="btn-primary" style="display: inline-flex; align-items: center; gap: 0.5rem;">
                    <i data-lucide="user" style="width: 18px; height: 18px;"></i> Sign In
                </a>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
        if (clearBtn) clearBtn.style.display = 'none';
        return;
    }
    
    scroller = new InfiniteScroller({
        endpoint: '/api/videos/history',
        container: container,
        emptyHTML: '<p style="color: var(--text-secondary); text-align: center; margin-top: 2rem;">Your watch history is empty.</p>',
        renderCallback: (items, sentinel) => {
            if (items.length > 0 && clearBtn) {
                clearBtn.style.display = 'flex';
            } else if (container.children.length <= 1 && clearBtn) {
                clearBtn.style.display = 'none';
            }
            
            items.forEach(video => {
                const card = renderHistoryCard(video);
                container.insertBefore(card, sentinel);
            });
            if (window.lucide) window.lucide.createIcons();
        }
    });
    
    await scroller.initialize();
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    loadHistory();
    
    const clearBtn = document.getElementById('clear-history-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', async () => {
            if (!confirm("Are you sure you want to clear your entire watch history? This cannot be undone.")) return;
            
            try {
                await apiFetch('/api/videos/history', { method: 'DELETE' });
                // Reload history to show empty state
                loadHistory();
            } catch (error) {
                alert("Failed to clear history: " + error.message);
            }
        });
    }
});
