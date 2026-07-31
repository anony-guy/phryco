import { apiFetch } from '../api/client.js';
import { API_BASE_URL } from '../utils/config.js';
import { escapeHTML } from '../utils/security.js';
import { InfiniteScroller } from '../utils/pagination.js';

let queueScroller, allVideosScroller, usersScroller;
let currentActionUserId = null;
let currentActionType = null;

window.updateVideoFlag = async function(videoId, flagName, value) {
    try {
        const payload = {};
        payload[flagName] = value;
        await apiFetch(`/api/admin/videos/${videoId}/flags`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        // Success
    } catch (e) {
        console.error(e);
        alert('Error updating flag');
    }
};

function renderQueueRow(v) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><strong>${escapeHTML(v.title)}</strong></td>
        <td>${escapeHTML(v.owner_username)}</td>
        <td>-</td>
        <td>
            <label style="font-size: 0.8rem; display: block; margin-bottom: 2px;">
                <input type="checkbox" ${v.contains_music ? 'checked' : ''} onchange="updateVideoFlag(${v.id}, 'contains_music', this.checked)"> Music
            </label>
            <label style="font-size: 0.8rem; display: block; margin-bottom: 2px;">
                <input type="checkbox" ${v.sharia_non_compliant ? 'checked' : ''} onchange="updateVideoFlag(${v.id}, 'sharia_non_compliant', this.checked)"> Sharia NC
            </label>
            <label style="font-size: 0.8rem; display: block;">
                <input type="checkbox" ${v.taswir ? 'checked' : ''} onchange="updateVideoFlag(${v.id}, 'taswir', this.checked)"> Taswir
            </label>
        </td>
        <td class="btn-group">
            <button class="btn-secondary" style="padding: 0.25rem 0.75rem; font-size: 0.875rem;" onclick="window.open('../../pages/watch/index.html?v=${v.id}', '_blank')">Pre-Watch</button>
            <button class="btn-primary" style="background: var(--accent-primary); border-color: var(--accent-primary); padding: 0.25rem 0.75rem; font-size: 0.875rem;" onclick="handleAction(${v.id}, 'approve')">Approve</button>
            <button class="btn-primary" style="background: transparent; color: #ef4444; border-color: #ef4444; padding: 0.25rem 0.75rem; font-size: 0.875rem;" onclick="handleAction(${v.id}, 'remove')">Remove</button>
        </td>
    `;
    return tr;
}

async function loadQueue() {
    const tbody = document.getElementById('queue-table-body');
    const errorMsg = document.getElementById('error-msg');
    tbody.innerHTML = '';
    
    queueScroller = new InfiniteScroller({
        endpoint: '/api/admin/queue',
        container: tbody,
        emptyHTML: `<tr><td colspan="4" style="text-align: center; color: var(--text-secondary);">No pending videos in the queue.</td></tr>`,
        sentinelTagName: 'tr',
        renderCallback: (items, sentinel) => {
            items.forEach(v => {
                const tr = renderQueueRow(v);
                tbody.insertBefore(tr, sentinel);
            });
        }
    });
    
    try {
        await queueScroller.initialize();
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="4"></td></tr>`;
        errorMsg.textContent = "Access Denied: Only Admins can view this page.";
    }
}

