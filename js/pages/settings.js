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
});
