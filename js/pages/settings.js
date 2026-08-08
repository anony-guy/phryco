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

        loadDiscordConnectionStatus();
    } catch (e) {
        console.error("Failed to load settings", e);
        // Toast notification could go here
    }

    async function loadDiscordConnectionStatus() {
        const connectionsContainer = document.getElementById('connections-container');
        if (!connectionsContainer) return;
        
        try {
            const discordData = await apiFetch('/api/discord/me');
            if (discordData.is_connected) {
                connectionsContainer.innerHTML = `
                    <div style="background: rgba(88, 101, 242, 0.1); border: 1px solid rgba(88, 101, 242, 0.3); border-radius: var(--radius-md); padding: 1.25rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                            <div style="display: flex; align-items: center; gap: 0.75rem;">
                                <div style="background: #5865F2; color: white; width: 42px; height: 42px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.2rem;">
                                    D
                                </div>
                                <div>
                                    <div style="font-weight: 700; color: white; font-size: 1.05rem;">Connected to Discord</div>
                                    <div style="font-size: 0.85rem; color: #a5b4fc; font-weight: 600;">@${discordData.discord_username || 'Discord User'} (ID: ${discordData.discord_user_id})</div>
                                </div>
                            </div>
                            <button id="btn-disconnect-discord" style="background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); padding: 0.5rem 1rem; border-radius: var(--radius-sm); font-weight: 700; cursor: pointer; transition: all 0.2s;">Disconnect</button>
                        </div>
                        <div style="margin-top: 1rem; padding-top: 0.75rem; border-top: 1px dashed rgba(255,255,255,0.1); font-size: 0.8rem; color: #10b981; font-weight: 600; display: flex; align-items: center; gap: 0.4rem;">
                            <i data-lucide="check-circle" style="width: 16px; height: 16px;"></i> Discord Linked Roles Active (Supporter, Creator Status, & Phrybucks Balance synchronized)
                        </div>
                    </div>
                `;
                
                const disconnectBtn = document.getElementById('btn-disconnect-discord');
                if (disconnectBtn) {
                    disconnectBtn.addEventListener('click', async () => {
                        if (!confirm("Are you sure you want to disconnect your Discord account? Linked Roles will be unlinked.")) return;
                        try {
                            disconnectBtn.textContent = "Disconnecting...";
                            disconnectBtn.disabled = true;
                            await apiFetch('/api/discord/disconnect', { method: 'POST' });
                            loadDiscordConnectionStatus();
                        } catch (err) {
                            alert("Failed to disconnect Discord account.");
                            disconnectBtn.textContent = "Disconnect";
                            disconnectBtn.disabled = false;
                        }
                    });
                }
            } else {
                connectionsContainer.innerHTML = `
                    <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: var(--radius-md); padding: 1.25rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                        <div>
                            <div style="font-weight: 700; color: white; font-size: 1rem; margin-bottom: 0.25rem;">Discord Integration & Linked Roles</div>
                            <div style="font-size: 0.85rem; color: var(--text-secondary);">Connect your Discord account to display your Phryco Supporter tier, Creator badges, and Phrybucks metrics on Discord.</div>
                        </div>
                        <a href="/api/discord/user-connect" style="background: #5865F2; color: white; text-decoration: none; padding: 0.6rem 1.25rem; border-radius: var(--radius-md); font-weight: 700; font-size: 0.9rem; display: inline-flex; align-items: center; gap: 0.5rem; transition: background 0.2s;">
                            <i data-lucide="bot" style="width: 18px; height: 18px;"></i> Connect Discord Account
                        </a>
                    </div>
                `;
            }
            if (typeof lucide !== 'undefined') lucide.createIcons();
        } catch (err) {
            console.error("Failed to load Discord connection status:", err);
            connectionsContainer.innerHTML = `<p style="color: var(--text-secondary); font-size: 0.875rem;">Unable to load connected applications.</p>`;
        }
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
                connectionsContainer.innerHTML = `<p style="color: var(--text-secondary); font-size: 0.875rem;">You haven't connected any third-party applications.</p>`;
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
    loadEconomyAndAlts();

    async function loadEconomyAndAlts() {
        const milestonesContainer = document.getElementById('milestones-container');
        const p2pLockStatus = document.getElementById('p2p-lock-status');
        const clusterBadge = document.getElementById('cluster-id-badge');
        const altAccountsList = document.getElementById('alt-accounts-list');
        const linkAltBtn = document.getElementById('link-alt-btn');

        try {
            let fp = localStorage.getItem('phryco_vg_fp');
            if (!fp) {
                fp = 'vg_' + Math.random().toString(36).substring(2, 10) + '_' + (navigator.userAgent || '').length;
                localStorage.setItem('phryco_vg_fp', fp);
            }
            await apiFetch('/api/users/me/vaultguard', {
                method: 'POST',
                body: { fingerprint: fp }
            });
        } catch (e) {
            console.warn("VaultGuard telemetry reporting failed:", e);
        }

        try {
            const [profile, altsData] = await Promise.all([
                apiFetch('/api/users/me'),
                apiFetch('/api/users/me/alts')
            ]);

            if (milestonesContainer) {
                const availableMilestones = [
                    { id: "first_upload", name: "First Upload", reward: "+25 PB", desc: "Upload 1+ videos" },
                    { id: "10_subscribers", name: "10 Subscribers", reward: "+50 PB", desc: "Reach 10 channel subs" },
                    { id: "50_subscribers", name: "50 Subscribers", reward: "+150 PB", desc: "Reach 50 channel subs" },
                    { id: "100_views", name: "100 Total Views", reward: "+100 PB", desc: "Receive 100+ views" }
                ];
                const achieved = profile.milestones || [];
                
                milestonesContainer.innerHTML = availableMilestones.map(m => {
                    const isCompleted = achieved.includes(m.id);
                    return `
                        <div style="background: rgba(255,255,255,0.03); border: 1px solid ${isCompleted ? '#10b981' : 'rgba(255,255,255,0.08)'}; border-radius: var(--radius-md); padding: 1rem; position: relative; overflow: hidden;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                                <span style="font-weight: 700; font-size: 0.9rem; color: white;">${m.name}</span>
                                <span style="font-size: 0.75rem; font-weight: 700; background: ${isCompleted ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.08)'}; color: ${isCompleted ? '#10b981' : 'var(--text-tertiary)'}; padding: 0.2rem 0.5rem; border-radius: 4px;">${m.reward}</span>
                            </div>
                            <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0;">${m.desc}</p>
                            <div style="margin-top: 0.75rem; font-size: 0.75rem; font-weight: 700; color: ${isCompleted ? '#10b981' : '#f59e0b'}; display: flex; align-items: center; gap: 0.35rem;">
                                ${isCompleted ? '<i data-lucide="check-circle" style="width:14px; height:14px;"></i> Verified & Paid' : '<i data-lucide="clock" style="width:14px; height:14px;"></i> In Progress'}
                            </div>
                        </div>
                    `;
                }).join('');
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }

            if (p2pLockStatus) {
                const achievedCount = (profile.milestones || []).length;
                if (profile.role === 'ADMIN' || profile.role === 'OWNER' || achievedCount > 0) {
                    p2pLockStatus.textContent = "Unlocked (Verified)";
                    p2pLockStatus.style.color = "#10b981";
                } else {
                    p2pLockStatus.textContent = "Locked (Milestone Needed)";
                    p2pLockStatus.style.color = "#ef4444";
                }
            }

            if (clusterBadge) {
                clusterBadge.textContent = altsData.cluster_id || "Standalone / Protected";
            }

            if (altAccountsList) {
                altAccountsList.innerHTML = altsData.accounts.map(acc => `
                    <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 0.75rem 1rem; border-radius: var(--radius-md);">
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <div style="width: 36px; height: 36px; border-radius: 50%; background: #38bdf8; color: #0f172a; display: flex; align-items: center; justify-content: center; font-weight: 800; text-transform: uppercase;">
                                ${acc.username.charAt(0)}
                            </div>
                            <div>
                                <div style="font-weight: 700; color: white;">${acc.username} ${acc.is_current ? '<span style="font-size: 0.7rem; background: #8b5cf6; color: white; padding: 0.15rem 0.5rem; border-radius: 8px; margin-left: 0.4rem;">ACTIVE</span>' : ''}</div>
                                <div style="font-size: 0.75rem; color: #10b981; font-weight: 600;">Balance: ${acc.phrybucks_balance.toFixed(2)} PB</div>
                            </div>
                        </div>
                        <div>
                            ${acc.is_current ? '<span style="color: var(--text-tertiary); font-size: 0.8rem; font-weight: 600;">Currently Logged In</span>' : `<button class="btn-switch-account" data-username="${acc.username}" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); padding: 0.4rem 0.8rem; border-radius: var(--radius-sm); font-size: 0.8rem; font-weight: 700; cursor: pointer; transition: all 0.2s;">Switch</button>`}
                        </div>
                    </div>
                `).join('');

                document.querySelectorAll('.btn-switch-account').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const targetUser = e.target.getAttribute('data-username');
                        alert(`To switch to account '${targetUser}', please re-authenticate on the login screen with your credentials or VaultGuard token.`);
                        localStorage.removeItem('phryco_token');
                        window.location.href = '../../pages/login/index.html';
                    });
                });
            }
        } catch (e) {
            console.error("Failed to load economy & alt account data:", e);
            if (altAccountsList) altAccountsList.innerHTML = '<p style="color: #ef4444; font-size: 0.875rem;">Error loading linked accounts.</p>';
        }

        if (linkAltBtn) {
            linkAltBtn.addEventListener('click', async () => {
                const userVal = document.getElementById('alt-username-input').value.trim();
                const passVal = document.getElementById('alt-password-input').value;
                if (!userVal || !passVal) {
                    alert("Please provide both username and password for the account to link.");
                    return;
                }
                try {
                    linkAltBtn.textContent = "Linking...";
                    linkAltBtn.disabled = true;
                    const resp = await apiFetch('/api/users/me/link_alt', {
                        method: 'POST',
                        body: { username: userVal, password: passVal }
                    });
                    alert(resp.message);
                    document.getElementById('alt-username-input').value = "";
                    document.getElementById('alt-password-input').value = "";
                    loadEconomyAndAlts();
                } catch (err) {
                    alert("Error: " + (err.detail || err.message || "Failed to link account. Check credentials."));
                } finally {
                    linkAltBtn.textContent = "Link Account";
                    linkAltBtn.disabled = false;
                }
            });
        }
    }
});
