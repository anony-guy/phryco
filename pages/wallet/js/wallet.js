document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('phryco_token') || localStorage.getItem('token');
    if (!token) {
        window.location.href = '/pages/login/index.html';
        return;
    }

    function getApiBaseUrl() {
        if (window.PHRYCO_API_URL) return window.PHRYCO_API_URL;
        const host = window.location.hostname;
        if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host.startsWith('192.168.') || host.startsWith('10.')) {
            return `${window.location.protocol}//${host}:8000`;
        }
        if (window.location.origin.includes('vercel.app') || window.location.origin.includes('github.io')) {
            return 'https://outer-bufing-draws-experts.trycloudflare.com';
        }
        return window.location.origin;
    }

    const apiBase = getApiBaseUrl();

    let bundleCatalog = [];
    let liveRate = 49.63;
    let selectedQuantities = { 500: 0, 1500: 0, 2500: 0, 5000: 0 };

    // Fetch Wallet Balance & System Info
    async function loadBalance() {
        try {
            const res = await fetch(`${apiBase}/api/wallet/balance`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) {
                if (res.status === 401) {
                    localStorage.removeItem('phryco_token');
                    localStorage.removeItem('token');
                    window.location.href = '/pages/login/index.html';
                    return;
                }
                throw new Error('Failed to load balance');
            }
            const data = await res.json();
            
            document.getElementById('pb-balance').textContent = data.phrybucks_balance.toLocaleString('en-US', { minimumFractionDigits: 2 });
            document.getElementById('usd-val').textContent = `$${data.usd_equivalent.toFixed(2)}`;
            document.getElementById('egp-val').textContent = `≈ ${data.egp_equivalent.toFixed(2)} EGP`;
            document.getElementById('live-rate').textContent = `1080 PB = $1 USD · 1 PB ≈ ${(data.usd_egp_rate / 1080).toFixed(4)} EGP`;
            
            liveRate = data.usd_egp_rate;
            loadEligibility();
        } catch (err) {
            console.error('Balance load error:', err);
        }
    }

    // Fetch Public Bundle Rates & Prices
    async function loadRates() {
        try {
            const res = await fetch(`${apiBase}/api/wallet/rate`);
            const data = await res.json();
            bundleCatalog = data.bundles || [];
            liveRate = data.rate;
            renderBundleModal();
        } catch (err) {
            console.error('Rates load error:', err);
        }
    }

    function renderBundleModal() {
        const rowsContainer = document.getElementById('bundle-rows');
        if (!rowsContainer) return;
        
        rowsContainer.innerHTML = '';
        const items = [
            { pb: 500, price: (500 / 1080 * liveRate).toFixed(2) },
            { pb: 1500, price: (1500 / 1080 * liveRate).toFixed(2) },
            { pb: 2500, price: (2500 / 1080 * liveRate).toFixed(2) },
            { pb: 5000, price: (5000 / 1080 * liveRate).toFixed(2) }
        ];

        items.forEach(item => {
            const row = document.createElement('div');
            row.className = 'bundle-row';
            row.innerHTML = `
                <div class="bundle-item">${item.pb} PB</div>
                <div class="bundle-price">${item.price} EGP</div>
                <div class="quantity-control">
                    <button class="qty-btn" onclick="updateQty(${item.pb}, -1)">−</button>
                    <span class="qty-val" id="qty-${item.pb}">0</span>
                    <button class="qty-btn" onclick="updateQty(${item.pb}, 1)">+</button>
                </div>
            `;
            rowsContainer.appendChild(row);
        });
    }

    window.updateQty = function(pb, delta) {
        if (!selectedQuantities[pb]) selectedQuantities[pb] = 0;
        selectedQuantities[pb] = Math.max(0, selectedQuantities[pb] + delta);
        const qtyEl = document.getElementById(`qty-${pb}`);
        if (qtyEl) qtyEl.textContent = selectedQuantities[pb];
    };

    // Buy Now via Kashier
    const buyNowBtn = document.getElementById('buy-now-btn');
    if (buyNowBtn) {
        buyNowBtn.addEventListener('click', async () => {
            let totalPb = 0;
            for (const [pb, qty] of Object.entries(selectedQuantities)) {
                totalPb += parseInt(pb) * qty;
            }

            if (totalPb <= 0) {
                alert('Please select at least 1 bundle quantity before checking out.');
                return;
            }

            try {
                buyNowBtn.disabled = true;
                buyNowBtn.textContent = 'Redirecting to Kashier...';
                
                const res = await fetch(`${apiBase}/api/wallet/topup/session`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ custom_pb: totalPb })
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.detail || 'Failed to create Kashier session');

                if (data.sessionUrl) {
                    window.location.href = data.sessionUrl;
                } else {
                    alert('Session URL created but redirect failed.');
                }
            } catch (err) {
                alert(err.message);
                buyNowBtn.disabled = false;
                buyNowBtn.textContent = 'Buy Now';
            }
        });
    }

    // Cashout Eligibility & Submission
    async function loadEligibility() {
        try {
            const res = await fetch('/api/wallet/cashout/eligibility', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            const panel = document.getElementById('cashout-section');
            if (!panel) return;

            if (data.pool.suspended) {
                panel.innerHTML = `
                    <div style="background: rgba(255, 183, 77, 0.1); border: 1px solid var(--warning-color); padding: 1rem; border-radius: 8px; color: var(--warning-color);">
                        ⚠️ Cashouts are temporarily paused for reserve pool replenishment.
                    </div>
                `;
                return;
            }

            if (data.tier1.eligible || data.tier2.eligible) {
                const tierName = data.tier1.eligible ? 'Tier 1 Creator' : 'Tier 2 General';
                panel.innerHTML = `
                    <div style="background: rgba(0, 211, 149, 0.1); border: 1px solid var(--accent-emerald); padding: 0.85rem; border-radius: 8px; margin-bottom: 1rem;">
                        ✅ Eligible for ${tierName} Cashout
                    </div>
                    <form id="cashout-form">
                        <div class="form-group">
                            <label>Amount (Phrybucks)</label>
                            <input type="number" id="co-amount" min="1080" step="108" required placeholder="e.g. 10800">
                            <small style="color: var(--text-muted); display: block; margin-top: 0.25rem;" id="co-preview">8% fee applied · You receive ~$0.00 / ~0 EGP</small>
                        </div>
                        <div class="form-group">
                            <label>Bank Name</label>
                            <input type="text" id="co-bank" placeholder="e.g. CIB / Banque Misr" required>
                        </div>
                        <div class="form-group">
                            <label>Account Holder Name</label>
                            <input type="text" id="co-holder" placeholder="Full legal name" required>
                        </div>
                        <div class="form-group">
                            <label>IBAN (Egypt: EG + 27 digits)</label>
                            <input type="text" id="co-iban" placeholder="EG000000000000000000000000000" required>
                        </div>
                        <button type="submit" class="btn-primary" style="width: 100%;">Submit Cashout Request</button>
                    </form>
                `;

                const coInput = document.getElementById('co-amount');
                const coPreview = document.getElementById('co-preview');
                if (coInput && coPreview) {
                    coInput.addEventListener('input', () => {
                        const val = parseFloat(coInput.value) || 0;
                        const fee = Math.max(1080, val * 0.08);
                        const netPb = Math.max(0, val - fee);
                        const netUsd = netPb / 1080;
                        const netEgp = netUsd * liveRate;
                        coPreview.textContent = `8% fee (${fee.toFixed(0)} PB) · You receive ~$${netUsd.toFixed(2)} USD / ~${netEgp.toFixed(2)} EGP`;
                    });
                }

                document.getElementById('cashout-form').addEventListener('submit', async (e) => {
                    e.preventDefault();
                    try {
                        const res = await fetch('/api/wallet/cashout/request', {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                amount_pb: parseFloat(document.getElementById('co-amount').value),
                                bank_name: document.getElementById('co-bank').value,
                                holder_name: document.getElementById('co-holder').value,
                                iban: document.getElementById('co-iban').value
                            })
                        });
                        const resData = await res.json();
                        if (!res.ok) throw new Error(resData.detail || 'Cashout failed');

                        alert(`Cashout Request #${resData.cashout_id} submitted successfully! Net: ${resData.net_egp} EGP.`);
                        loadBalance();
                    } catch (err) {
                        alert(err.message);
                    }
                });
            } else {
                panel.innerHTML = `
                    <div style="color: var(--text-secondary); margin-bottom: 1rem;">
                        <strong>Cashout Eligibility Status:</strong> Not yet eligible.
                    </div>
                    <div class="progress-bar-box">
                        <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                            <span>Subscribers (${data.user_metrics.subscribers}/500)</span>
                            <span>${Math.min(100, (data.user_metrics.subscribers / 500 * 100)).toFixed(0)}%</span>
                        </div>
                        <div class="progress-track">
                            <div class="progress-fill" style="width: ${Math.min(100, (data.user_metrics.subscribers / 500 * 100))}%"></div>
                        </div>
                    </div>
                    <div class="progress-bar-box">
                        <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                            <span>Channel Views (${data.user_metrics.channel_views}/10,000)</span>
                            <span>${Math.min(100, (data.user_metrics.channel_views / 10000 * 100)).toFixed(0)}%</span>
                        </div>
                        <div class="progress-track">
                            <div class="progress-fill" style="width: ${Math.min(100, (data.user_metrics.channel_views / 10000 * 100))}%"></div>
                        </div>
                    </div>
                `;
            }
        } catch (err) {
            console.error('Eligibility load error:', err);
        }
    }

    // Modal Control
    const modal = document.getElementById('topup-modal');
    const openBtn = document.getElementById('open-topup-modal');
    const closeBtn = document.getElementById('close-modal');

    if (openBtn && modal) {
        openBtn.addEventListener('click', () => modal.classList.add('active'));
    }
    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    }

    loadBalance();
    loadRates();
});
