import { apiFetch } from '../../api/client.js';
import { escapeHTML } from '../../utils/security.js';
import { InfiniteScroller } from '../../utils/pagination.js';

let scroller;

function renderTransactionRow(tx) {
    const tr = document.createElement('tr');
    
    const date = new Date(tx.created_at).toLocaleString();
    const amountClass = tx.amount > 0 ? 'amount-positive' : 'amount-negative';
    const amountSign = tx.amount > 0 ? '+' : '';
    
    tr.innerHTML = `
        <td>${date}</td>
        <td>${escapeHTML(tx.description)}</td>
        <td class="${amountClass}">${amountSign}${tx.amount.toFixed(2)} PB</td>
    `;
    return tr;
}

async function loadEconomyData() {
    const tbody = document.getElementById('tx-table-body');
    tbody.innerHTML = '';
    
    try {
        // Fetch balance from analytics endpoint
        const analytics = await apiFetch('/api/studio/analytics');
        document.getElementById('wallet-balance').textContent = `${analytics.phrybucks_balance.toFixed(2)} PB`;
        
        scroller = new InfiniteScroller({
            endpoint: '/api/studio/transactions',
            container: tbody,
            emptyHTML: `<tr><td colspan="3" style="text-align: center; color: var(--text-secondary);">No transactions yet.</td></tr>`,
            sentinelTagName: 'tr',
            renderCallback: (items, sentinel) => {
                items.forEach(tx => {
                    const tr = renderTransactionRow(tx);
                    tbody.insertBefore(tr, sentinel);
                });
            }
        });
        
        await scroller.initialize();
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="3" style="color: #ef4444; text-align: center;">Failed to load data: ${error.message}</td></tr>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadEconomyData();
    
    const transferBtn = document.getElementById('open-transfer-btn');
    const transferModal = document.getElementById('transfer-modal');
    const transferForm = document.getElementById('transfer-form');
    const submitBtn = document.getElementById('submit-transfer-btn');
    
    if (transferBtn && transferModal) {
        transferBtn.addEventListener('click', () => {
            transferModal.style.display = 'flex';
        });
    }
    
    if (transferForm) {
        transferForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const recipient = document.getElementById('transfer-recipient').value;
            const amount = parseFloat(document.getElementById('transfer-amount').value);
            
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';
            
            try {
                await apiFetch('/api/studio/transactions/transfer', {
                    method: 'POST',
                    body: {
                        recipient_username: recipient,
                        amount: amount
                    }
                });
                
                alert('Transfer successful!');
                transferModal.style.display = 'none';
                transferForm.reset();
                
                // Reload data
                loadEconomyData();
            } catch (err) {
                alert(err.message || 'Transfer failed');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Send Transfer';
            }
        });
    }
});
