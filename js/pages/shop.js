import { apiFetch } from '../api/client.js';
import { API_BASE_URL } from '../utils/config.js';

document.addEventListener('DOMContentLoaded', async () => {
    await loadFrames();
});

async function loadFrames() {
    const container = document.getElementById('frames-container');
    const errorMsg = document.getElementById('error-msg');
    
    try {
        const frames = await apiFetch('/api/shop/frames');
        if (frames.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary);">No frames are currently available in the shop.</p>';
            return;
        }
        
        container.innerHTML = frames.map(f => `
            <div class="frame-card">
                <div class="frame-preview">
                    <span style="color: #666; font-size: 0.8rem;">Video Preview</span>
                    <img src="../..${f.image_path}" class="frame-overlay" alt="${f.name}">
                </div>
                <div class="frame-info">
                    <div class="frame-title">${f.name}</div>
                    <div class="frame-desc">${f.description || ''}</div>
                    <div class="frame-price">
                        <i data-lucide="coins" style="width: 16px; height: 16px;"></i>
                        ${f.price_phrybucks} PB
                    </div>
                </div>
                <button class="btn-primary" style="width: 100%; ${f.owned ? 'background: #444; cursor: default;' : ''}"
                    ${f.owned ? 'disabled' : `onclick="window.buyFrame(${f.id}, '${f.name}')"`}>
                    ${f.owned ? 'Owned' : 'Buy Frame'}
                </button>
            </div>
        `).join('');
        
        if (typeof lucide !== 'undefined') lucide.createIcons();
    } catch (e) {
        errorMsg.textContent = "Failed to load shop items.";
        errorMsg.style.display = "block";
    }
}

window.buyFrame = async (id, name) => {
    const errorMsg = document.getElementById('error-msg');
    errorMsg.style.display = 'none';
    
    if (!confirm(`Are you sure you want to buy ${name}?`)) return;
    
    try {
        await apiFetch(`/api/shop/frames/${id}/buy`, { method: 'POST' });
        alert(`Successfully purchased ${name}! You can now equip it in the Studio.`);
        // Reload balances and frames
        const headerScript = await import('../components/header.js');
        if (headerScript && headerScript.updatePhrybucksDisplay) {
            headerScript.updatePhrybucksDisplay();
        }
        await loadFrames();
    } catch (e) {
        errorMsg.textContent = e.message || "Failed to buy frame. Make sure you have enough Phrybucks.";
        errorMsg.style.display = "block";
    }
};
