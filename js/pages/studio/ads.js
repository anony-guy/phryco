import { apiFetch } from '../../api/client.js';
import { escapeHTML } from '../../utils/security.js';
import { API_BASE_URL } from '../../utils/config.js';
import { InfiniteScroller } from '../../utils/pagination.js';

let scroller;

document.addEventListener('DOMContentLoaded', async () => {
    // Auth is handled by apiFetch automatically redirecting to login if token is missing
    loadAds();
});

function renderAdRow(ad) {
    const targetViews = ad.target_audience * ad.target_times;
    const progress = targetViews > 0 ? (ad.times_shown / targetViews) * 100 : 0;
    const isCompleted = ad.times_shown >= targetViews;
    
    let statusHtml = '';
    if (isCompleted) {
        statusHtml = '<span class="status-badge completed"><i data-lucide="check-circle" style="width:12px;height:12px;"></i> Completed</span>';
    } else if (ad.is_active) {
        statusHtml = '<span class="status-badge active"><i data-lucide="activity" style="width:12px;height:12px;"></i> Active</span>';
    } else {
        statusHtml = '<span class="status-badge inactive"><i data-lucide="pause-circle" style="width:12px;height:12px;"></i> Inactive</span>';
    }

    const targetingParts = [];
    if (ad.target_country) targetingParts.push(`Geo: ${ad.target_country}`);
    if (ad.target_device) targetingParts.push(`Device: ${ad.target_device}`);
    const targetingText = targetingParts.length > 0 ? targetingParts.join(', ') : 'Global / Any Device';

    const tr = document.createElement('tr');
    tr.style.cursor = 'pointer';
    tr.onclick = () => window.location.href = `manage_ad.html?id=${ad.id}`;
    tr.classList.add('hover-row');
    
    tr.innerHTML = `
        <td>
            <div style="font-weight: 500;">${ad.title}</div>
            <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem;">Video ID: ${ad.video_id}</div>
        </td>
        <td>${statusHtml}</td>
        <td style="min-width: 200px;">
            <div style="display: flex; justify-content: space-between; font-size: 0.875rem; margin-bottom: 0.25rem;">
                <span>${ad.times_shown.toLocaleString()} views</span>
                <span style="color: var(--text-secondary);">${targetViews.toLocaleString()} target</span>
            </div>
            <div class="progress-bar-container">
                <div class="progress-bar" style="width: ${Math.min(progress, 100)}%;"></div>
            </div>
        </td>
        <td style="color: var(--text-secondary); font-size: 0.875rem;">${targetingText}</td>
    `;
    return tr;
}

async function loadAds() {
    const tableBody = document.getElementById('ads-table-body');
    tableBody.innerHTML = '';
    
    scroller = new InfiniteScroller({
        endpoint: '/api/ads/me',
        container: tableBody,
        emptyHTML: '<tr><td colspan="4" style="text-align: center; color: var(--text-secondary); padding: 2rem;">No ad campaigns found. You can launch one from the Upload page!</td></tr>',
        sentinelTagName: 'tr',
        renderCallback: (items, sentinel) => {
            items.forEach(ad => {
                const tr = renderAdRow(ad);
                tableBody.insertBefore(tr, sentinel);
            });
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    });
    
    try {
        await scroller.initialize();
    } catch (error) {
        console.error('Error loading ads:', error);
        tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--accent-primary); padding: 2rem;">Error loading ad campaigns.</td></tr>`;
    }
}
