import { API_BASE_URL } from '../utils/config.js';
import { renderHeader } from '../../relay-dashboard/js/components/header.js';

async function checkAuth() {
    const token = localStorage.getItem('relay_sso_token');
    if (!token) return null;
    try {
        const res = await fetch(`${API_BASE_URL}/api/sso/userinfo`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            return await res.json();
        } else {
            localStorage.removeItem('relay_sso_token');
            return null;
        }
    } catch (e) {
        return null;
    }
}

let currentUser = null;

async function initDeveloperPortal() {
    currentUser = await checkAuth();
    if (!currentUser) {
        window.location.href = '/relay-dashboard/login.html';
        return;
    }
    
    document.getElementById('dashboard-body').style.display = 'block';
    renderHeader(currentUser);
    
    loadApps();

    document.getElementById('register-app-btn').addEventListener('click', registerApp);
}

async function loadApps() {
    const token = localStorage.getItem('relay_sso_token');
    try {
        const res = await fetch(`${API_BASE_URL}/api/sso/clients`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const apps = await res.json();
            const tbody = document.getElementById('apps-table-body');
            tbody.innerHTML = '';
            
            if (apps.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">You have not registered any apps yet.</td></tr>';
                return;
            }
            
            apps.forEach(app => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${app.name}</strong></td>
                    <td><code>${app.client_id}</code></td>
                    <td><code>${app.redirect_uris}</code><br><span style="font-size: 11px; color: #5f6368;">Scopes: ${app.allowed_scopes}</span></td>
                    <td style="display: flex; gap: 8px;">
                        <button class="btn btn-secondary" style="padding: 4px 12px;" onclick="showSecret('${app.client_secret}')">Reveal Secret</button>
                        <button class="btn btn-secondary" style="color: red; border-color: red; padding: 4px 12px;" onclick="deleteApp('${app.client_id}')">Delete</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (e) {
        console.error(e);
    }
}

async function registerApp() {
    const name = document.getElementById('new-app-name').value;
    const redirect_uris = document.getElementById('new-app-redirect').value;
    
    // Get all checked scopes
    const scopeCheckboxes = document.querySelectorAll('input[name="scopes"]:checked');
    const allowed_scopes = Array.from(scopeCheckboxes).map(cb => cb.value).join(' ');
    
    if (!name || !redirect_uris) {
        alert("Please provide both name and redirect URI.");
        return;
    }
    
    const token = localStorage.getItem('relay_sso_token');
    try {
        const res = await fetch(`${API_BASE_URL}/api/sso/clients`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name, redirect_uris, allowed_scopes })
        });
        
        if (res.ok) {
            document.getElementById('new-app-name').value = '';
            document.getElementById('new-app-redirect').value = '';
            loadApps();
            alert("App registered successfully! Please store your client_secret securely.");
        } else {
            const err = await res.json();
            alert("Failed to register app: " + (err.detail || "Unknown error"));
        }
    } catch (e) {
        console.error(e);
    }
}

window.showSecret = function(secret) {
    alert("Your Client Secret is:\n\n" + secret + "\n\nStore this securely, it is required for token exchanges.");
};

window.deleteApp = async function(client_id) {
    if (!confirm("Are you sure you want to delete this app? This will break SSO for all its users.")) return;
    
    const token = localStorage.getItem('relay_sso_token');
    try {
        const res = await fetch(`${API_BASE_URL}/api/sso/clients/${client_id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
            loadApps();
        } else {
            alert("Failed to delete app.");
        }
    } catch (e) {
        console.error(e);
    }
};

window.addEventListener('DOMContentLoaded', initDeveloperPortal);
