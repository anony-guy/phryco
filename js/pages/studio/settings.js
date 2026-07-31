import { apiFetch } from '../../api/client.js';
import { API_BASE_URL } from '../../utils/config.js';

let currentTiers = [];

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('phryco_token') || localStorage.getItem('token');
    if (!token) {
        window.location.href = '/pages/login/index.html';
        return;
    }
    
    // Load profile
    try {
        const user = await apiFetch('/api/users/me');
        document.getElementById('channel-name-input').value = user.username;
        document.getElementById('channel-desc-input').value = user.channel_description || user.channel_bio || '';
    } catch (e) {
        console.error(e);
    }
    
    // Profile save
    document.getElementById('profile-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('channel-name-input').value;
        const channel_description = document.getElementById('channel-desc-input').value;
        
        try {
            const res = await apiFetch('/api/studio/channel', {
                method: 'PUT',
                body: { username, channel_description }
            });
            alert(res.message || "Profile saved");
        } catch (err) {
            alert(err.message || 'Error saving profile');
        }
    });
    
    loadTiers();
    
    // Add Tier Modal
    document.getElementById('add-tier-btn').addEventListener('click', () => {
        document.getElementById('tier-modal').style.display = 'flex';
    });
    
    document.getElementById('tier-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('tier-name-input').value;
        const price_phrybucks = parseFloat(document.getElementById('tier-price-input').value);
        const level = parseInt(document.getElementById('tier-level-input').value, 10);
        
        try {
            await apiFetch('/api/studio/memberships/tiers', {
                method: 'POST',
                body: { name, price_phrybucks, level }
            });
            document.getElementById('tier-modal').style.display = 'none';
            document.getElementById('tier-form').reset();
            loadTiers();
        } catch (err) {
            alert(err.message || 'Error creating tier');
        }
    });
    
    // Badge Form
    document.getElementById('badge-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const tierId = document.getElementById('badge-tier-id').value;
        const file = document.getElementById('badge-file').files[0];
        
        const fd = new FormData();
        fd.append('file', file);
        
        try {
            await apiFetch(`/api/studio/memberships/tiers/${tierId}/badge`, {
                method: 'POST',
                body: fd
            });
            document.getElementById('badge-modal').style.display = 'none';
            document.getElementById('badge-form').reset();
            loadTiers();
        } catch (err) {
            alert(err.message || 'Error uploading badge');
        }
    });
    
    // Emoji Form
    document.getElementById('emoji-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const tierId = document.getElementById('emoji-tier-id').value;
        const name = document.getElementById('emoji-name-input').value;
        const file = document.getElementById('emoji-file').files[0];
        
        const fd = new FormData();
        fd.append('file', file);
        
        try {
            await apiFetch(`/api/studio/memberships/tiers/${tierId}/emojis?name=${encodeURIComponent(name)}`, {
                method: 'POST',
                body: fd
            });
            document.getElementById('emoji-modal').style.display = 'none';
            document.getElementById('emoji-form').reset();
            loadTiers();
        } catch (err) {
            alert(err.message || 'Error uploading emoji');
        }
    });
});

async function loadTiers() {
    try {
        const tiers = await apiFetch('/api/studio/memberships/tiers');
        currentTiers = tiers;
        const container = document.getElementById('tiers-list');
        container.innerHTML = '';
        
        if (tiers.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary);">You have no membership tiers. Create one to allow viewers to join your channel.</p>';
            return;
        }
        
        tiers.forEach(tier => {
            const card = document.createElement('div');
            card.className = 'tier-card';
            
            const badgeImg = tier.badge_path ? `<img src="${API_BASE_URL}${tier.badge_path}" class="tier-badge" alt="Badge">` : `<div class="tier-badge" style="display:flex;align-items:center;justify-content:center;"><i data-lucide="shield"></i></div>`;
            
            const emojisHtml = tier.emojis.map(e => `<img src="${API_BASE_URL}${e.image_path}" class="emoji-item" title=":${e.name}:">`).join('');
            
            card.innerHTML = `
                <div style="display: flex; gap: 1rem; align-items: flex-start;">
                    ${badgeImg}
                    <div class="tier-info">
                        <h3>${tier.name} (Level ${tier.level})</h3>
                        <p>${tier.price_phrybucks} PB/month</p>
                        <div class="emoji-list">
                            ${emojisHtml}
                        </div>
                    </div>
                </div>
                <div class="tier-actions">
                    <button class="btn-badge" data-id="${tier.id}" style="background: transparent; border: 1px solid var(--border-color); color: var(--text-primary); padding: 0.25rem 0.5rem; border-radius: 4px; cursor: pointer;">Upload Badge</button>
                    <button class="btn-emoji" data-id="${tier.id}" style="background: transparent; border: 1px solid var(--border-color); color: var(--text-primary); padding: 0.25rem 0.5rem; border-radius: 4px; cursor: pointer;">Add Emoji</button>
                    <button class="btn-delete" data-id="${tier.id}" style="background: rgba(239, 68, 68, 0.2); border: 1px solid #ef4444; color: #ef4444; padding: 0.25rem 0.5rem; border-radius: 4px; cursor: pointer;">Delete</button>
                </div>
            `;
            container.appendChild(card);
        });
        
        if (typeof lucide !== 'undefined') lucide.createIcons();
        
        // Attach events
        document.querySelectorAll('.btn-badge').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.getElementById('badge-tier-id').value = e.target.dataset.id;
                document.getElementById('badge-modal').style.display = 'flex';
            });
        });
        
        document.querySelectorAll('.btn-emoji').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.getElementById('emoji-tier-id').value = e.target.dataset.id;
                document.getElementById('emoji-modal').style.display = 'flex';
            });
        });
        
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if (confirm("Are you sure you want to delete this tier? Active members will lose access.")) {
                    try {
                        await apiFetch(`/api/studio/memberships/tiers/${e.target.dataset.id}`, { method: 'DELETE' });
                        loadTiers();
                    } catch (err) {
                        alert(err.message || 'Error deleting tier');
                    }
                }
            });
        });
        
    } catch (e) {
        console.error(e);
        document.getElementById('tiers-list').innerHTML = '<p style="color: red;">Error loading tiers.</p>';
    }
}
