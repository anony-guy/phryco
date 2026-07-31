import { apiFetch } from '../../api/client.js';

async function loadInvites() {
    const list = document.getElementById('invites-list');
    try {
        const invites = await apiFetch('/api/auth/invites');
        if (invites.length === 0) {
            list.innerHTML = '<p style="color: var(--text-secondary);">You have not generated any invite codes yet.</p>';
            return;
        }

        list.innerHTML = '';
        invites.forEach(inv => {
            const card = document.createElement('div');
            card.style = 'background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); padding: 1rem; border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap;';
            
            let statusText = '';
            let statusColor = '';
            
            if (inv.is_active) {
                statusText = 'ACTIVE';
                statusColor = '#10b981';
            } else if (inv.max_uses !== null && inv.current_uses >= inv.max_uses) {
                statusText = 'DEPLETED';
                statusColor = '#ef4444';
            } else {
                statusText = 'EXPIRED';
                statusColor = '#ef4444';
            }
            
            const usesText = inv.max_uses === null ? `${inv.current_uses} / ∞` : `${inv.current_uses} / ${inv.max_uses}`;
            const expiresText = inv.expires_at ? new Date(inv.expires_at).toLocaleString() : 'Never';

            card.innerHTML = `
                <div style="flex: 1; min-width: 250px;">
                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
                        <h4 style="font-family: monospace; font-size: 1.25rem; letter-spacing: 2px; color: var(--accent-primary); margin: 0;">${inv.code}</h4>
                        <span style="color: ${statusColor}; font-size: 10px; font-weight: bold; border: 1px solid ${statusColor}; padding: 2px 6px; border-radius: 4px;">${statusText}</span>
                    </div>
                    <div style="display: flex; gap: 1.5rem; color: var(--text-secondary); font-size: 0.875rem;">
                        <span><i data-lucide="users" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:4px;"></i> Uses: ${usesText}</span>
                        <span><i data-lucide="clock" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:4px;"></i> Expires: ${expiresText}</span>
                    </div>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    ${inv.is_active ? `<button class="btn-secondary copy-btn" data-code="${inv.code}" style="display: flex; align-items: center; gap: 0.5rem;"><i data-lucide="copy" style="width:16px;height:16px;"></i> Copy</button>` : ''}
                    <button class="revoke-btn" data-code="${inv.code}" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid #ef4444; padding: 0.5rem 1rem; border-radius: var(--radius-md); cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s;">
                        <i data-lucide="trash-2" style="width:16px;height:16px;"></i> Revoke
                    </button>
                </div>
            `;
            list.appendChild(card);
        });

        // Add copy event listeners
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const code = e.currentTarget.getAttribute('data-code');
                navigator.clipboard.writeText(code);
                const originalHtml = e.currentTarget.innerHTML;
                e.currentTarget.innerHTML = `<i data-lucide="check" style="width:16px;height:16px;"></i> Copied`;
                if (typeof lucide !== 'undefined') lucide.createIcons();
                setTimeout(() => {
                    e.currentTarget.innerHTML = originalHtml;
                    if (typeof lucide !== 'undefined') lucide.createIcons();
                }, 2000);
            });
        });

        // Add revoke event listeners
        document.querySelectorAll('.revoke-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if (!confirm("Are you sure you want to delete this invite code? This cannot be undone.")) return;
                
                const code = e.currentTarget.getAttribute('data-code');
                e.currentTarget.disabled = true;
                e.currentTarget.innerHTML = `<i data-lucide="loader" class="spin" style="width:16px;height:16px;"></i>`;
                if (typeof lucide !== 'undefined') lucide.createIcons();

                try {
                    await apiFetch(`/api/auth/invites/${code}`, { method: 'DELETE' });
                    loadInvites();
                } catch (err) {
                    alert("Failed to revoke: " + err.message);
                    e.currentTarget.disabled = false;
                    e.currentTarget.innerHTML = `<i data-lucide="trash-2" style="width:16px;height:16px;"></i> Revoke`;
                    if (typeof lucide !== 'undefined') lucide.createIcons();
                }
            });
            
            // Add hover effect
            btn.addEventListener('mouseover', (e) => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; });
            btn.addEventListener('mouseout', (e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = '#ef4444'; });
        });

        if (typeof lucide !== 'undefined') lucide.createIcons();
    } catch (e) {
        list.innerHTML = `<p style="color: #ef4444;">Failed to load invites: ${e.message}</p>`;
    }
}

document.getElementById('purchase-invite-btn').addEventListener('click', async () => {
    const btn = document.getElementById('purchase-invite-btn');
    const msg = document.getElementById('purchase-msg');
    
    const maxUsesStr = document.getElementById('invite-max-uses').value;
    const expiresStr = document.getElementById('invite-expiration').value;
    
    const payload = {
        max_uses: parseInt(maxUsesStr),
        expires_in_days: expiresStr ? parseInt(expiresStr) : null
    };
    
    if (!confirm("Are you sure you want to spend 500 Phrybucks to generate this invite code?")) {
        return;
    }

    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader" class="spin"></i> Purchasing...`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    msg.style.display = 'none';

    try {
        await apiFetch('/api/auth/invite', { 
            method: 'POST',
            body: payload
        });
        msg.textContent = "Successfully purchased invite code!";
        msg.style.color = "#10b981";
        msg.style.display = "block";
        loadInvites();
    } catch (e) {
        msg.textContent = e.message;
        msg.style.color = "#ef4444";
        msg.style.display = "block";
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="ticket"></i> Purchase (500 PB)`;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    loadInvites();
});
