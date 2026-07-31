import { apiFetch } from '../../api/client.js';
import { API_BASE_URL } from '../../utils/config.js';

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('phryco_token');
    if (!token) {
        window.location.href = '../../../pages/login/index.html';
        return;
    }
    
    loadMemberships();
});

async function loadMemberships() {
    try {
        const memberships = await apiFetch('/api/memberships/my');
        const container = document.getElementById('memberships-list');
        container.innerHTML = '';
        
        if (memberships.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary);">You have no active memberships.</p>';
            return;
        }
        
        memberships.forEach(mem => {
            const card = document.createElement('div');
            card.className = 'membership-card';
            
            const badgeImg = mem.tier_badge_path ? `<img src="${API_BASE_URL}${mem.tier_badge_path}" style="width: 40px; height: 40px; border-radius: 4px; object-fit: cover; background: var(--bg-secondary);">` : `<div style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;background:var(--bg-secondary);border-radius:4px;"><i data-lucide="shield"></i></div>`;
            
            const statusStr = mem.active ? `<span style="color: #10b981;">Active</span> (Renews: ${new Date(mem.next_billing_date).toLocaleDateString()})` : `<span style="color: #ef4444;">Canceled</span> (Ends: ${new Date(mem.next_billing_date).toLocaleDateString()})`;
            
            card.innerHTML = `
                <div style="display: flex; gap: 1rem; align-items: center;">
                    ${badgeImg}
                    <div class="membership-info">
                        <h3>${mem.channel_username} - ${mem.tier_name}</h3>
                        <p>${statusStr}</p>
                    </div>
                </div>
                <div>
                    ${mem.active ? `<button class="btn-cancel" data-id="${mem.tier_id}" style="background: rgba(239, 68, 68, 0.2); border: 1px solid #ef4444; color: #ef4444; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">Cancel Auto-Renewal</button>` : `<button disabled style="background: rgba(255,255,255,0.1); border: 1px solid var(--border-color); color: var(--text-secondary); padding: 0.5rem 1rem; border-radius: 4px;">Canceled</button>`}
                </div>
            `;
            container.appendChild(card);
        });
        
        if (typeof lucide !== 'undefined') lucide.createIcons();
        
        // Attach cancel events
        document.querySelectorAll('.btn-cancel').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if (confirm('Are you sure you want to cancel auto-renewal? You will keep your perks until the end of the billing cycle.')) {
                    btn.disabled = true;
                    btn.textContent = 'Canceling...';
                    try {
                        await apiFetch(`/api/memberships/cancel/${e.target.dataset.id}`, { method: 'POST' });
                        loadMemberships();
                    } catch (err) {
                        alert(err.message || 'Error canceling membership');
                        btn.disabled = false;
                        btn.textContent = 'Cancel Auto-Renewal';
                    }
                }
            });
        });
        
    } catch (e) {
        console.error(e);
        document.getElementById('memberships-list').innerHTML = '<p style="color: red;">Error loading memberships</p>';
    }
}
