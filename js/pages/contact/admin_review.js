import { apiFetch } from '../../api/client.js';

document.addEventListener('DOMContentLoaded', async () => {
    const slotsDisplay = document.getElementById('admin-slots-display');
    const tableBody = document.getElementById('triage-table-body');
    const filterTabs = document.querySelectorAll('.filter-tab');

    let allOrders = [];
    let currentFilter = 'ALL';

    // Verify Admin / Owner permissions
    try {
        const user = await apiFetch('/api/users/me');
        if (!user || (user.role !== 'ADMIN' && user.role !== 'OWNER')) {
            alert('Access Denied: Exclusive to Phryco Administrators and Owners.');
            window.location.href = '../../pages/contact/index.html';
            return;
        }
    } catch (e) {
        console.error('Authentication error in Admin Commission Review:', e);
        window.location.href = '../../pages/login/index.html';
        return;
    }

    async function loadSlotStatus() {
        try {
            const slotData = await apiFetch('/api/commissions/slots');
            if (slotData && slotsDisplay) {
                const used = slotData.max_slots - slotData.remaining_slots;
                slotsDisplay.textContent = `${used} / ${slotData.max_slots} Active Orders`;
            }
        } catch (e) {
            if (slotsDisplay) slotsDisplay.textContent = 'Quota Load Failed';
            console.error('Error fetching slot status:', e);
        }
    }

    async function loadAllOrders() {
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center; padding: 3rem; color: var(--text-secondary);">
                        <i data-lucide="loader" class="spinner" style="width:24px; height:24px; vertical-align:middle; margin-right:8px;"></i>
                        Fetching custom commission portfolio...
                    </td>
                </tr>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }

        try {
            const data = await apiFetch('/api/commissions/admin/all');
            allOrders = data.orders || [];
            renderTable();
        } catch (e) {
            console.error('Error loading admin commission list:', e);
            if (tableBody) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="7" style="text-align:center; padding: 3rem; color: #ef4444;">
                            ❌ Error loading applications: ${e.message || 'Server connection failed.'}
                        </td>
                    </tr>
                `;
            }
        }
    }

    function renderTable() {
        if (!tableBody) return;
        const filtered = allOrders.filter(o => {
            if (currentFilter === 'ALL') return true;
            if (currentFilter === 'REJECTED') {
                return o.status === 'REJECTED' || o.status === 'CANCELLED';
            }
            return o.status.toUpperCase() === currentFilter;
        });

        if (filtered.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center; padding: 3rem; color: var(--text-secondary);">
                        No commission orders match filter status: <strong>${currentFilter}</strong>
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = filtered.map(o => {
            const colors = getStatusBadgeColor(o.status);
            const quoteText = o.price_quote ? `<span style="color:#10b981; font-weight:700;">${o.price_quote}</span>` : `<span style="color:#64748b;">Pending Valuation</span>`;
            const lockIndicator = o.is_locked ? `<span style="color:#fca5a5; font-size:0.8rem; margin-left:6px;" title="Thread Locked">🔒</span>` : '';
            const dateStr = formatDate(o.created_at);

            let actionBtns = `
                <a href="../../pages/contact/thread.html?id=${o.id}" class="btn-mini btn-open" title="Open Discussion & Quote Thread">
                    <i data-lucide="message-square-more" style="width:14px;height:14px;"></i> Open Thread
                </a>
            `;

            if (o.status === 'PENDING') {
                actionBtns = `
                    <button class="btn-mini btn-accept quick-triage-btn" data-id="${o.id}" data-action="ACCEPTED">
                        <i data-lucide="check" style="width:14px;height:14px;"></i> Accept
                    </button>
                    <button class="btn-mini btn-reject quick-triage-btn" data-id="${o.id}" data-action="REJECTED">
                        <i data-lucide="x" style="width:14px;height:14px;"></i> Reject
                    </button>
                ` + actionBtns;
            }

            return `
            <tr>
                <td style="white-space:nowrap;">
                    <strong style="color:white;">#${o.id}</strong><br>
                    <span style="font-size:0.8rem; color:#64748b;">${dateStr}</span>
                </td>
                <td>
                    <span style="color:var(--neon-pink); font-weight:600;">@${o.creator_username || 'creator'}</span><br>
                    <span style="font-size:0.8rem; color:#64748b;">Supporter ID: ${o.user_id}</span>
                </td>
                <td style="color:var(--neon-cyan); font-weight:600;">${o.service_type}</td>
                <td style="max-width:250px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:white;" title="${o.title}">${o.title}</td>
                <td>${quoteText} ${lockIndicator}</td>
                <td><span class="badge-status" style="background:${colors.bg}; color:${colors.fg};">${o.status}</span></td>
                <td style="text-align:right;">
                    <div class="action-btns" style="justify-content: flex-end;">${actionBtns}</div>
                </td>
            </tr>
            `;
        }).join('');

        if (typeof lucide !== 'undefined') lucide.createIcons();
        bindTriageButtons();
    }

    function bindTriageButtons() {
        document.querySelectorAll('.quick-triage-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = btn.getAttribute('data-id');
                const action = btn.getAttribute('data-action');
                if (!id || !action) return;

                btn.disabled = true;
                const origText = btn.innerHTML;
                btn.innerHTML = '...';

                try {
                    const payload = {
                        status: action,
                        system_note: action === 'ACCEPTED' ? 'Application reviewed and accepted for designer valuation.' : 'Application declined by design leader.'
                    };
                    if (action === 'REJECTED') {
                        payload.is_locked = true;
                    }

                    await apiFetch(`/api/commissions/${id}/status`, {
                        method: 'PATCH',
                        body: JSON.stringify(payload)
                    });
                    
                    await loadAllOrders();
                    await loadSlotStatus();
                } catch (err) {
                    console.error('Error executing quick triage action:', err);
                    alert('Failed to update status: ' + (err.message || 'Unknown error'));
                    btn.disabled = false;
                    btn.innerHTML = origText;
                }
            });
        });
    }

    function getStatusBadgeColor(status) {
        const s = status.toUpperCase();
        if (s.includes('PAID') || s === 'COMPLETED' || s === 'ACCEPTED') return { bg: 'rgba(16, 185, 129, 0.2)', fg: '#10b981' };
        if (s === 'IN_PROGRESS') return { bg: 'rgba(59, 130, 246, 0.2)', fg: '#3b82f6' };
        if (s === 'REJECTED' || s === 'CANCELLED') return { bg: 'rgba(239, 68, 68, 0.2)', fg: '#ef4444' };
        if (s.includes('LOCKED')) return { bg: 'rgba(245, 158, 11, 0.2)', fg: '#f59e0b' };
        return { bg: 'rgba(148, 163, 184, 0.2)', fg: '#cbd5e1' };
    }

    function formatDate(isoString) {
        if (!isoString) return 'N/A';
        try {
            const date = new Date(isoString);
            return date.toLocaleDateString();
        } catch (e) {
            return isoString;
        }
    }

    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = tab.getAttribute('data-filter') || 'ALL';
            renderTable();
        });
    });

    await Promise.all([loadSlotStatus(), loadAllOrders()]);
});