function renderAllVideoRow(v) {
    const tr = document.createElement('tr');
    
    let statusHtml = '';
    if (v.status === 'PUBLIC') statusHtml = `<span class="status-badge status-admin">PUBLIC</span>`;
    else if (v.status === 'PRIVATE') statusHtml = `<span class="status-badge status-scheduled">PRIVATE</span>`;
    else if (v.status === 'PENDING_REVIEW') statusHtml = `<span class="status-badge status-suspended">PENDING</span>`;
    else statusHtml = `<span class="status-badge status-user">${v.status}</span>`;
    
    tr.innerHTML = `
        <td><strong>${escapeHTML(v.title)}</strong></td>
        <td>${escapeHTML(v.owner_username)}</td>
        <td>${statusHtml}</td>
        <td>
            <label style="font-size: 0.8rem; display: block; margin-bottom: 2px;">
                <input type="checkbox" ${v.contains_music ? 'checked' : ''} onchange="updateVideoFlag(${v.id}, 'contains_music', this.checked)"> Music
            </label>
            <label style="font-size: 0.8rem; display: block; margin-bottom: 2px;">
                <input type="checkbox" ${v.sharia_non_compliant ? 'checked' : ''} onchange="updateVideoFlag(${v.id}, 'sharia_non_compliant', this.checked)"> Sharia NC
            </label>
            <label style="font-size: 0.8rem; display: block;">
                <input type="checkbox" ${v.taswir ? 'checked' : ''} onchange="updateVideoFlag(${v.id}, 'taswir', this.checked)"> Taswir
            </label>
        </td>
        <td class="btn-group">
            <button class="btn-secondary" style="padding: 0.25rem 0.75rem; font-size: 0.875rem;" onclick="window.open('../../pages/watch/index.html?v=${v.id}', '_blank')">Watch</button>
            ${v.status === 'PENDING_REVIEW' ? `<button class="btn-primary" style="background: var(--accent-primary); border-color: var(--accent-primary); padding: 0.25rem 0.75rem; font-size: 0.875rem;" onclick="handleAction(${v.id}, 'approve')">Approve</button>` : ''}
            <button class="btn-primary" style="background: transparent; color: #ef4444; border-color: #ef4444; padding: 0.25rem 0.75rem; font-size: 0.875rem;" onclick="handleAction(${v.id}, 'remove')">Remove</button>
        </td>
    `;
    return tr;
}

async function loadAllVideos() {
    const tbody = document.getElementById('all-videos-table-body');
    tbody.innerHTML = '';
    
    allVideosScroller = new InfiniteScroller({
        endpoint: '/api/admin/videos/all',
        container: tbody,
        emptyHTML: `<tr><td colspan="4" style="text-align: center; color: var(--text-secondary);">No videos found on the platform.</td></tr>`,
        sentinelTagName: 'tr',
        renderCallback: (items, sentinel) => {
            items.forEach(v => {
                const tr = renderAllVideoRow(v);
                tbody.insertBefore(tr, sentinel);
            });
        }
    });
    
    try {
        await allVideosScroller.initialize();
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #ef4444;">Failed to load videos.</td></tr>`;
    }
}

