document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/pages/login/index.html';
        return;
    }

    async function loadCashouts() {
        const tbody = document.getElementById('cashout-history-rows');
        try {
            const res = await fetch('/api/wallet/cashout/history', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error('Failed to load cashout history');

            if (!data || data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No cashout requests submitted yet.</td></tr>';
                return;
            }

            tbody.innerHTML = data.map(r => `
                <tr>
                    <td>#${r.id}</td>
                    <td><span style="text-transform: capitalize;">${r.tier}</span></td>
                    <td class="tx-negative">-${r.amount_pb.toFixed(2)} PB</td>
                    <td>${r.fee_pb.toFixed(2)} PB</td>
                    <td>${r.net_egp.toFixed(2)} EGP</td>
                    <td>
                        <span style="padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; text-transform: uppercase; background: ${r.status === 'paid' ? 'rgba(0,211,149,0.2)' : r.status === 'rejected' ? 'rgba(255,82,82,0.2)' : 'rgba(255,183,77,0.2)'}; color: ${r.status === 'paid' ? '#00d395' : r.status === 'rejected' ? '#ff5252' : '#ffb74d'};">
                            ${r.status}
                        </span>
                    </td>
                    <td>${new Date(r.created_at).toLocaleDateString()}</td>
                </tr>
            `).join('');
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="7" style="color: var(--danger-color);">${err.message}</td></tr>`;
        }
    }

    async function loadTransactions() {
        const tbody = document.getElementById('tx-ledger-rows');
        try {
            const res = await fetch('/api/wallet/transactions', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error('Failed to load transaction ledger');

            if (!data || data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No transaction activity logged.</td></tr>';
                return;
            }

            tbody.innerHTML = data.map(t => {
                const isPos = t.amount >= 0;
                return `
                    <tr>
                        <td>#${t.id}</td>
                        <td><code>${t.tx_type || 'internal'}</code></td>
                        <td>${t.description}</td>
                        <td class="${isPos ? 'tx-positive' : 'tx-negative'}">
                            ${isPos ? '+' : ''}${t.amount.toFixed(2)} PB
                        </td>
                        <td>${new Date(t.created_at).toLocaleString()}</td>
                    </tr>
                `;
            }).join('');
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="5" style="color: var(--danger-color);">${err.message}</td></tr>`;
        }
    }

    loadCashouts();
    loadTransactions();
});
