import { apiFetch } from '../api/client.js';

let initialBirthDate = null;

document.addEventListener('DOMContentLoaded', async () => {
    const showAdsToggle = document.getElementById('show-ads-toggle');
    const birthDateInput = document.getElementById('birth-date-input');
    const religionSelect = document.getElementById('religion-select');
    const halalModeContainer = document.getElementById('halal-mode-container');
    const halalModeToggle = document.getElementById('halal-mode-toggle');
    const emailInput = document.getElementById('email-input');
    const emailStatus = document.getElementById('email-status');
    const resendVerificationBtn = document.getElementById('resend-verification-btn');
    const saveBtn = document.getElementById('save-settings-btn');
    
    // Check auth
    const token = localStorage.getItem('phryco_token');
    if (!token) {
        window.location.href = '../../pages/login/index.html';
        return;
    }
    
    function updateHalalModeVisibility() {
        if (religionSelect.value === 'Islam') {
            halalModeContainer.style.display = 'flex';
        } else {
            halalModeContainer.style.display = 'none';
            halalModeToggle.checked = false;
        }
    }
    
    religionSelect.addEventListener('change', updateHalalModeVisibility);
    
    // Load Settings & Profile
    try {
        const [settings, profile] = await Promise.all([
            apiFetch('/api/users/me/settings'),
            apiFetch('/api/users/me')
        ]);
        
        showAdsToggle.checked = settings.show_ads;
        if (settings.religion) {
            religionSelect.value = settings.religion;
        }
        halalModeToggle.checked = settings.halal_mode;
        
        if (settings.email) {
            emailInput.value = settings.email;
        }
        
        if (settings.is_verified) {
            emailStatus.textContent = "Verified";
            emailStatus.style.color = "#10b981";
            resendVerificationBtn.style.display = 'none';
        } else if (settings.email) {
            emailStatus.textContent = "Unverified (Check your inbox)";
            emailStatus.style.color = "#ef4444";
            resendVerificationBtn.style.display = 'inline-block';
        } else {
            emailStatus.textContent = "Unverified";
            emailStatus.style.color = "#ef4444";
            resendVerificationBtn.style.display = 'none';
        }
        
        updateHalalModeVisibility();
        
        if (profile.birth_date) {
            birthDateInput.value = profile.birth_date;
            birthDateInput.disabled = true;
            initialBirthDate = profile.birth_date;
        }
    } catch (e) {
        console.error("Failed to load settings", e);
        // Toast notification could go here
    }
    
    // Resend Verification
    resendVerificationBtn.addEventListener('click', async () => {
        try {
            resendVerificationBtn.textContent = "Sending...";
            resendVerificationBtn.disabled = true;
            await apiFetch('/api/users/me/resend-verification', { method: 'POST' });
            alert("Verification email has been resent.");
        } catch (e) {
            console.error(e);
            alert("Failed to resend verification email.");
        } finally {
            resendVerificationBtn.textContent = "Resend Email";
            resendVerificationBtn.disabled = false;
        }
    });

    // Save Settings
    saveBtn.addEventListener('click', async () => {
        saveBtn.textContent = 'Saving...';
        saveBtn.disabled = true;
        
        try {
            const payload = {
                show_ads: showAdsToggle.checked,
                religion: religionSelect.value || null,
                halal_mode: halalModeToggle.checked,
                email: emailInput.value.trim() || null
            };
            
            if (!initialBirthDate && birthDateInput.value) {
                payload.birth_date = birthDateInput.value;
            }
            
            const response = await apiFetch('/api/users/me/settings', {
                method: 'PUT',
                body: payload
            });
            
            if (response.birth_date) {
                initialBirthDate = response.birth_date;
                birthDateInput.value = initialBirthDate;
                birthDateInput.disabled = true;
            }
            
            // Also update the cached user data
            const currentUser = JSON.parse(localStorage.getItem('phryco_user') || '{}');
            currentUser.religion = response.religion;
            currentUser.halal_mode = response.halal_mode;
            localStorage.setItem('phryco_user', JSON.stringify(currentUser));
            
            if (response.email) {
                emailInput.value = response.email;
            }
            if (response.is_verified) {
                emailStatus.textContent = "Verified";
                emailStatus.style.color = "#10b981";
                resendVerificationBtn.style.display = 'none';
            } else if (response.email) {
                emailStatus.textContent = "Unverified (Check your inbox)";
                emailStatus.style.color = "#ef4444";
                resendVerificationBtn.style.display = 'inline-block';
            }
            
            alert('Settings saved successfully!');
        } catch (e) {
            console.error(e);
            alert('Failed to save settings.');
        } finally {
            saveBtn.textContent = 'Save Changes';
            saveBtn.disabled = false;
        }
    });

    // Load Connections
    const connectionsContainer = document.getElementById('connections-container');
    
    async function loadConnections() {
        if (!connectionsContainer) return;
        
        try {
            const connections = await apiFetch('/api/users/me/connections');
            if (connections.length === 0) {
                connectionsContainer.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.875rem;">You haven\\'t connected any third-party applications.</p>';
                return;
            }
            
            connectionsContainer.innerHTML = '';
            connections.forEach(conn => {
                const item = document.createElement('div');
                item.className = 'setting-item';
                
                const grantedDate = new Date(conn.granted_at).toLocaleDateString();
                
                item.innerHTML = `
                    <div class="setting-info">
                        <h3>${conn.name}</h3>
                        <p>Scopes: ${conn.scopes}</p>
                        <p style="font-size: 0.75rem; margin-top: 0.25rem;">Authorized on: ${grantedDate}</p>
                    </div>
                    <div class="setting-action">
                        <button class="btn-revoke" data-client-id="${conn.client_id}" style="background: var(--bg-tertiary); color: #ef4444; border: 1px solid #ef4444; padding: 0.5rem 1rem; border-radius: var(--radius-md); font-weight: 600; cursor: pointer; transition: all 0.2s ease;">Revoke Access</button>
                    </div>
                `;
                connectionsContainer.appendChild(item);
            });
            
            // Add revoke listeners
            document.querySelectorAll('.btn-revoke').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const clientId = e.target.getAttribute('data-client-id');
                    if (confirm('Are you sure you want to revoke access for this application?')) {
                        try {
                            e.target.disabled = true;
                            e.target.textContent = 'Revoking...';
                            await apiFetch(`/api/users/me/connections/${clientId}`, { method: 'DELETE' });
                            loadConnections(); // Reload list
                        } catch (err) {
                            console.error(err);
                            alert('Failed to revoke access.');
                            e.target.disabled = false;
                            e.target.textContent = 'Revoke Access';
                        }
                    }
                });
            });
        } catch (e) {
            console.error(e);
            if (connectionsContainer) {
                connectionsContainer.innerHTML = '<p style="color: #ef4444; font-size: 0.875rem;">Failed to load connections.</p>';
            }
        }
    }
    
    // Trigger load
    loadConnections();
});