function renderUserRow(u) {
    const tr = document.createElement('tr');
    
    // Generate Status Badges
    let statusHtml = '';
    if (u.is_banned && u.scheduled_deletion_date) statusHtml += `<span class="status-badge status-scheduled">Scheduled Deletion</span> `;
    else if (u.is_banned) statusHtml += `<span class="status-badge status-banned">Banned</span> `;
    
    if (u.is_suspended) statusHtml += `<span class="status-badge status-suspended">Suspended${u.suspension_end ? ' (Temp)' : ''}</span> `;
    if (!statusHtml) statusHtml = `<span class="status-badge status-user">Active</span>`;
    
    let roleHtml = u.role === 'ADMIN' || u.role === 'OWNER' 
        ? `<span class="status-badge status-admin">${u.role}</span>` 
        : `<span class="status-badge status-user">USER</span>`;
        
    const escapedUsername = escapeHTML(u.username).replace(/'/g, "\\'");
    tr.innerHTML = `
        <td><strong>${escapeHTML(u.username)}</strong></td>
        <td>${roleHtml}</td>
        <td>${statusHtml}</td>
        <td class="btn-group" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <button class="btn-primary" style="background: transparent; border-color: var(--border-color); color: var(--text-primary); padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="openModal(${u.id}, 'notify', '${escapedUsername}')">Notify</button>
            <button class="btn-primary" style="background: transparent; border-color: var(--border-color); color: var(--text-primary); padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="openModal(${u.id}, 'role', '${escapedUsername}')">Role</button>
            <button class="btn-primary" style="background: transparent; border-color: #eab308; color: #eab308; padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="openModal(${u.id}, 'suspend', '${escapedUsername}')">Suspend</button>
            <button class="btn-primary" style="background: transparent; border-color: #ef4444; color: #ef4444; padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="openModal(${u.id}, 'ban', '${escapedUsername}')">Ban</button>
            <button class="btn-primary" style="background: rgba(239, 68, 68, 0.2); border-color: #ef4444; color: #ef4444; padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="openModal(${u.id}, 'delete', '${escapedUsername}')">Delete</button>
            <button class="btn-primary" style="background: transparent; border-color: var(--border-color); color: var(--text-secondary); padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="liftRestrictions(${u.id})">Lift Restrictions</button>
        </td>
    `;
    return tr;
}

async function loadUsers() {
    const tbody = document.getElementById('users-table-body');
    tbody.innerHTML = '';
    
    usersScroller = new InfiniteScroller({
        endpoint: '/api/admin/users',
        container: tbody,
        emptyHTML: `<tr><td colspan="4" style="text-align: center; color: var(--text-secondary);">No users found.</td></tr>`,
        sentinelTagName: 'tr',
        renderCallback: (items, sentinel) => {
            items.forEach(u => {
                const tr = renderUserRow(u);
                tbody.insertBefore(tr, sentinel);
            });
        }
    });
    
    try {
        await usersScroller.initialize();
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #ef4444;">Failed to load users.</td></tr>`;
    }
}

// Queue Actions
window.handleAction = async function(videoId, action) {
    if(!confirm(`Are you sure you want to ${action} this video?`)) return;
    try {
        await apiFetch(`/api/admin/videos/${videoId}/${action}`, { method: 'POST' });
        loadQueue();
    } catch (error) {
        alert("Action failed: " + error.message);
    }
};

// User Actions
window.liftRestrictions = async function(userId) {
    if(!confirm("Are you sure you want to lift all bans and suspensions for this user?")) return;
    try {
        await apiFetch(`/api/admin/users/${userId}/lift_restrictions`, { method: 'POST' });
        loadUsers();
    } catch(e) {
        alert(e.message);
    }
};

// Modals
const modalOverlay = document.getElementById('action-modal');
const modalTitle = document.getElementById('modal-title');
const modalDesc = document.getElementById('modal-desc');
const modalInputContainer = document.getElementById('modal-input-container');
const btnCancel = document.getElementById('modal-cancel');
const btnConfirm = document.getElementById('modal-confirm');

window.openModal = function(userId, type, username) {
    currentActionUserId = userId;
    currentActionType = type;
    modalInputContainer.innerHTML = '';
    
    if (type === 'notify') {
        modalTitle.textContent = `Send Notification to ${username}`;
        modalDesc.textContent = "This message will appear in their notifications panel.";
        modalInputContainer.innerHTML = `<textarea id="modal-input-val" style="width:100%; height:80px; background:var(--bg-secondary); color:var(--text-primary); border:1px solid var(--border-color); border-radius:var(--radius-sm); padding:0.5rem;" placeholder="Enter message..."></textarea>`;
    } else if (type === 'suspend') {
        modalTitle.textContent = `Suspend Channel: ${username}`;
        modalDesc.textContent = "Enter duration in days, or leave blank for permanent suspension.";
        modalInputContainer.innerHTML = `<input type="number" id="modal-input-val" style="width:100%; background:var(--bg-secondary); color:var(--text-primary); border:1px solid var(--border-color); border-radius:var(--radius-sm); padding:0.5rem;" placeholder="e.g. 7" min="1">`;
    } else if (type === 'ban') {
        modalTitle.textContent = `Ban User: ${username}`;
        modalDesc.textContent = "This will permanently ban the user and block them from logging in. They will not be deleted yet.";
    } else if (type === 'delete') {
        modalTitle.textContent = `Ban & Schedule Delete: ${username}`;
        modalDesc.textContent = "This will ban the user immediately and schedule their account and all videos for permanent deletion in 24 hours.";
    } else if (type === 'role') {
        modalTitle.textContent = `Change Role: ${username}`;
        modalDesc.textContent = "Select the new role for this user.";
        modalInputContainer.innerHTML = `
            <select id="modal-input-val" style="width:100%; background:var(--bg-secondary); color:var(--text-primary); border:1px solid var(--border-color); border-radius:var(--radius-sm); padding:0.5rem;">
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
            </select>
        `;
    }
    
    modalOverlay.style.display = 'flex';
};

function closeModal() {
    modalOverlay.style.display = 'none';
    currentActionUserId = null;
    currentActionType = null;
}

btnCancel.addEventListener('click', closeModal);

btnConfirm.addEventListener('click', async () => {
    if (!currentActionUserId) return;
    
    let inputVal = document.getElementById('modal-input-val')?.value;
    try {
        if (currentActionType === 'notify') {
            if(!inputVal) throw new Error("Message cannot be empty.");
            await apiFetch(`/api/admin/users/${currentActionUserId}/notify`, { method: 'POST', body: { message: inputVal } });
        } else if (currentActionType === 'suspend') {
            let duration = inputVal ? parseInt(inputVal) : null;
            await apiFetch(`/api/admin/users/${currentActionUserId}/suspend`, { method: 'POST', body: { duration_days: duration } });
        } else if (currentActionType === 'ban') {
            await apiFetch(`/api/admin/users/${currentActionUserId}/ban`, { method: 'POST' });
        } else if (currentActionType === 'delete') {
            await apiFetch(`/api/admin/users/${currentActionUserId}/schedule_delete`, { method: 'POST' });
        } else if (currentActionType === 'role') {
            await apiFetch(`/api/admin/users/${currentActionUserId}/role`, { method: 'POST', body: { role: inputVal } });
        }
        
        closeModal();
        loadUsers();
    } catch (e) {
        alert("Failed: " + e.message);
    }
});

// Tab Switching logic
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        const target = btn.getAttribute('data-target');
        document.getElementById(target).classList.add('active');
        
        if (target === 'users') loadUsers();
        if (target === 'approvals') loadQueue();
        if (target === 'videos') loadAllVideos();
        if (target === 'emojis') loadGlobalEmojis();
        if (target === 'frames') loadAdminFrames();
    });
});

