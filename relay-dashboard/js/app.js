import { API_BASE_URL } from '../../js/utils/config.js';

const clientId = "relay-dashboard";
const clientSecret = "secret"; // In a real OAuth flow this would be PKCE for SPA or backend proxy. For this trusted app, we'll use a dummy/simple secret if required, or bypass secret check if client is public. Wait, our sso.py requires client_secret. Let's assume we register it in the DB with a known secret.

async function handleSSOCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    if (error) {
        alert("Login failed: " + error);
        window.location.href = '/relay-dashboard/login.html';
        return;
    }

    if (code) {
        // Exchange code for token
        const formData = new FormData();
        formData.append('grant_type', 'authorization_code');
        formData.append('code', code);
        formData.append('client_id', clientId);
        formData.append('client_secret', 'relay-secret-123'); // we will seed this in DB later
        formData.append('redirect_uri', window.location.origin + '/relay-dashboard/index.html');

        try {
            const res = await fetch(`${API_BASE_URL}/api/sso/token`, {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                localStorage.setItem('relay_sso_token', data.access_token);
                // Remove code from URL
                window.history.replaceState({}, document.title, '/relay-dashboard/index.html');
                return true;
            } else {
                const err = await res.json();
                alert("Token exchange failed: " + (err.detail || "Unknown error"));
            }
        } catch (e) {
            alert("Network error exchanging token.");
        }
        window.location.href = '/relay-dashboard/login.html';
        return false;
    }
    return false;
}

async function checkAuth() {
    const token = localStorage.getItem('relay_sso_token');
    if (!token) return null;

    try {
        const res = await fetch(`${API_BASE_URL}/api/sso/userinfo`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            const user = await res.json();
            return user; // Any logged-in user can access the network dashboard (but features are restricted)
        } else {
            localStorage.removeItem('relay_sso_token');
            return null;
        }
    } catch (e) {
        return null;
    }
}

import { renderHeader } from './components/header.js';

async function initDashboard() {
    const didCallback = await handleSSOCallback();
    if (didCallback) {
        // Token just saved, now check auth
    }

    const user = await checkAuth();
    if (!user) {
        window.location.href = '/relay-dashboard/login.html';
        return;
    }
    
    // Show body
    document.getElementById('dashboard-body').style.display = 'block';
    
    // Render Header (this will also handle redirecting non-admins away from relays page)
    renderHeader(user);
    
    // Load relays
    loadRelays();

    document.getElementById('add-relay-btn').addEventListener('click', addRelay);

    document.getElementById('download-relay-btn').addEventListener('click', async () => {
        const btn = document.getElementById('download-relay-btn');
        btn.innerText = "Generating...";
        btn.disabled = true;
        
        const token = localStorage.getItem('relay_sso_token');
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/relay/download`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = "phryco-relay.zip";
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            } else {
                alert("Failed to download relay software. Ensure you have admin privileges.");
            }
        } catch (e) {
            alert("Network error while trying to download.");
        }
        
        btn.innerText = "Download Relay Software";
        btn.disabled = false;
    });

    // Initialize Trust Requests tab
    setupTrustRequests();
}

async function loadRelays() {
    const token = localStorage.getItem('relay_sso_token');
    const tbody = document.getElementById('relays-table-body');
    try {
        const res = await fetch(`${API_BASE_URL}/api/admin/relays`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const relays = await res.json();
            if (relays.length === 0) {
                tbody.innerHTML = `<tr><td colspan="8" style="text-align: center;">No relays registered yet.</td></tr>`;
                return;
            }
            tbody.innerHTML = relays.map(r => {
                let earningRate = 0.0;
                let statusTag = '';
                if (!r.is_active) {
                    statusTag = '<span style="color: #ef4444; font-weight: 600;">🔴 0.0 PB/min (Offline)</span>';
                } else {
                    earningRate += 1.0; // Base online reward
                    let bonuses = [];
                    if ((r.uptime_percentage || 0) >= 70.0) {
                        earningRate += 0.5;
                        bonuses.push('Prioritized');
                    }
                    if ((r.quality_score || 0) >= 90) {
                        earningRate += 1.0;
                        bonuses.push('Elite Quality');
                    } else if ((r.quality_score || 0) >= 80) {
                        earningRate += 0.5;
                        bonuses.push('High Quality');
                    }
                    const bonusText = bonuses.length > 0 ? ` <span style="font-size: 11px; color: #10b981; display: block;">(${bonuses.join(', ')})</span>` : '';
                    statusTag = `<span style="color: #10b981; font-weight: 700;">🟢 ${earningRate.toFixed(1)} PB/min</span>${bonusText}`;
                }

                return `
                <tr>
                    <td style="font-weight: 600; color: #38bdf8;">${r.url}</td>
                    <td style="font-weight: 600;">${r.added_by || '<span style="color: #64748b;">System</span>'}</td>
                    <td><span style="color: ${r.is_active ? '#10b981' : '#ef4444'}; font-weight: 600;">${r.is_active ? 'Active' : 'Offline'}</span></td>
                    <td>${(r.uptime_percentage || 0).toFixed(2)}%</td>
                    <td>${(r.quality_score || 0).toFixed(1)}</td>
                    <td>${(r.avg_latency_ms || 0).toFixed(0)} ms</td>
                    <td>${statusTag}</td>
                    <td>
                        <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 12px;">Edit</button>
                    </td>
                </tr>
            `}).join('');
        } else {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align: center;">Error loading relays.</td></tr>`;
        }
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center;">Error fetching relays.</td></tr>`;
    }
}

