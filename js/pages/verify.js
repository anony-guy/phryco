import { apiFetch } from '../api/client.js';

document.addEventListener('DOMContentLoaded', async () => {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
        document.getElementById('loading-state').style.display = 'none';
        document.getElementById('error-state').style.display = 'block';
        document.getElementById('error-msg').textContent = 'No verification token provided in the URL.';
        return;
    }

    try {
        const data = await apiFetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
        
        document.getElementById('loading-state').style.display = 'none';
        document.getElementById('success-state').style.display = 'block';
        // if it was already verified, we can still show success
    } catch (error) {
        document.getElementById('loading-state').style.display = 'none';
        document.getElementById('error-state').style.display = 'block';
        document.getElementById('error-msg').textContent = error.message;
    }
});