async function loadGlobalEmojis() {
    try {
        const emojis = await apiFetch('/api/emojis/global');
        const container = document.getElementById('global-emoji-list');
        container.innerHTML = '';
        if (emojis.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary);">No global emojis uploaded yet.</p>';
            return;
        }
        emojis.forEach(e => {
            container.innerHTML += `
                <div style="background: rgba(0,0,0,0.2); padding: 1rem; border-radius: var(--radius-md); text-align: center; border: 1px solid var(--border-color);">
                    <img src="${API_BASE_URL}${e.image_url}" style="width: 48px; height: 48px; object-fit: contain; margin-bottom: 0.5rem;">
                    <div style="font-size: 0.875rem; color: var(--text-secondary);">:${e.name}:</div>
                </div>
            `;
        });
    } catch (e) {
        document.getElementById('global-emoji-list').innerHTML = '<p style="color: #ef4444;">Failed to load emojis.</p>';
    }
}

document.getElementById('global-emoji-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    const msg = document.getElementById('global-emoji-msg');
    btn.disabled = true;
    
    try {
        const formData = new FormData();
        formData.append('name', document.getElementById('global-emoji-name').value);
        formData.append('file', document.getElementById('global-emoji-file').files[0]);
        
        await apiFetch('/api/emojis/admin/global/emoji', {
            method: 'POST',
            body: formData
        });
        
        msg.textContent = 'Uploaded successfully!';
        msg.style.color = '#10b981';
        e.target.reset();
        loadGlobalEmojis();
    } catch (err) {
        msg.textContent = err.message;
        msg.style.color = '#ef4444';
    } finally {
        btn.disabled = false;
    }
});

window.openFrameModal = function(id, name, currentStandardPrice, currentTempPrice) {
    document.getElementById('frame-modal-title').textContent = `Configure Pricing: ${name}`;
    document.getElementById('frame-modal-id').value = id;
    document.getElementById('frame-standard-price').value = currentStandardPrice || '';
    document.getElementById('frame-temp-price').value = currentTempPrice || '';
    document.getElementById('frame-temp-duration').value = '';
    document.getElementById('frame-modal-error').style.display = 'none';
    document.getElementById('frame-modal').style.display = 'flex';
};