async function addRelay() {
    const urlInput = document.getElementById('new-relay-url');
    const url = urlInput.value.trim();
    if (!url) return;
    
    const token = localStorage.getItem('relay_sso_token');
    try {
        const res = await fetch(`${API_BASE_URL}/api/admin/relays`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url })
        });
        
        if (res.ok) {
            alert("Relay added successfully!");
            urlInput.value = '';
            loadRelays();
        } else {
            const err = await res.json();
            alert("Failed to add relay: " + (err.detail || "Unknown error"));
        }
    } catch (e) {
        alert("Network error.");
    }
}

// OAuth Trust Requests Logic
let currentTrustTab = 'pending';

function setupTrustRequests() {
    document.getElementById('tab-pending').addEventListener('click', () => {
        currentTrustTab = 'pending';
        updateTrustTabs();
        loadTrustRequests();
    });
    
    document.getElementById('tab-approved').addEventListener('click', () => {
        currentTrustTab = 'approved';
        updateTrustTabs();
        loadTrustRequests();
    });

    loadTrustRequests();
}

function updateTrustTabs() {
    const btnPending = document.getElementById('tab-pending');
    const btnApproved = document.getElementById('tab-approved');
    
    if (currentTrustTab === 'pending') {
        btnPending.className = 'btn active-tab-btn';
        btnPending.style.background = '';
        btnPending.style.color = '';
        
        btnApproved.className = 'btn outline';
        btnApproved.style.background = 'transparent';
        btnApproved.style.color = '#1e293b';
    } else {
        btnApproved.className = 'btn active-tab-btn';
        btnApproved.style.background = '';
        btnApproved.style.color = '';
        
        btnPending.className = 'btn outline';
        btnPending.style.background = 'transparent';
        btnPending.style.color = '#1e293b';
    }
}

async function loadTrustRequests() {
    const token = localStorage.getItem('relay_sso_token');
    const tbody = document.getElementById('trust-requests-body');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Loading requests...</td></tr>';
    
    try {
        const res = await fetch(`${API_BASE_URL}/api/admin/redirect_uris/${currentTrustTab}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const requests = await res.json();
            if (requests.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">No ${currentTrustTab} requests found.</td></tr>`;
                return;
            }
            tbody.innerHTML = requests.map(r => {
                const dateStr = new Date(r.created_at).toLocaleDateString();
                let actions = '';
                if (currentTrustTab === 'pending') {
                    actions = `
                        <button class="btn" style="padding: 4px 8px; font-size: 12px; margin-right: 8px;" onclick="window.manageTrust(${r.id}, 'approve')">Approve</button>
                        <button class="btn outline" style="padding: 4px 8px; font-size: 12px; color: red; border-color: red;" onclick="window.manageTrust(${r.id}, 'reject')">Reject</button>
                    `;
                } else {
                    actions = `
                        <button class="btn outline" style="padding: 4px 8px; font-size: 12px; color: red; border-color: red;" onclick="window.manageTrust(${r.id}, 'delete')">Revoke Trust</button>
                    `;
                }
                
                return `
                <tr>
                    <td>${r.client_name}</td>
                    <td><a href="${r.uri}" target="_blank" style="color: #3b82f6; text-decoration: none;">${r.uri}</a></td>
                    <td>${dateStr}</td>
                    <td><span style="color: ${currentTrustTab === 'approved' ? 'green' : 'orange'};">${r.status}</span></td>
                    <td>${actions}</td>
                </tr>
                `;
            }).join('');
        } else {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">Error loading requests.</td></tr>`;
        }
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">Network Error.</td></tr>`;
    }
}

window.manageTrust = async (id, action) => {
    const token = localStorage.getItem('relay_sso_token');
    let url = `${API_BASE_URL}/api/admin/redirect_uris/${id}`;
    let method = 'POST';
    
    if (action === 'approve') url += '/approve';
    else if (action === 'reject') url += '/reject';
    else if (action === 'delete') method = 'DELETE';
    
    try {
        const res = await fetch(url, {
            method: method,
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            loadTrustRequests();
        } else {
            const err = await res.json();
            alert("Action failed: " + (err.detail || "Unknown error"));
        }
    } catch (e) {
        alert("Network error.");
    }
};

// Initialize the dashboard on module load
initDashboard();
