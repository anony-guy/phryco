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
        
        container.innerHTML = frames.map(f => {
            const hasPromo = f.temp_price_phrybucks !== null && f.temp_price_phrybucks !== undefined && f.temp_price_expires_at;
            let badgeHTML = '';
            let priceHTML = `<div class="frame-price"><i data-lucide="coins" style="width: 16px; height: 16px;"></i> ${f.active_price || f.price_phrybucks} PB</div>`;
            
            if (hasPromo) {
                const expiresDate = new Date(f.temp_price_expires_at);
                const diffMs = expiresDate - new Date();
                const daysLeft = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
                
                if (f.is_discount) {
                    badgeHTML = `
                        <div style="position: absolute; top: 10px; right: 10px; background: linear-gradient(135deg, #10b981, #059669); color: #fff; font-weight: 800; font-size: 0.75rem; padding: 4px 8px; border-radius: 20px; box-shadow: 0 2px 8px rgba(16,185,129,0.4); z-index: 10; display: flex; align-items: center; gap: 4px;">
                            <i data-lucide="tag" style="width: 12px; height: 12px;"></i> SALE! (${daysLeft}d left)
                        </div>
                    `;
                    priceHTML = `
                        <div class="frame-price" style="display: flex; align-items: center; gap: 0.5rem;">
                            <span style="text-decoration: line-through; color: var(--text-secondary); font-size: 0.9rem;">${f.price_phrybucks} PB</span>
                            <span style="color: #10b981; font-weight: 800;"><i data-lucide="coins" style="width: 16px; height: 16px; display: inline-block; vertical-align: middle;"></i> ${f.temp_price_phrybucks} PB</span>
                        </div>
                    `;
                } else if (f.is_price_hike) {
                    badgeHTML = `
                        <div style="position: absolute; top: 10px; right: 10px; background: linear-gradient(135deg, #f97316, #dc2626); color: #fff; font-weight: 800; font-size: 0.75rem; padding: 4px 8px; border-radius: 20px; box-shadow: 0 2px 8px rgba(249,115,22,0.4); z-index: 10; display: flex; align-items: center; gap: 4px;">
                            <i data-lucide="flame" style="width: 12px; height: 12px;"></i> HIGH DEMAND
                        </div>
                    `;
                    priceHTML = `
                        <div class="frame-price" style="display: flex; flex-direction: column; align-items: flex-start;">
                            <span style="color: #f97316; font-weight: 800;"><i data-lucide="coins" style="width: 16px; height: 16px; display: inline-block; vertical-align: middle;"></i> ${f.temp_price_phrybucks} PB</span>
                            <small style="font-size: 0.7rem; color: var(--text-secondary); line-height: 1;">Surge ends in ${daysLeft} days (Normal: ${f.price_phrybucks} PB)</small>
                        </div>
                    `;
                }
            }
            
            return `
            <div class="frame-card" style="position: relative; overflow: hidden;">
                ${badgeHTML}
                <div class="frame-preview">
                    <span style="color: #666; font-size: 0.8rem;">Video Preview</span>
                    <img src="../..${f.image_path}" class="frame-overlay" alt="${f.name}">
                </div>
                <div class="frame-info">
                    <div class="frame-title">${f.name}</div>
                    <div class="frame-desc">${f.description || ''}</div>
                    ${priceHTML}
                </div>
                <button class="btn-primary" style="width: 100%; ${f.owned ? 'background: #444; cursor: default;' : ''}"
                    ${f.owned ? 'disabled' : `onclick="window.buyFrame(${f.id}, '${f.name.replace(/'/g, "\\'")}')"`}>
                    ${f.owned ? 'Owned' : 'Buy Frame'}
                </button>
            </div>
            `;
        }).join('');
        
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