async function loadAdminFrames() {
    const tbody = document.getElementById('frames-table-body');
    if (!tbody) return;
    try {
        const frames = await apiFetch('/api/admin/frames');
        if (frames.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">No frames found.</td></tr>';
            return;
        }
        tbody.innerHTML = frames.map(f => {
            const hasPromo = f.temp_price_phrybucks !== null && f.temp_price_phrybucks !== undefined;
            let promoDisplay = '<span style="color: #666;">None</span>';
            let expiryDisplay = '<span class="status-badge status-user">Standard Pricing</span>';
            
            if (hasPromo && f.temp_price_expires_at) {
                const isDiscount = f.price_phrybucks !== null && f.temp_price_phrybucks < f.price_phrybucks;
                const isHike = f.price_phrybucks !== null && f.temp_price_phrybucks > f.price_phrybucks;
                const badgeColor = isDiscount ? 'var(--accent-secondary, #10b981)' : (isHike ? '#f97316' : '#60a5fa');
                const badgeText = isDiscount ? 'SALE (Discount)' : (isHike ? 'SURGE (Price Raise)' : 'Active Override');
                promoDisplay = `<strong style="color: ${badgeColor};">${f.temp_price_phrybucks} PB</strong>`;
                
                const expiresDate = new Date(f.temp_price_expires_at);
                expiryDisplay = `<span class="status-badge" style="background: rgba(255,255,255,0.1); color: ${badgeColor}; border: 1px solid ${badgeColor};">${badgeText} until ${expiresDate.toLocaleDateString()}</span>`;
            }
            
            return `
                <tr>
                    <td style="display: flex; align-items: center; gap: 1rem;">
                        <img src="../..${f.image_path}" style="width: 48px; height: 36px; object-fit: contain; background: #111; border-radius: 4px; border: 1px solid #333;" alt="${escapeHTML(f.name)}">
                        <div>
                            <strong>${escapeHTML(f.name)}</strong><br>
                            <small style="color: var(--text-secondary);">${escapeHTML(f.description || '')}</small>
                        </div>
                    </td>
                    <td>${f.price_phrybucks !== null ? `<strong>${f.price_phrybucks} PB</strong>` : '<em style="color: #ef4444;">Not Set (Unavailable)</em>'}</td>
                    <td>${promoDisplay}</td>
                    <td>${expiryDisplay}</td>
                    <td>
                        <button class="btn-secondary" style="padding: 0.25rem 0.75rem; font-size: 0.875rem;" onclick="window.openFrameModal(${f.id}, '${escapeHTML(f.name)}', ${f.price_phrybucks || 'null'}, ${f.temp_price_phrybucks || 'null'})">Configure Price</button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #ef4444;">Failed to load frames.</td></tr>';
    }
}

document.getElementById('frame-price-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = parseInt(document.getElementById('frame-modal-id').value, 10);
    const standardPriceVal = document.getElementById('frame-standard-price').value;
    const tempPriceVal = document.getElementById('frame-temp-price').value;
    const durationVal = document.getElementById('frame-temp-duration').value;
    const errEl = document.getElementById('frame-modal-error');
    errEl.style.display = 'none';

    const payload = {};
    if (standardPriceVal !== '') payload.price_phrybucks = parseFloat(standardPriceVal);
    if (tempPriceVal !== '') {
        payload.temp_price_phrybucks = parseFloat(tempPriceVal);
        payload.duration_days = parseInt(durationVal || '0', 10);
        if (payload.duration_days <= 0 || payload.duration_days > 30) {
            errEl.textContent = "Duration must be between 1 and 30 days when setting an override price.";
            errEl.style.display = 'block';
            return;
        }
    }

    try {
        await apiFetch(`/api/admin/frames/${id}/price`, {
            method: 'PUT',
            body: payload
        });
        document.getElementById('frame-modal').style.display = 'none';
        loadAdminFrames();
    } catch (err) {
        errEl.textContent = err.message || "Failed to save frame price";
        errEl.style.display = 'block';
    }
});

document.getElementById('clear-promo-btn')?.addEventListener('click', async () => {
    const id = parseInt(document.getElementById('frame-modal-id').value, 10);
    if (!id || !confirm("Are you sure you want to clear the active limited-time price override for this frame?")) return;
    const errEl = document.getElementById('frame-modal-error');
    errEl.style.display = 'none';

    try {
        await apiFetch(`/api/admin/frames/${id}/price`, {
            method: 'PUT',
            body: { clear_temp_price: true }
        });
        document.getElementById('frame-modal').style.display = 'none';
        loadAdminFrames();
    } catch (err) {
        errEl.textContent = err.message || "Failed to clear override";
        errEl.style.display = 'block';
    }
});

document.addEventListener('DOMContentLoaded', () => {
    loadQueue();
});
