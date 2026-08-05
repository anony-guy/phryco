import { apiFetch } from '../../api/client.js';
import { API_BASE_URL } from '../../utils/config.js';
import { escapeHTML, renderCreatorBadges } from '../../utils/security.js';

async function loadAnalytics() {
    try {
        const data = await apiFetch('/api/studio/analytics');
        document.getElementById('stat-views').textContent = data.total_views.toLocaleString();
        document.getElementById('stat-likes').textContent = data.total_likes.toLocaleString();
        document.getElementById('stat-phrybucks').textContent = `${data.phrybucks_balance.toLocaleString()} PB`;
        
        if (document.getElementById('stat-free-uploads')) {
            document.getElementById('stat-free-uploads').textContent = data.free_uploads_remaining !== undefined ? data.free_uploads_remaining : 3;
        }
        if (document.getElementById('grant-badge')) {
            if (data.received_bootstrap_grant) {
                const badge = document.getElementById('grant-badge');
                badge.textContent = '✨ +50 PB Grant Claimed!';
                badge.style.background = 'rgba(16, 185, 129, 0.15)';
                badge.style.borderColor = '#10b981';
                badge.style.color = '#10b981';
            }
        }
        
        // Decoding JWT to get username for the UI
        let username = "";
        const token = localStorage.getItem('phryco_token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                username = payload.sub;
                document.getElementById('channel-name').innerHTML = `${escapeHTML(username)}'s Channel${renderCreatorBadges(data, true)}`;
                
                // Try to load custom avatar and banner
                const avatarEl = document.getElementById('avatar-placeholder');
                const bannerEl = document.getElementById('banner-placeholder');
                
                const encodedUsername = encodeURIComponent(username);
                const avatarUrl = `${API_BASE_URL}/api/users/${encodedUsername}/avatar?t=${Date.now()}`;
                const bannerUrl = `${API_BASE_URL}/api/users/${encodedUsername}/banner?t=${Date.now()}`;
                
                // Set images directly, if 404 they will just fail and keep background
                const avatarImg = new Image();
                avatarImg.onload = () => { avatarEl.innerHTML = `<img src="${avatarUrl}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`; };
                avatarImg.src = avatarUrl;
                
                const bannerImg = new Image();
                bannerImg.onload = () => { bannerEl.style.backgroundImage = `url("${bannerUrl}")`; bannerEl.innerHTML = ''; };
                bannerImg.src = bannerUrl;

            } catch (e) {}
        }
    } catch (error) {
        console.error("Failed to load analytics", error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadAnalytics();
    
    // Handle Uploads
    async function handleUpload(inputId, endpoint) {
        const input = document.getElementById(inputId);
        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const formData = new FormData();
            formData.append('file', file);
            
            try {
                const token = localStorage.getItem('phryco_token');
                const response = await fetch(`${API_BASE_URL}/api/studio/channel/${endpoint}`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
                
                if (!response.ok) throw new Error(await response.text());
                
                alert("Upload successful!");
                // Reload images
                loadAnalytics();
            } catch (error) {
                alert("Upload failed: " + error.message);
            }
        });
    }

    handleUpload('avatar-input', 'avatar');
    handleUpload('banner-input', 'banner');
});
