import { apiFetch } from '../api/client.js';
import { escapeHTML } from '../utils/security.js';
import { InfiniteScroller } from '../utils/pagination.js';

let scroller;

function renderNotificationCard(n) {
    const card = document.createElement('div');
    card.className = `notification-card ${n.is_read ? '' : 'unread'}`;
    
    let dateStr = '';
    if (n.created_at) {
        const parsedDate = new Date(n.created_at);
        if (!isNaN(parsedDate.getTime())) {
            dateStr = parsedDate.toLocaleString();
        }
    }
    
    let markReadBtn = '';
    if (!n.is_read) {
        markReadBtn = `<button class="btn-primary" style="padding: 0.25rem 0.75rem; font-size: 0.75rem;" onclick="markAsRead(${n.id}, this)">Mark Read</button>`;
    }
    
    card.innerHTML = `
        <div class="notification-content">
            <p>${escapeHTML(n.message)}</p>
            ${dateStr ? `<span class="notification-date">${dateStr}</span>` : ''}
        </div>
        ${markReadBtn}
    `;
    return card;
}

async function loadNotifications() {
    const container = document.getElementById('notifications-container');
    container.innerHTML = '';
    
    scroller = new InfiniteScroller({
        endpoint: '/api/notifications',
        container: container,
        emptyHTML: `<p style="text-align: center; color: var(--text-secondary);">You have no notifications.</p>`,
        renderCallback: (items, sentinel) => {
            items.forEach(n => {
                const card = renderNotificationCard(n);
                container.insertBefore(card, sentinel);
            });
        }
    });
    
    try {
        await scroller.initialize();
    } catch (error) {
        container.innerHTML = `<p style="text-align: center; color: #ef4444;">Failed to load notifications.</p>`;
    }
}

window.markAsRead = async function(id, btnElement) {
    try {
        await apiFetch(`/api/notifications/${id}/read`, { method: 'POST' });
        // Update UI optimistically
        const card = btnElement.closest('.notification-card');
        card.classList.remove('unread');
        btnElement.remove();
    } catch (error) {
        console.error("Failed to mark as read:", error);
    }
};

document.addEventListener('DOMContentLoaded', loadNotifications);
